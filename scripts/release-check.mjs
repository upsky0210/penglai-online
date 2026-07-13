import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RELEASE_NPM_STAGES } from "./release-stages.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempDirectory = await mkdtemp(join(tmpdir(), "penglai-release-"));
const databasePath = join(tempDirectory, "release.sqlite");
const backupDirectory = join(tempDirectory, "backups");
const adminToken = `release_${randomBytes(24).toString("hex")}`;
const port = await getFreePort();
const httpUrl = `http://127.0.0.1:${port}`;
const wsUrl = `ws://127.0.0.1:${port}`;
const releaseEnvironment = {
  ...process.env,
  ADMIN_TOKEN: adminToken,
  PENGLAI_REQUIRE_ADMIN_TOKEN: "1",
  PENGLAI_DB_PATH: databasePath,
  PENGLAI_BACKUP_DIR: backupDirectory,
  PORT: String(port),
  AUTH_CORS_ORIGIN: httpUrl,
  AUTH_ALLOW_MOCK: "1",
  GOOGLE_HOSTED_DOMAIN: "",
  SMOKE_ADMIN_TOKEN: adminToken,
  SMOKE_BASE_URL: httpUrl,
  SMOKE_HTTP_URL: httpUrl,
  SMOKE_WS_URL: wsUrl
};
let server;
let serverOutput = "";

try {
  await runProcess(process.execPath, ["scripts/release-config-check.mjs"], process.env);
  server = spawn(
    process.execPath,
    [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "server/src/index.ts"],
    {
      cwd: projectRoot,
      env: releaseEnvironment,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  await waitForHealth(server, httpUrl);
  console.log(`Release server ready on isolated port ${port}.`);
  for (const stage of RELEASE_NPM_STAGES) {
    console.log(`\n[release] npm run ${stage}`);
    await runNpmStage(stage, releaseEnvironment);
  }
  console.log(`\nRelease checks passed: ${RELEASE_NPM_STAGES.length} stages on an isolated database.`);
} catch (error) {
  if (serverOutput.trim()) {
    console.error("\nRelease server output:\n" + serverOutput.trim());
  }
  throw error;
} finally {
  await stopProcess(server);
  await rm(tempDirectory, { recursive: true, force: true });
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

async function waitForHealth(child, baseUrl) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`release server exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }
    await wait(100);
  }
  throw new Error("release server health check timed out");
}

function runNpmStage(stage, env) {
  const npmCliPath = process.env.npm_execpath;
  if (!npmCliPath) {
    throw new Error("check:release must be started through npm");
  }
  return runProcess(process.execPath, [npmCliPath, "run", stage], env);
}

function runProcess(command, args, env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env,
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed (${signal ?? code})`));
    });
  });
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) {
    return;
  }
  let exited = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  await Promise.race([exited, wait(3000)]);
  if (child.exitCode === null) {
    exited = new Promise((resolveExit) => child.once("exit", resolveExit));
    child.kill("SIGKILL");
    await Promise.race([exited, wait(1000)]);
  }
}

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}
