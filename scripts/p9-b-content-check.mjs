import { readFileSync } from "node:fs";

const shared = readFileSync("shared/src/index.ts", "utf8");
const server = readFileSync("server/src/gameServer.ts", "utf8");
const client = readFileSync("client/src/scenes/GameScene.ts", "utf8");
const fail = (message) => { throw new Error(`P9-B content check failed: ${message}`); };

const mapTokens = ["臺灣府城／安平", "滬尾／淡水河口", "鹿港", "臺北大稻埕", "臺北艋舺", "三峽／大溪山區"];
for (const token of mapTokens) if (!shared.includes(`location: "${token}"`)) fail(`missing location ${token}`);

const knowledgeBlocks = [...shared.matchAll(/knowledgePoints:\s*\[([^\]]+)\]/g)];
if (knowledgeBlocks.length !== 6) fail(`expected 6 knowledge point blocks, got ${knowledgeBlocks.length}`);
for (const block of knowledgeBlocks) {
  const points = [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (points.length < 3 || points.length > 5) fail(`knowledge point count must be 3–5, got ${points.length}`);
}

const narratives = [...shared.matchAll(/"[^"]+":\s*\{\s*briefing:\s*"([^"]+)",\s*completionText:\s*"([^"]+)"\s*\}/g)];
if (narratives.length !== 27) fail(`expected 27 quest narratives, got ${narratives.length}`);
for (const [index, match] of narratives.entries()) {
  for (const text of [match[1], match[2]]) {
    if (text.length > 92) fail(`quest narrative ${index + 1} exceeds 92 characters`);
    const sentences = (text.match(/[。！？]/g) ?? []).length;
    if (sentences < 1 || sentences > 3) fail(`quest narrative ${index + 1} must contain 1–3 sentences`);
  }
}

const interactionTexts = [...shared.matchAll(/^\s*"(?:lantern|tide-gauge|reef-seal|archive-tablet|observatory-lens)-[^"]+":\s*"([^"]+)"/gm)];
if (interactionTexts.length !== 13) fail(`expected 13 interaction history texts, got ${interactionTexts.length}`);
if (!shared.includes("時間推進到 1945 年後")) fail("postwar transition must be explicit");
if (!shared.includes("遊戲異聞") || !shared.includes("fictionNotice")) fail("fact/fiction boundary is missing");
if (!server.includes("quest.briefing") || !server.includes("quest.completionText") || !server.includes("interactable.historyText")) fail("historical text is not integrated into play");
if (!client.includes("setMaxLines(4)")) fail("toast line limit is missing");

for (const [name, source] of [["shared", shared], ["server", server], ["client", client]]) {
  if (/Smoke test announcement|Smoke Tester|Smoke Hero/.test(source)) fail(`${name} contains smoke copy in production content`);
}

console.log("P9-B content check passed: 6 maps, 27 quest narratives, 13 interactable facts.");
