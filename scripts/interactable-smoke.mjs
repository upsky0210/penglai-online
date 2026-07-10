import { WebSocket } from "ws";
import { moveSmokePlayer } from "./smoke-movement.mjs";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const slot = `interactable-smoke-${Date.now()}`;

const monsters = {
  rats: [
    { id: "rat-1", x: 610, y: 475 },
    { id: "rat-2", x: 785, y: 475 },
    { id: "rat-3", x: 1160, y: 374 }
  ],
  harborSlimes: [
    { id: "slime-1", x: 1700, y: 475 },
    { id: "slime-2", x: 1970, y: 475 }
  ],
  breakwaterSlimes: [
    { id: "breakwater-slime-1", x: 520, y: 475 },
    { id: "breakwater-slime-2", x: 870, y: 475 },
    { id: "breakwater-slime-3", x: 1240, y: 475 },
    { id: "breakwater-slime-1", x: 520, y: 475 }
  ],
  tideWatcher: { id: "tide-watcher-1", x: 1585, y: 399 }
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function send(ws, message) {
  ws.send(JSON.stringify(message));
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=${slot}`);
    const state = {
      playerId: "",
      mapId: "fog-harbor-test",
      x: 280,
      y: 430,
      quests: new Map(),
      itemDrops: [],
      monsters: [],
      notices: []
    };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("interactable smoke welcome timed out"));
    }, 5000);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome") {
        state.playerId = message.playerId;
        state.mapId = message.mapId ?? state.mapId;
        clearTimeout(timer);
        resolve({ ws, state });
        return;
      }

      if (message.type === "map:change") {
        state.mapId = message.mapId;
        state.x = message.x;
        state.y = message.y;
      }

      if (message.type === "world:snapshot") {
        state.monsters = message.monsters ?? [];
        state.itemDrops = message.itemDrops ?? [];
        const self = message.players.find((player) => player.id === state.playerId);
        if (self) {
          state.mapId = self.mapId;
          state.x = self.x;
          state.y = self.y;
        }
      }

      if (message.type === "quest:update") {
        state.quests.set(message.quest.id, message.quest);
      }

      if (message.type === "quest:notice") {
        state.notices.push(message.text);
      }
    });
    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function movePlayer(ws, state, x, y, mapId = state.mapId, facing = "right") {
  return moveSmokePlayer(ws, state, {
    mapId,
    x,
    y,
    name: "互動測試員",
    className: "hunter",
    facing
  });
}

async function waitFor(predicate, label, timeoutMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = predicate();
    if (result) {
      return result;
    }
    await wait(80);
  }

  throw new Error(`timed out waiting for ${label}`);
}

async function interactNpc(ws, state, mapId, x, y, npcId) {
  await movePlayer(ws, state, x, y, mapId);
  send(ws, { type: "npc:interact", npcId });
  await wait(260);
}

async function finishQuestAtNpc(ws, state, questId, mapId, x, y, npcId) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await interactNpc(ws, state, mapId, x, y, npcId);
    const quest = state.quests.get(questId);
    if (quest?.status === "completed") {
      return quest;
    }
  }

  const quest = state.quests.get(questId);
  throw new Error(`${questId} expected completed, got ${quest?.status}/${quest?.progress}`);
}

async function acceptQuest(ws, state, questId, mapId, x, y, npcId) {
  await interactNpc(ws, state, mapId, x, y, npcId);
  return waitFor(
    () => {
      const quest = state.quests.get(questId);
      return quest?.status === "active" ? quest : undefined;
    },
    `${questId} active`
  );
}

async function defeatMonster(ws, state, mapId, monster) {
  const liveMonster = await waitFor(
    () => state.monsters.find((candidate) => candidate.id === monster.id && candidate.alive),
    `${monster.id} alive`,
    14000
  );

  for (let attack = 0; attack < 32; attack += 1) {
    const currentMonster = state.monsters.find((candidate) => candidate.id === monster.id) ?? liveMonster;
    if (!currentMonster.alive) {
      return;
    }

    const attackX = currentMonster.x - 92;
    await movePlayer(ws, state, attackX, currentMonster.y, mapId, "right");
    send(ws, {
      type: "combat:attack",
      attackId: `${monster.id}-${Date.now()}-${attack}`,
      isSkill: attack % 5 === 0
    });
    await wait(85);

    const snapshotMonster = state.monsters.find((candidate) => candidate.id === monster.id);
    if (snapshotMonster && !snapshotMonster.alive) {
      return;
    }
  }

  throw new Error(`failed to defeat ${monster.id}`);
}

async function pickupItem(ws, state, mapId, itemId) {
  const drop = await waitFor(
    () => state.itemDrops.find((candidate) => candidate.itemId === itemId && candidate.mapId === mapId),
    `${itemId} drop`
  );
  await movePlayer(ws, state, drop.x, drop.y, mapId);
  send(ws, { type: "item:pickup", dropId: drop.id });
  await wait(220);
}

async function defeatAndPickup(ws, state, mapId, monster, itemId) {
  await defeatMonster(ws, state, mapId, monster);
  await pickupItem(ws, state, mapId, itemId);
}

function assertQuest(state, questId, expectedStatus, expectedProgress) {
  const quest = state.quests.get(questId);
  if (!quest) {
    throw new Error(`missing ${questId} quest`);
  }

  if (quest.status !== expectedStatus || quest.progress !== expectedProgress) {
    throw new Error(`${questId} expected ${expectedStatus}/${expectedProgress}, got ${quest.status}/${quest.progress}`);
  }

  return quest;
}

const { ws, state } = await connect();
await wait(500);

await acceptQuest(ws, state, "field-rat-cleanup", "fog-harbor-test", 350, 466, "fog-harbor-guard");
for (const rat of monsters.rats) {
  await defeatMonster(ws, state, "fog-harbor-test", rat);
}
await finishQuestAtNpc(ws, state, "field-rat-cleanup", "fog-harbor-test", 350, 466, "fog-harbor-guard");

await acceptQuest(ws, state, "rat-tail-salve", "fog-harbor-test", 185, 466, "herbalist-lin");
await pickupItem(ws, state, "fog-harbor-test", "rat-tail");
await pickupItem(ws, state, "fog-harbor-test", "rat-tail");
await finishQuestAtNpc(ws, state, "rat-tail-salve", "fog-harbor-test", 185, 466, "herbalist-lin");

await acceptQuest(ws, state, "mist-gel-lantern", "fog-harbor-test", 1510, 466, "lighthouse-apprentice");
for (const slime of monsters.harborSlimes) {
  await defeatAndPickup(ws, state, "fog-harbor-test", slime, "mist-gel");
}
await finishQuestAtNpc(ws, state, "mist-gel-lantern", "fog-harbor-test", 1510, 466, "lighthouse-apprentice");

await movePlayer(ws, state, 2285, 430, "fog-harbor-test");
send(ws, { type: "portal:enter", portalId: "to-breakwater" });
await wait(500);

await acceptQuest(ws, state, "breakwater-scout", "mist-breakwater", 190, 466, "breakwater-scout");
for (const slime of monsters.breakwaterSlimes) {
  await defeatMonster(ws, state, "mist-breakwater", slime);
}
await finishQuestAtNpc(ws, state, "breakwater-scout", "mist-breakwater", 190, 466, "breakwater-scout");

await acceptQuest(ws, state, "tide-watcher-core", "mist-breakwater", 190, 466, "breakwater-scout");
await defeatMonster(ws, state, "mist-breakwater", monsters.tideWatcher);
await finishQuestAtNpc(ws, state, "tide-watcher-core", "mist-breakwater", 190, 466, "breakwater-scout");

await acceptQuest(ws, state, "breakwater-lantern-repair", "mist-breakwater", 1320, 466, "tide-researcher-yu");
assertQuest(state, "breakwater-lantern-repair", "active", 0);

await movePlayer(ws, state, 515, 438, "mist-breakwater");
send(ws, { type: "map:interact", interactableId: "lantern-west" });
await wait(300);
let quest = assertQuest(state, "breakwater-lantern-repair", "active", 1);
if (!quest.interactedTargetIds?.includes("lantern-west")) {
  throw new Error("lantern-west was not recorded as interacted");
}

send(ws, { type: "map:interact", interactableId: "lantern-west" });
await wait(300);
assertQuest(state, "breakwater-lantern-repair", "active", 1);

await movePlayer(ws, state, 900, 438, "mist-breakwater");
send(ws, { type: "map:interact", interactableId: "lantern-mid" });
await wait(300);
assertQuest(state, "breakwater-lantern-repair", "active", 2);

await movePlayer(ws, state, 1270, 438, "mist-breakwater");
send(ws, { type: "map:interact", interactableId: "lantern-east" });
await wait(300);
quest = assertQuest(state, "breakwater-lantern-repair", "ready", 3);
if (new Set(quest.interactedTargetIds ?? []).size !== 3) {
  throw new Error("lantern quest did not record three unique interactables");
}

ws.close();
console.log("Interactable smoke passed: chapter prerequisites and unique lantern repairs tracked.");
