import { access, mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const [command, sessionId, ...args] = process.argv.slice(2);
const trialRoot = resolve(process.env.P10_A_TRIAL_ROOT ?? "tmp/p10-a");

if (!command || !sessionId || args.includes("--help")) {
  printUsage();
  process.exit(command || sessionId ? 1 : 0);
}

if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(sessionId)) {
  fail("session id must be 3-40 lowercase letters, digits or hyphens");
}

const sessionDir = resolve(trialRoot, sessionId);
const sessionRelative = relative(trialRoot, sessionDir);
if (!sessionRelative || sessionRelative.startsWith("..") || resolve(trialRoot, sessionRelative) !== sessionDir) {
  fail("session path escaped the P10-A trial root");
}

const manifestPath = resolve(sessionDir, "session.json");
const databasePath = resolve(sessionDir, "data/penglai.sqlite");
const backupDir = resolve(sessionDir, "backups");
const exportDir = resolve(sessionDir, "exports");
const logDir = resolve(sessionDir, "logs");

if (command === "prepare") {
  await prepare();
} else if (command === "status") {
  await showStatus();
} else if (command === "preflight") {
  await preflight();
} else if (command === "reset") {
  await reset();
} else {
  fail(`unknown command: ${command}`);
}

async function prepare() {
  const studentCount = Number(readOption("--students") ?? "8");
  const mode = readOption("--mode") ?? "simulated";
  if (!Number.isInteger(studentCount) || studentCount < 5 || studentCount > 10) {
    fail("--students must be an integer from 5 through 10");
  }
  if (!new Set(["simulated", "real"]).has(mode)) {
    fail("--mode must be simulated or real");
  }

  await Promise.all([resolve(sessionDir, "data"), backupDir, exportDir, logDir].map((path) => mkdir(path, { recursive: true })));

  let existing;
  try {
    existing = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (existing && (existing.studentCount !== studentCount || existing.mode !== mode)) {
    fail("session already exists with different settings; use reset with the exact confirmation first");
  }

  const manifest = existing ?? {
    schemaVersion: 1,
    sessionId,
    mode,
    studentCount,
    evidenceLabel: mode === "simulated" ? "模擬彩排（非真人試教）" : "真人試教（待人工填寫結果）",
    createdAt: new Date().toISOString(),
    databasePath: relative(resolve("."), databasePath).replaceAll("\\", "/"),
    backupDirectory: relative(resolve("."), backupDir).replaceAll("\\", "/"),
    exportDirectory: relative(resolve("."), exportDir).replaceAll("\\", "/"),
    resultStatus: "not_run"
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`P10-A session prepared: ${sessionId}`);
  console.log(`Mode: ${manifest.evidenceLabel}; students: ${studentCount}`);
  console.log(`Database: ${databasePath}`);
  console.log("No ADMIN_TOKEN, login token, email or student name was written to disk.");
}

async function showStatus() {
  const manifest = await readManifest();
  const database = await inspectDatabase();
  const backups = await listSqliteFiles(backupDir);
  console.log(JSON.stringify({ manifest, database, backups }, null, 2));
}

async function preflight() {
  const manifest = await readManifest();
  await Promise.all([access("package.json"), access("package-lock.json"), access("node_modules"), access(sessionDir)]);
  const [serverPortFree, clientPortFree] = await Promise.all([isPortFree(8787), isPortFree(5174)]);
  const database = await inspectDatabase();
  const checks = {
    sessionId,
    evidenceLabel: manifest.evidenceLabel,
    studentCount: manifest.studentCount,
    isolatedDatabase: databasePath.startsWith(`${trialRoot}\\`) || databasePath.startsWith(`${trialRoot}/`),
    serverPort8787Free: serverPortFree,
    clientPort5174Free: clientPortFree,
    database
  };
  console.log(JSON.stringify(checks, null, 2));
  if (!checks.isolatedDatabase || !serverPortFree || !clientPortFree) {
    fail("preflight failed; stop existing services and confirm the isolated session path");
  }
}

async function reset() {
  const expected = `--confirm-reset=${sessionId}`;
  if (!args.includes(expected)) {
    fail(`reset refused; pass ${expected}`);
  }
  const manifest = await readManifest();
  const sourceExists = await fileExists(databasePath);
  let backupPath = null;
  if (sourceExists) {
    await mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    backupPath = resolve(backupDir, `pre-reset-${stamp}.sqlite`);
    const db = new DatabaseSync(databasePath);
    try {
      db.exec(`VACUUM INTO '${backupPath.replaceAll("'", "''")}'`);
    } finally {
      db.close();
    }
  }
  for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    await unlink(path).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
  const nextManifest = {
    ...manifest,
    evidenceLabel: manifest.mode === "simulated" ? "模擬彩排（非真人試教）" : "真人試教（待人工填寫結果）",
    resultStatus: "not_run",
    lastResetAt: new Date().toISOString(),
    lastPreResetBackup: backupPath ? relative(resolve("."), backupPath).replaceAll("\\", "/") : null
  };
  await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");
  console.log(`P10-A session reset: ${sessionId}`);
  console.log(backupPath ? `Pre-reset backup: ${backupPath}` : "No database existed; no backup was necessary.");
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") fail(`session is not prepared: ${sessionId}`);
    throw error;
  }
}

async function inspectDatabase() {
  if (!(await fileExists(databasePath))) return { exists: false };
  const info = await stat(databasePath);
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const integrity = db.prepare("PRAGMA integrity_check").get()?.integrity_check;
    const tables = db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'").get()?.count ?? 0;
    return { exists: true, bytes: info.size, integrity, tables };
  } finally {
    db.close();
  }
}

async function listSqliteFiles(directory) {
  try {
    return (await readdir(directory)).filter((name) => name.endsWith(".sqlite")).sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function isPortFree(port) {
  return new Promise((resolvePort) => {
    const probe = createServer();
    probe.once("error", () => resolvePort(false));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolvePort(true)));
  });
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function readOption(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function printUsage() {
  console.log([
    "Usage:",
    "  node scripts/p10-a-trial-data.mjs prepare <session-id> --students 5..10 --mode simulated|real",
    "  node scripts/p10-a-trial-data.mjs preflight <session-id>",
    "  node scripts/p10-a-trial-data.mjs status <session-id>",
    "  node scripts/p10-a-trial-data.mjs reset <session-id> --confirm-reset=<session-id>",
    "",
    "Runtime data stays under tmp/p10-a/<session-id> and is ignored by Git."
  ].join("\n"));
}

function fail(message) {
  console.error(`P10-A trial data error: ${message}`);
  process.exit(1);
}
