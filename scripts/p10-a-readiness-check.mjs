import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";

const run = promisify(execFile);
const fail = (message) => { throw new Error(`P10-A readiness check failed: ${message}`); };
const read = (path) => readFile(path, "utf8");

const requiredFiles = [
  "scripts/p10-a-trial-data.mjs",
  "scripts/p10-a-run.mjs",
  "scripts/p10-a-account-isolation-smoke.mjs",
  "scripts/start-p10-trial.ps1",
  "docs/P10-A-SMALL-TRIAL-REHEARSAL.md"
];
await Promise.all(requiredFiles.map((path) => access(path)));

const packageJson = JSON.parse(await read("package.json"));
for (const script of ["trial:prepare", "trial:status", "trial:reset", "trial:start", "check:p10-a", "smoke:p10-a"]) {
  if (typeof packageJson.scripts?.[script] !== "string") fail(`missing npm script ${script}`);
}

const launcher = await read("scripts/start-p10-trial.ps1");
for (const contract of [
  "read-admin-token.ps1",
  "validate-admin-token.mjs",
  "PENGLAI_REQUIRE_ADMIN_TOKEN",
  "PENGLAI_DB_PATH",
  "Remove-Item Env:ADMIN_TOKEN",
  "Press Ctrl+C once"
]) {
  if (!launcher.includes(contract)) fail(`launcher contract missing: ${contract}`);
}

const runner = await read("scripts/p10-a-run.mjs");
for (const contract of ["process.once(\"SIGINT\"", "Stopping P10-A client and server", "child.kill(\"SIGTERM\")", "child.kill(\"SIGKILL\")"]) {
  if (!runner.includes(contract)) fail(`service stop contract missing: ${contract}`);
}

const guide = await read("docs/P10-A-SMALL-TRIAL-REHEARSAL.md");
for (const heading of [
  "能力盤點",
  "試教前檢查",
  "資料重置",
  "啟動與停止",
  "緊急回復",
  "30～45 分鐘課堂執行表",
  "人工觀察表",
  "P0／P1／P2",
  "模擬彩排結果"
]) {
  if (!guide.includes(heading)) fail(`guide section missing: ${heading}`);
}

const scratch = await mkdtemp(join(tmpdir(), "penglai-p10-a-"));
const sessionId = "readiness-check";
const env = { ...process.env, P10_A_TRIAL_ROOT: scratch };
try {
  await run(process.execPath, ["scripts/p10-a-trial-data.mjs", "prepare", sessionId, "--students", "8", "--mode", "simulated"], { env });
  const sessionDir = resolve(scratch, sessionId);
  const manifestText = await read(join(sessionDir, "session.json"));
  const manifest = JSON.parse(manifestText);
  if (manifest.studentCount !== 8 || manifest.mode !== "simulated" || manifest.resultStatus !== "not_run") {
    fail("prepared manifest does not preserve rehearsal settings");
  }
  if (/token|password|email/i.test(manifestText)) fail("manifest contains credential or personal-data fields");

  const databasePath = join(sessionDir, "data", "penglai.sqlite");
  const db = new DatabaseSync(databasePath);
  db.exec("CREATE TABLE rehearsal_probe (id INTEGER PRIMARY KEY)");
  db.close();

  await run(process.execPath, ["scripts/p10-a-trial-data.mjs", "reset", sessionId, `--confirm-reset=${sessionId}`], { env });
  const backups = (await readdir(join(sessionDir, "backups"))).filter((name) => name.endsWith(".sqlite"));
  if (backups.length !== 1) fail("confirmed reset did not create exactly one pre-reset backup");
  try {
    await access(databasePath);
    fail("confirmed reset left the active database in place");
  } catch (error) {
    if (error?.message?.startsWith("P10-A readiness")) throw error;
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}

console.log("P10-A readiness check passed: isolated session, guarded reset/backup, secure launcher and rehearsal evidence template.");
