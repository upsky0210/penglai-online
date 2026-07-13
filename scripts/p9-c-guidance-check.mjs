import { readFileSync } from "node:fs";

const scene = readFileSync("client/src/scenes/GameScene.ts", "utf8");
const hud = readFileSync("client/src/game/HudLayer.ts", "utf8");
const guidance = readFileSync("client/src/game/questGuidance.ts", "utf8");
const fail = (message) => { throw new Error(`P9-C guidance check failed: ${message}`); };

for (const step of ["move", "jump", "interact", "attack", "skill", "pickup", "report"]) {
  if (!scene.includes(`id: "${step}"`)) fail(`missing tutorial step ${step}`);
  if (!scene.includes(`completeTutorialStep("${step}")`)) fail(`step ${step} is not tied to observed behavior`);
}
if (!scene.includes("current.id !== stepId")) fail("tutorial steps must advance sequentially");
if (!scene.includes("penglai-tutorial-") || !scene.includes("localStorage.setItem")) fail("tutorial progress is not persisted per save");
if (!hud.includes("setControlHint") || !scene.includes("新手 ${currentIndex + 1}/${tutorialSteps.length}")) fail("single-step non-blocking tutorial HUD is missing");

if (!scene.includes("JustDown(this.keys.h)") || !scene.includes("showStuckHint")) fail("H stuck hint is missing");
const hintBody = scene.match(/private showStuckHint\(\) \{([\s\S]*?)\n  \}\n\n  private updateQuestTracker/)?.[1] ?? "";
if (/send(?:Npc|Map|Portal|Attack)|\.send\(/.test(hintBody)) fail("stuck hint must not perform gameplay actions");
if (!guidance.includes("getNextPortalTowardMap") || !guidance.includes("const queue")) fail("multi-map route search is missing");
if (!scene.includes("下一站：${portal.name}") || !scene.includes("目標在 ${GAME_MAPS[targetMapId].name}")) fail("wrong-map guidance is missing");

if (!scene.includes("目前目標：${quest.title}") || !scene.includes("進度：${quest.progress}/${quest.targetCount}")) fail("compact objective/progress tracker is missing");
if (!scene.includes("getPortalRequirementText") || !guidance.includes("當地委託需先完成")) fail("portal destination requirements are missing");
if (!scene.includes("getMissingQuestPrerequisites") || !scene.includes("尚缺：${missingConditions.join")) fail("boss prerequisite detail is missing");
if (!scene.includes('return " | Z 回安全區"')) fail("safe return key must be Z");

if (/Smoke test announcement|Smoke Tester|Smoke Hero/.test(scene + hud + guidance)) fail("smoke copy leaked into student guidance");
console.log("P9-C guidance check passed: sequential tutorial, compact tracker, route hints and read-only stuck help.");
