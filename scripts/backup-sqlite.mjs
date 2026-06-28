import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

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

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
console.log(`SQLite backup created: ${target}`);
