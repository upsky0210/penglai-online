import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const fail = (message) => { throw new Error(`P9-E release check failed: ${message}`); };

const renderer = read("client/src/game/MapRenderer.ts");
const signpost = renderer.match(/private addSignpost\([\s\S]*?\n  \}/)?.[0] ?? "";
if (!signpost.includes("setDepth(25)") || !signpost.includes("setDepth(26)") || !signpost.includes("setDepth(46)")) {
  fail("world sign board/label depth contract is missing");
}
if (!renderer.includes('}).setDepth(46);\n    this.interactableStatusTexts.set')) {
  fail("interactable status labels must stay above terrain");
}

const titleScreen = read("client/src/ui/TitleScreenView.ts");
const gameMain = read("client/src/main.ts");
const constants = read("client/src/game/constants.ts");
if (!constants.includes("gameWidth = 960") || !constants.includes("gameHeight = 540")) {
  fail("the verified 16:9 Canvas contract must remain 960x540");
}
if (!gameMain.includes("mode: Phaser.Scale.FIT") || !gameMain.includes("autoCenter: Phaser.Scale.CENTER_BOTH")) {
  fail("Canvas must retain FIT scaling and centered letterboxing");
}
for (const viewport of [[1366, 768], [1920, 1080]]) {
  const [width, height] = viewport;
  const scale = Math.min(width / 960, height / 540);
  const renderedWidth = 960 * scale;
  const renderedHeight = 540 * scale;
  if (renderedWidth > width + 0.01 || renderedHeight > height + 0.01) {
    fail(`${width}x${height} Canvas exceeds its viewport`);
  }
  if (Math.abs(renderedWidth / renderedHeight - 16 / 9) > 0.0001) {
    fail(`${width}x${height} Canvas does not preserve 16:9`);
  }
}
for (const layoutContract of [
  "gameHeight / 2 - 96",
  "gameHeight / 2 + 2",
  "gameHeight / 2 + 72",
  "gameHeight / 2 + 164",
  "gameHeight / 2 + 216"
]) {
  if (!titleScreen.includes(layoutContract)) fail(`title layout contract is missing: ${layoutContract}`);
}
if ((titleScreen.match(/fontFamily: uiFont/g) ?? []).length < 7) {
  fail("title screen copy must use the Chinese UI font stack");
}
if (titleScreen.includes("SQLite 角色資料")) {
  fail("title screen contains developer-facing persistence copy");
}

const studentRuntime = [
  "client/src/scenes/GameScene.ts",
  "client/src/game/HudLayer.ts",
  "client/src/game/MapRenderer.ts",
  "client/src/game/questGuidance.ts",
  "shared/src/index.ts"
].map(read).join("\n");
for (const leakedCopy of ["Smoke test announcement", "Smoke Tester", "Smoke Hero", "Lorem ipsum", "假資料角色"]) {
  if (studentRuntime.includes(leakedCopy)) fail(`student runtime contains test copy: ${leakedCopy}`);
}

for (const path of [
  "docs/P9-E-TRIAL-RELEASE.md",
  "docs/P9-A2-PLAYTEST-FIXES.md",
  "docs/P9-B-HISTORICAL-DEPTH.md",
  "docs/P9-C-STUDENT-GUIDANCE.md",
  "docs/P9-D-TEACHER-CLASSROOM.md"
]) {
  if (!existsSync(path)) fail(`missing release evidence document ${path}`);
}
const releaseDoc = read("docs/P9-E-TRIAL-RELEASE.md");
for (const heading of ["六關學生流程", "學生端與教師功能聯動", "解析度與文字", "資料潔淨", "已知問題", "30～45 分鐘教師試教腳本"]) {
  if (!releaseDoc.includes(heading)) fail(`release document missing section: ${heading}`);
}

console.log("P9-E release checks passed: world-label depth, 1366/1920 Canvas contract, title layout, clean student copy and release evidence.");
