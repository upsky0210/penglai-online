import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`P9-A2 regression failed: ${message}`);
};

const smoke = read("scripts/smoke.mjs");
const persistence = read("server/src/persistence.ts");
const server = read("server/src/gameServer.ts");
const client = read("client/src/scenes/GameScene.ts");
const remote = read("client/src/game/RemoteEntityLayer.ts");
const main = read("client/src/main.ts");

assert(smoke.includes("[SMOKE:${Date.now()}-${process.pid}]") && smoke.includes("ttlMinutes: 1"), "smoke notice needs unique prefix and short TTL");
assert(smoke.includes("cleanReport.smokeAnnouncements !== 0"), "smoke must verify no announcement pollution");
assert(persistence.includes("text = 'Smoke test announcement' OR text LIKE '[SMOKE:%'"), "cleanup must target only known smoke notices");
assert(client.includes("announcementPanelVisible = false") && client.includes("showAnnouncementToast"), "announcements must stay collapsed and use toast notification");

for (const icon of ["potion", "lunchbox", "rat_tail", "mist_gel", "shell", "monster_cloth", "damp_wood", "reef_spark", "quest_key", "magic_core", "quest_seal", "equipment"]) {
  assert(existsSync(`client/public/assets/p9/items/${icon}.png`), `missing item icon ${icon}`);
}
assert(!remote.includes("add.rectangle(drop.x, drop.y - 10, 24, 18"), "legacy red drop rectangle still exists");
assert(remote.includes("getItemDropTextureKey") && remote.includes("fixedWidth: 96"), "drop fallback or fixed label is missing");
assert(remote.includes('slot === "weapon"') && remote.includes('slot === "armor"'), "weapon and armor fallbacks must remain visually distinct");

assert(main.includes("pixelArt: false") && client.includes("FilterMode.NEAREST"), "text and pixel-art render paths are not separated");
assert(client.includes("this.updateHud(message.player);\n        this.showLevelUp"), "authoritative level state must reach HUD before animation");
assert(server.includes("hp: leveledUp ? player.maxHp : player.hp") && server.includes("mp: leveledUp ? player.maxMp : player.mp"), "server level-up must refill HP and MP");
assert(server.includes("player: updatedPlayer") && server.includes("savePlayerGame(playerId);"), "full level state must be emitted and saved for reconnect");
assert(server.includes("hp: clampStat(savedCharacter?.hp, maxHp)") && server.includes("mp: clampStat(savedCharacter?.mp, maxMp)"), "reconnect must restore saved authoritative HP/MP");
assert(client.includes("moteCount = visualQuality.mode === \"low\" ? 3 : 9") && client.includes("playLevelUpSound"), "quality-aware level-up effect is missing");

console.log("P9-A2 regression checks passed.");
