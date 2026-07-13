import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempDirectory = await mkdtemp(join(tmpdir(), "penglai-classroom-load-"));
const sampleMs = Number.parseInt(process.env.LOAD_PROBE_SAMPLE_MS ?? "5000", 10);
const scenarios = [10, 30, 40];
const reports = [];

try {
  for (const playerCount of scenarios) {
    reports.push(await runScenario(playerCount));
  }
  console.log("\nClassroom load probe passed.");
  console.log(JSON.stringify({ sampleMs, reports }, null, 2));
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}

async function runScenario(playerCount) {
  const port = await getFreePort();
  const httpUrl = `http://127.0.0.1:${port}`;
  const wsUrl = `ws://127.0.0.1:${port}`;
  const databasePath = join(tempDirectory, `load-${playerCount}.sqlite`);
  const backupDirectory = join(tempDirectory, `backups-${playerCount}`);
  const adminToken = `classroom_load_${playerCount}_secure_token`;
  const serverOutput = [];
  const server = spawn(
    process.execPath,
    [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "server/src/index.ts"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(port),
        PENGLAI_DB_PATH: databasePath,
        PENGLAI_BACKUP_DIR: backupDirectory,
        ADMIN_TOKEN: adminToken
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

  let clients = [];
  try {
    await waitForHealth(server, httpUrl);
    clients = await Promise.all(
      Array.from({ length: playerCount }, (_, index) => connectClient(wsUrl, playerCount, index + 1))
    );
    await wait(600);

    const before = await fetchLoadStats(httpUrl);
    for (const client of clients) {
      client.state.snapshots = 0;
      client.state.receivedBytes = 0;
    }

    let activityStep = 0;
    const activityTimer = setInterval(() => {
      activityStep += 1;
      for (const { ws, state } of clients) {
        const direction = (activityStep + state.index) % 24 < 12 ? 1 : -1;
        state.x += direction * 1.5;
        ws.send(JSON.stringify({
          type: "player:update",
          player: {
            id: state.playerId,
            name: `負載測試${state.index}`,
            className: "swordsman",
            mapId: "fog-harbor-test",
            x: state.x,
            y: 430,
            facing: direction > 0 ? "right" : "left",
            animation: "run"
          }
        }));
      }
    }, 100);

    await wait(sampleMs);
    clearInterval(activityTimer);
    const after = await fetchLoadStats(httpUrl);
    const classroomAdmin = await fetchClassroomProgress(httpUrl, adminToken);
    const report = buildReport(playerCount, before, after, clients, classroomAdmin);
    printReport(report);
    assertReport(report, after);
    return report;
  } catch (error) {
    if (serverOutput.join("").trim()) {
      console.error(`\n${playerCount}-player server output:\n${serverOutput.join("").trim()}`);
    }
    throw error;
  } finally {
    await closeClients(clients);
    await stopProcess(server);
  }
}

function connectClient(wsUrl, playerCount, index) {
  return new Promise((resolveConnect, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=classroom-load-${playerCount}-${index}-${Date.now()}`);
    const state = {
      index,
      playerId: "",
      x: 260 + (index % 20) * 3,
      snapshots: 0,
      receivedBytes: 0
    };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`${playerCount}-player probe client ${index} welcome timed out`));
    }, 6000);

    ws.on("message", (data) => {
      state.receivedBytes += data.length;
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome") {
        state.playerId = message.playerId;
        clearTimeout(timer);
        resolveConnect({ ws, state });
        return;
      }
      if (message.type === "world:snapshot") {
        state.snapshots += 1;
      }
    });
    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function buildReport(playerCount, before, after, clients, classroomAdmin) {
  const seconds = sampleMs / 1000;
  const tickSamples = after.tick.samples - before.tick.samples;
  const tickDurationMs = after.tick.totalDurationMs - before.tick.totalDurationMs;
  const scheduleDelayMs = after.tick.totalScheduleDelayMs - before.tick.totalScheduleDelayMs;
  const passes = after.broadcast.passes - before.broadcast.passes;
  const serializations = after.broadcast.snapshotSerializations - before.broadcast.snapshotSerializations;
  const messages = after.broadcast.snapshotMessages - before.broadcast.snapshotMessages;
  const bytes = after.broadcast.snapshotBytes - before.broadcast.snapshotBytes;
  const saveAttempts = after.saves.attempts - before.saves.attempts;
  const saveFailures = after.saves.failures - before.saves.failures;
  const saveDurationSamples = after.saves.durationSamples - before.saves.durationSamples;
  const saveDurationMs = after.saves.totalDurationMs - before.saves.totalDurationMs;
  const receivedBytes = clients.reduce((total, client) => total + client.state.receivedBytes, 0);
  const snapshotCount = clients.reduce((total, client) => total + client.state.snapshots, 0);

  return {
    players: playerCount,
    sampleSeconds: seconds,
    online: after.broadcast.online,
    activeMaps: after.broadcast.activeMaps,
    tickRateHz: tickSamples / seconds,
    averageTickDurationMs: tickSamples > 0 ? tickDurationMs / tickSamples : 0,
    averageScheduleDelayMs: tickSamples > 0 ? scheduleDelayMs / tickSamples : 0,
    maxTickDurationMs: after.tick.maxDurationMs,
    maxScheduleDelayMs: after.tick.maxScheduleDelayMs,
    serializationsPerPass: passes > 0 ? serializations / passes : 0,
    messagesPerPass: passes > 0 ? messages / passes : 0,
    serverBytesPerClientPerSecond: bytes / playerCount / seconds,
    observedBytesPerClientPerSecond: receivedBytes / playerCount / seconds,
    snapshotsPerClientPerSecond: snapshotCount / playerCount / seconds,
    saveAttempts,
    saveFailures,
    averageSaveDurationMs: saveDurationSamples > 0 ? saveDurationMs / saveDurationSamples : 0,
    maxSaveDurationMs: after.saves.maxDurationMs,
    queuedSaves: after.saves.queued,
    classroomAdminResponseMs: classroomAdmin.responseMs,
    classroomAdminStudents: classroomAdmin.students
  };
}

function printReport(report) {
  console.log(
    [
      `classroom-load ${report.players} players`,
      `tick=${report.tickRateHz.toFixed(1)}Hz`,
      `tick avg/max=${report.averageTickDurationMs.toFixed(2)}/${report.maxTickDurationMs.toFixed(2)}ms`,
      `schedule avg/max=${report.averageScheduleDelayMs.toFixed(2)}/${report.maxScheduleDelayMs.toFixed(2)}ms`,
      `serializations/pass=${report.serializationsPerPass.toFixed(2)}`,
      `bytes/client/s=${Math.round(report.serverBytesPerClientPerSecond)}`,
      `snapshots/client/s=${report.snapshotsPerClientPerSecond.toFixed(1)}`,
      `save avg/max=${report.averageSaveDurationMs.toFixed(2)}/${report.maxSaveDurationMs.toFixed(2)}ms`,
      `save attempts/failures/queued=${report.saveAttempts}/${report.saveFailures}/${report.queuedSaves}`,
      `admin list=${report.classroomAdminStudents} in ${report.classroomAdminResponseMs.toFixed(2)}ms`
    ].join(", ")
  );
}

function assertReport(report, after) {
  assertAtLeast(report.online, report.players, "online players");
  assertAtLeast(report.tickRateHz, 10, "tick rate Hz");
  assertAtMost(report.averageTickDurationMs, 15, "average tick duration ms");
  assertAtMost(report.averageScheduleDelayMs, 20, "average tick schedule delay ms");
  assertAtMost(report.maxScheduleDelayMs, 250, "maximum tick schedule delay ms");
  assertAtMost(report.serializationsPerPass, after.broadcast.activeMaps + 1, "serializations per pass");
  assertAtLeast(report.messagesPerPass, report.players - 1, "messages per pass");
  assertAtLeast(report.snapshotsPerClientPerSecond, 9, "snapshots per client per second");
  assertAtMost(report.serverBytesPerClientPerSecond, 250_000, "server bytes per client per second");
  assertAtLeast(report.saveAttempts, report.players, "save attempts during sample");
  assertAtMost(report.saveFailures, 0, "save failures");
  assertAtMost(report.averageSaveDurationMs, 25, "average save duration ms");
  assertAtMost(report.maxSaveDurationMs, 150, "maximum save duration ms");
  assertAtMost(report.queuedSaves, 0, "queued saves after sample");
  assertAtLeast(report.classroomAdminStudents, report.players, "classroom admin students");
  assertAtMost(report.classroomAdminResponseMs, 500, "classroom admin response ms");
}

async function fetchClassroomProgress(httpUrl, adminToken) {
  const startedAt = performance.now();
  const response = await fetch(`${httpUrl}/admin/classroom/progress?token=${encodeURIComponent(adminToken)}`);
  const payload = await response.json();
  if (!response.ok || !Array.isArray(payload.students)) {
    throw new Error(`/admin/classroom/progress responded ${response.status}`);
  }
  return { responseMs: performance.now() - startedAt, students: payload.students.length };
}

function assertAtLeast(actual, expected, label) {
  if (actual < expected) {
    throw new Error(`${label} ${actual.toFixed(2)} is below ${expected}`);
  }
}

function assertAtMost(actual, expected, label) {
  if (actual > expected) {
    throw new Error(`${label} ${actual.toFixed(2)} exceeds ${expected}`);
  }
}

async function fetchLoadStats(httpUrl) {
  const response = await fetch(`${httpUrl}/debug/load-stats`);
  if (!response.ok) {
    throw new Error(`/debug/load-stats responded ${response.status}`);
  }
  return response.json();
}

async function waitForHealth(server, httpUrl) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`load probe server exited early with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(`${httpUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }
    await wait(100);
  }
  throw new Error("load probe server health check timed out");
}

function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const selectedPort = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => (error ? reject(error) : resolvePort(selectedPort)));
    });
  });
}

async function closeClients(clients) {
  await Promise.all(clients.map(({ ws }) => new Promise((resolveClose) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolveClose();
      return;
    }
    const timer = setTimeout(resolveClose, 1000);
    ws.once("close", () => {
      clearTimeout(timer);
      resolveClose();
    });
    ws.close();
  })));
}

async function stopProcess(server) {
  if (!server || server.exitCode !== null) {
    return;
  }
  let exited = new Promise((resolveExit) => server.once("exit", resolveExit));
  server.kill("SIGTERM");
  await Promise.race([exited, wait(3000)]);
  if (server.exitCode === null) {
    exited = new Promise((resolveExit) => server.once("exit", resolveExit));
    server.kill("SIGKILL");
    await Promise.race([exited, wait(1000)]);
  }
}

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}
