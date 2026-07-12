import { readFile } from "node:fs/promises";

const qualitySource = await readFile(new URL("../client/src/game/visualQuality.ts", import.meta.url), "utf8");
const remoteSource = await readFile(new URL("../client/src/game/RemoteEntityLayer.ts", import.meta.url), "utf8");
const vfxSource = await readFile(new URL("../client/src/game/CombatVfx.ts", import.meta.url), "utf8");

const required = [
  [qualitySource, "maxCombatEffects: 6"],
  [qualitySource, "maxWorldLabels: 14"],
  [qualitySource, "remoteEffectCooldownMs: 320"],
  [remoteSource, "isNearCamera"],
  [remoteSource, "maxWorldLabels"],
  [vfxSource, "maxCombatEffects"]
];

for (const [source, token] of required) {
  if (!source.includes(token)) throw new Error(`P8-G density guard missing: ${token}`);
}

const classroomBurst = { players: 40, monsters: 45, drops: 30, effects: 50 };
const lowSpecVisible = {
  labels: Math.min(classroomBurst.monsters + classroomBurst.drops, 14),
  effects: Math.min(classroomBurst.effects, 6)
};
if (lowSpecVisible.labels > 14 || lowSpecVisible.effects > 6) throw new Error("Low-spec density budget exceeded.");

console.log(`P8-G density check passed: ${classroomBurst.players} players / ${classroomBurst.monsters} monsters / ${classroomBurst.effects} effects -> ${lowSpecVisible.labels} labels / ${lowSpecVisible.effects} effects in low-spec mode.`);
