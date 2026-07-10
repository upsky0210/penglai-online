import { readFile } from "node:fs/promises";

const startScript = await readFile("START_PENGLAI.bat", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const releaseCommand = packageJson.scripts?.["check:release"];

const startRequirements = [
  [/set \/p "ADMIN_TOKEN=/i, "START_PENGLAI.bat must prompt for ADMIN_TOKEN"],
  [/node scripts\\validate-admin-token\.mjs/i, "START_PENGLAI.bat must validate ADMIN_TOKEN"],
  [/set "PENGLAI_REQUIRE_ADMIN_TOKEN=1"/i, "START_PENGLAI.bat must enable required-token mode"],
  [/管理 Token 已設定。請在管理面板手動輸入。/i, "START_PENGLAI.bat must not print the token"]
];

for (const [pattern, message] of startRequirements) {
  if (!pattern.test(startScript)) {
    throw new Error(message);
  }
}

if (/set "ADMIN_TOKEN=smoke-admin"/i.test(startScript) || /echo Admin Token：%ADMIN_TOKEN%/i.test(startScript)) {
  throw new Error("START_PENGLAI.bat contains an insecure default or prints ADMIN_TOKEN");
}

if (typeof releaseCommand !== "string") {
  throw new Error("package.json is missing check:release");
}

const requiredStages = [
  "check:beta:v02",
  "smoke",
  "smoke:multi",
  "smoke:interactable",
  "smoke:warehouse",
  "smoke:cavern",
  "smoke:archive",
  "smoke:observatory",
  "smoke:observatory-balance",
  "smoke:quest-lock",
  "smoke:save-roundtrip",
  "smoke:message-validation",
  "smoke:save-failure-retry",
  "smoke:broadcast-budget"
];

for (const stage of requiredStages) {
  if (!releaseCommand.includes(`npm run ${stage}`)) {
    throw new Error(`check:release is missing ${stage}`);
  }
}

console.log(`Release configuration check passed: ${requiredStages.length} verification stages.`);
