import { readFileSync } from "node:fs";

const sharedSource = readFileSync("shared/src/index.ts", "utf8");
const serverSource = readFileSync("server/src/index.ts", "utf8");

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`Missing ${label}: ${expected}`);
  }
}

function assertMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`Missing ${label}: ${pattern}`);
  }
}

assertIncludes(sharedSource, 'id: "starlit-observatory"', "observatory map");
assertIncludes(sharedSource, 'npcId: "observatory-keeper"', "observatory keeper quest chain");
assertIncludes(sharedSource, 'targetKind: "star-moth"', "star moth objective");
assertIncludes(sharedSource, 'itemId: "lens-core"', "lens core objective");
assertIncludes(sharedSource, 'targetId: "observatory-lens"', "observatory lens objective");
assertIncludes(sharedSource, 'targetKind: "astral-keeper"', "astral keeper objective");
assertIncludes(sharedSource, 'itemId: "astral-seal"', "astral seal objective");

assertMatch(sharedSource, /id:\s*"star-moth-clear"[\s\S]*?targetCount:\s*3/, "star moth target count");
assertMatch(sharedSource, /id:\s*"lens-core-sample"[\s\S]*?targetCount:\s*2/, "lens core target count");
assertMatch(sharedSource, /id:\s*"astral-keeper-1"[\s\S]*?maxHp:\s*400/, "astral keeper beta HP");

assertIncludes(serverSource, '"star-sabre": 0.07', "star sabre beta drop chance");
assertIncludes(serverSource, '"observer-cloak": 0.06', "observer cloak beta drop chance");
assertIncludes(serverSource, 'createItemDrop("astral-seal"', "astral seal drop");

console.log("Observatory balance check passed: Day401-Day430 values and quest chain verified.");
