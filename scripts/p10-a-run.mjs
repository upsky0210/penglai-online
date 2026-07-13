import { spawn } from "node:child_process";
import { resolve } from "node:path";

for (const required of ["ADMIN_TOKEN", "PENGLAI_DB_PATH", "PENGLAI_BACKUP_DIR"]) {
  if (!process.env[required]) {
    console.error(`P10-A launcher is missing ${required}. Use scripts/start-p10-trial.ps1.`);
    process.exit(1);
  }
}

const children = [
  spawn(process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "server/src/index.ts"], {
    env: process.env,
    stdio: "inherit"
  }),
  spawn(process.execPath, [resolve("node_modules/vite/bin/vite.js"), "--host", "0.0.0.0", "--port", "5174"], {
    env: process.env,
    stdio: "inherit"
  })
];

let stopping = false;
let exitCode = 0;

for (const child of children) {
  child.once("error", (error) => {
    console.error(`P10-A service failed to start: ${error.message}`);
    exitCode = 1;
    void stop();
  });
  child.once("exit", (code, signal) => {
    if (!stopping) {
      console.error(`P10-A service exited unexpectedly (${signal ?? code ?? "unknown"}).`);
      exitCode = code || 1;
      void stop();
    }
  });
}

process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());

await new Promise((resolveDone) => process.once("beforeExit", resolveDone));

async function stop() {
  if (stopping) return;
  stopping = true;
  console.log("Stopping P10-A client and server...");
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
  await Promise.race([
    Promise.all(children.map((child) => child.exitCode !== null
      ? Promise.resolve()
      : new Promise((resolveExit) => child.once("exit", resolveExit)))),
    wait(3000)
  ]);
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  process.exitCode = exitCode;
}

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}
