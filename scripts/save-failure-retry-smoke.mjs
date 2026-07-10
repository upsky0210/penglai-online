import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempDirectory = await mkdtemp(join(tmpdir(), "penglai-save-retry-"));
const databasePath = join(tempDirectory, "retry-smoke.sqlite");
const port = 18_700 + Math.floor(Math.random() * 700);
const httpUrl = `http://127.0.0.1:${port}`;
const wsUrl = `ws://127.0.0.1:${port}`;
const slot = `save-failure-smoke-${Date.now()}`;
const output = [];

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function waitFor(predicate, label, timeoutMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await predicate();
    if (result) {
      return result;
    }
    await wait(80);
  }
  throw new Error(`timed out waiting for ${label}`);
}

const server = spawn(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "server/src/index.ts"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    PORT: String(port),
    PENGLAI_DB_PATH: databasePath,
    PENGLAI_TEST_FAIL_SAVE_ONCE_SLOT_PREFIX: "save-failure-smoke-"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
server.stdout.on("data", (chunk) => output.push(chunk.toString()));
server.stderr.on("data", (chunk) => output.push(chunk.toString()));

async function stopServer() {
  if (server.exitCode === null) {
    const exited = new Promise((resolveExit) => server.once("exit", resolveExit));
    server.kill("SIGTERM");
    await Promise.race([exited, wait(3000)]);
  }
  if (server.exitCode === null) {
    const exited = new Promise((resolveExit) => server.once("exit", resolveExit));
    server.kill("SIGKILL");
    await Promise.race([exited, wait(1000)]);
  }
}

async function fetchStats() {
  const response = await fetch(`${httpUrl}/debug/reliability-stats`);
  if (!response.ok) {
    return undefined;
  }
  return response.json();
}

function connect() {
  return new Promise((resolveConnect, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=${slot}`);
    const state = { playerId: "", self: null };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("save retry smoke welcome timed out"));
    }, 5000);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome") {
        state.playerId = message.playerId;
        clearTimeout(timer);
        resolveConnect({ ws, state });
        return;
      }
      if (message.type === "world:snapshot") {
        state.self = message.players.find((player) => player.id === state.playerId) ?? state.self;
      }
    });
    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

try {
  await waitFor(async () => {
    try {
      const response = await fetch(`${httpUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }, "isolated server health");

  const first = await connect();
  await waitFor(() => first.state.self, "initial player snapshot");
  first.ws.send(
    JSON.stringify({
      type: "player:update",
      player: {
        id: first.state.playerId,
        name: "斷線重試旅人",
        className: "hunter",
        mapId: "fog-harbor-test",
        x: first.state.self.x,
        y: first.state.self.y,
        facing: "right",
        animation: "idle"
      }
    })
  );
  await waitFor(
    () => first.state.self?.name === "斷線重試旅人" && first.state.self?.className === "hunter",
    "identity update before disconnect"
  );
  await new Promise((resolveClose) => {
    first.ws.once("close", resolveClose);
    first.ws.close();
  });

  const failed = await waitFor(async () => {
    const stats = await fetchStats();
    return stats?.saves.failures >= 1 && stats.saves.queued >= 1 ? stats : undefined;
  }, "failed disconnect save retained in queue");
  const recovered = await waitFor(async () => {
    const stats = await fetchStats();
    return stats?.saves.successes >= 1 && stats.saves.queued === 0 ? stats : undefined;
  }, "periodic save retry success", 10_000);

  const second = await connect();
  const restored = await waitFor(() => second.state.self, "restored player snapshot");
  if (restored.name !== "斷線重試旅人" || restored.className !== "hunter") {
    throw new Error(`retry restored stale identity: ${restored.name}/${restored.className}`);
  }
  await new Promise((resolveClose) => {
    second.ws.once("close", resolveClose);
    second.ws.close();
  });

  console.log(
    `Save failure retry smoke passed: failure retained queued=${failed.saves.queued}; ` +
      `retry attempts=${recovered.saves.attempts}, successes=${recovered.saves.successes}.`
  );
} catch (error) {
  console.error(output.join(""));
  throw error;
} finally {
  await stopServer();
  await rm(tempDirectory, { recursive: true, force: true });
}
