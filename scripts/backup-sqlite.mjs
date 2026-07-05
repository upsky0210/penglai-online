import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const source = resolve(process.env.PENGLAI_DB_PATH ?? "server/data/penglai.sqlite");
const targetDir = resolve(process.env.PENGLAI_BACKUP_DIR ?? "server/backups");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = resolve(targetDir, `penglai-${stamp}.sqlite`);

try {
  await stat(source);
} catch {
  console.error(`Database not found: ${source}`);
  process.exit(1);
}

await mkdir(targetDir, { recursive: true });

// The server runs the DB in WAL mode, so a plain file copy of the main .sqlite file
// misses committed transactions still sitting in the -wal file. VACUUM INTO writes a
// consistent single-file snapshot that includes them.
const sourceDb = new DatabaseSync(source);
let sourceCharacters;
try {
  sourceDb.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  sourceCharacters = sourceDb.prepare("SELECT COUNT(*) AS n FROM characters").get().n;
} finally {
  sourceDb.close();
}

// Verify the backup is a healthy database before declaring success.
const backupDb = new DatabaseSync(target);
try {
  const integrity = backupDb.prepare("PRAGMA integrity_check").get();
  if (integrity.integrity_check !== "ok") {
    console.error(`Backup failed integrity check: ${JSON.stringify(integrity)}`);
    process.exit(1);
  }
  const backupCharacters = backupDb.prepare("SELECT COUNT(*) AS n FROM characters").get().n;
  console.log(`SQLite backup created: ${target}`);
  console.log(`Integrity check: ok. Characters: ${backupCharacters} in backup, ${sourceCharacters} in source at snapshot time.`);
} finally {
  backupDb.close();
}
