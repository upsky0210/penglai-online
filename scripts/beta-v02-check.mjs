import { existsSync } from "node:fs";
import { join } from "node:path";

const requiredFiles = [
  "docs/DAY101-DAY110_ADMIN_ANNOUNCEMENTS.md",
  "docs/DAY111-DAY120_BETA_OPERATIONS.md",
  "docs/DAY121-DAY123_CHAPTER1_CONTENT.md",
  "docs/BETA_RELEASE_V0.2.md",
  "docs/TEACHER_BETA_V0.2_GUIDE.md",
  "docs/UI_TEXT_AUDIT.md",
  "docs/UI_COPY_STYLE_GUIDE.md",
  "START_PENGLAI.bat",
  "START_PENGLAI_UBUNTU.sh",
  "scripts/audit-ui-text.mjs",
  "scripts/smoke.mjs",
  "scripts/multiplayer-smoke.mjs"
];

const missing = requiredFiles.filter((filePath) => !existsSync(join(process.cwd(), filePath)));

if (missing.length > 0) {
  console.error("Beta v0.2 check failed. Missing files:");
  for (const filePath of missing) {
    console.error(`- ${filePath}`);
  }
  process.exit(1);
}

console.log(`Beta v0.2 file check passed: ${requiredFiles.length} files.`);
