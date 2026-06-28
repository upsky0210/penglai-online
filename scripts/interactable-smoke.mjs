import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const slot = `interactable-smoke-${Date.now()}`;

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
      quests: new Map(),
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
        clearTimeout(timer);
        resolve({ ws, state });
        return;
      }

      if (message.type === "map:change") {
        state.mapId = message.mapId;
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

function playerUpdate(state, x, y, mapId = state.mapId) {
  return {
    type: "player:update",
    player: {
      id: state.playerId,
      name: "互動測試旅人",
      className: "swordsman",
      mapId,
      x,
      y,
      facing: "right",
      animation: "idle"
    }
  };
}

function assertQuest(state, expectedStatus, expectedProgress) {
  const quest = state.quests.get("breakwater-lantern-repair");
  if (!quest) {
    throw new Error("missing breakwater-lantern-repair quest");
  }

  if (quest.status !== expectedStatus || quest.progress !== expectedProgress) {
    throw new Error(`lantern quest expected ${expectedStatus}/${expectedProgress}, got ${quest.status}/${quest.progress}`);
  }

  return quest;
}

const { ws, state } = await connect();
await wait(500);

send(ws, playerUpdate(state, 2285, 430, "fog-harbor-test"));
await wait(150);
send(ws, { type: "portal:enter", portalId: "to-breakwater" });
await wait(500);

send(ws, playerUpdate(state, 1320, 430, "mist-breakwater"));
await wait(150);
send(ws, { type: "npc:interact", npcId: "tide-researcher-yu" });
await wait(300);
assertQuest(state, "active", 0);

send(ws, playerUpdate(state, 515, 438, "mist-breakwater"));
await wait(120);
send(ws, { type: "map:interact", interactableId: "lantern-west" });
await wait(300);
let quest = assertQuest(state, "active", 1);
if (!quest.interactedTargetIds?.includes("lantern-west")) {
  throw new Error("lantern-west was not recorded as interacted");
}

send(ws, { type: "map:interact", interactableId: "lantern-west" });
await wait(300);
assertQuest(state, "active", 1);

send(ws, playerUpdate(state, 900, 438, "mist-breakwater"));
await wait(120);
send(ws, { type: "map:interact", interactableId: "lantern-mid" });
await wait(300);
assertQuest(state, "active", 2);

send(ws, playerUpdate(state, 1270, 438, "mist-breakwater"));
await wait(120);
send(ws, { type: "map:interact", interactableId: "lantern-east" });
await wait(300);
quest = assertQuest(state, "ready", 3);
if (new Set(quest.interactedTargetIds ?? []).size !== 3) {
  throw new Error("lantern quest did not record three unique interactables");
}

ws.close();
console.log("Interactable smoke passed: unique lantern repairs tracked.");
