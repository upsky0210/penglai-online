import { access, readFile } from "node:fs/promises";
import { RELEASE_NPM_STAGES } from "./release-stages.mjs";

const startScript = await readFile("START_PENGLAI.bat", "utf8");
const securePromptScript = await readFile("scripts/read-admin-token.ps1", "utf8");
const releaseRunner = await readFile("scripts/release-check.mjs", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const releaseCommand = packageJson.scripts?.["check:release"];
const requiredFiles = [
  "scripts/read-admin-token.ps1",
  "scripts/validate-admin-token.mjs",
  "scripts/release-stages.mjs",
  "scripts/release-check.mjs"
];

await Promise.all(requiredFiles.map((filePath) => access(filePath)));

const startRequirements = [
  [/scripts\\read-admin-token\.ps1/i, "START_PENGLAI.bat must use the masked token prompt"],
  [/node scripts\\validate-admin-token\.mjs/i, "START_PENGLAI.bat must validate ADMIN_TOKEN"],
  [/set "PENGLAI_REQUIRE_ADMIN_TOKEN=1"/i, "START_PENGLAI.bat must enable required-token mode"],
  [/管理 Token 已設定。請在管理面板手動輸入。/i, "START_PENGLAI.bat must not print the token"]
];

for (const [pattern, message] of startRequirements) {
  if (!pattern.test(startScript)) {
    throw new Error(message);
  }
}

if (/set "ADMIN_TOKEN=smoke-admin"/i.test(startScript) || /set \/p/i.test(startScript) || /%ADMIN_TOKEN%/i.test(startScript)) {
  throw new Error("START_PENGLAI.bat contains an insecure default or exposes ADMIN_TOKEN");
}

if (!/-AsSecureString/i.test(securePromptScript) || !/ZeroFreeBSTR/i.test(securePromptScript)) {
  throw new Error("read-admin-token.ps1 must mask input and clear unmanaged secret memory");
}

if (releaseCommand !== "node scripts/release-check.mjs") {
  throw new Error("check:release must use the isolated release runner");
}

for (const stage of RELEASE_NPM_STAGES) {
  if (typeof packageJson.scripts?.[stage] !== "string") {
    throw new Error(`package.json is missing release stage ${stage}`);
  }
}

for (const requiredSetting of ["SMOKE_ADMIN_TOKEN", "PENGLAI_DB_PATH", "PENGLAI_BACKUP_DIR"]) {
  if (!releaseRunner.includes(`${requiredSetting}:`)) {
    throw new Error(`release runner is missing isolated setting ${requiredSetting}`);
  }
}

console.log(`Release configuration check passed: ${RELEASE_NPM_STAGES.length} exact stages and isolated runtime.`);
