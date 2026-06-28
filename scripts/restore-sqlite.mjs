import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const confirmed = args.includes("--confirm");
const sourceArg = args.find((arg) => !arg.startsWith("--"));
const target = resolve(process.env.PENGLAI_DB_PATH ?? "server/data/penglai.sqlite");

if (!sourceArg || args.includes("--help")) {
  console.log(
    [
      "Usage:",
      "  node scripts/restore-sqlite.mjs <backup.sqlite> --confirm",
      "",
      "Environment:",
      "  PENGLAI_DB_PATH  Target database path. Defaults to server/data/penglai.sqlite",
      "",
      "Safety:",
      "  This script refuses to overwrite the database unless --confirm is provided.",
      "  Stop the server before restoring."
    ].join("\n")
  );
  process.exit(args.includes("--help") ? 0 : 1);
}

if (!confirmed) {
  console.error("Refusing to restore without --confirm. Stop the server, then rerun with --confirm.");
  process.exit(1);
}

const source = resolve(sourceArg);

try {
  await stat(source);
} catch {
  console.error(`Backup file not found: ${source}`);
  process.exit(1);
}

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
console.log(`SQLite database restored from ${source} to ${target}`);
