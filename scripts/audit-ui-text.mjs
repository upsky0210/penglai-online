import { readFileSync } from "node:fs";
import { join } from "node:path";

const targets = [
  "client/src/scenes/GameScene.ts",
  "client/src/adminDashboard.ts",
  "client/src/game/clientConfig.ts",
  "client/src/styles.css",
  "shared/src/index.ts",
  "START_PENGLAI.bat",
  "START_PENGLAI_UBUNTU.sh",
  "docs/UI_TEXT_AUDIT.md"
];

const suspiciousPattern = /[\uFFFD\uE000-\uF8FF]/u;
const knownMojibakePattern = /(Ã.|Â.|â€|嚗|蝞|瘚|摮|銝|隢|撌|撠|憭|閬|餈|鞈|蝣|摰|甇|鋆|璅|頛|銵|雿|鈭|蝯|蝑|霅|皜|葦|賡|銋|銴)/u;

const strict = process.argv.includes("--strict");
const findings = [];

for (const filePath of targets) {
  const absolutePath = join(process.cwd(), filePath);
  let content = "";
  try {
    content = readFileSync(absolutePath, "utf8");
  } catch {
    findings.push({ filePath, lineNumber: 0, reason: "missing-file", text: "" });
    continue;
  }

  content.split(/\r?\n/).forEach((line, index) => {
    if (suspiciousPattern.test(line)) {
      findings.push({ filePath, lineNumber: index + 1, reason: "replacement-or-private-use", text: line.trim() });
      return;
    }

    if (knownMojibakePattern.test(line)) {
      findings.push({ filePath, lineNumber: index + 1, reason: "possible-mojibake", text: line.trim() });
    }
  });
}

if (findings.length === 0) {
  console.log(`UI text audit passed: ${targets.length} files scanned.`);
  process.exit(0);
}

console.log(`UI text audit found ${findings.length} possible issue(s):`);
for (const finding of findings.slice(0, 80)) {
  console.log(`- ${finding.filePath}:${finding.lineNumber} [${finding.reason}] ${finding.text.slice(0, 140)}`);
}

if (findings.length > 80) {
  console.log(`... ${findings.length - 80} more`);
}

if (strict) {
  process.exit(1);
}
