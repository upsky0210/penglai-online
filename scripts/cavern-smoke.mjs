import { WebSocket } from "ws";
import { moveSmokePlayer } from "./smoke-movement.mjs";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=cavern-smoke-${Date.now()}`);
    const state = {
      playerId: "",
      mapId: "fog-harbor-test",
      x: 280,
      y: 430,
      mapChanges: [],
      notices: []
    };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("cavern smoke welcome timed out"));
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
        state.x = message.x;
        state.y = message.y;
        state.mapChanges.push(message.mapId);
      }

      if (message.type === "world:snapshot") {
        const self = message.players.find((player) => player.id === state.playerId);
        if (self) {
          state.mapId = self.mapId;
          state.x = self.x;
          state.y = self.y;
        }
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

function movePlayer(ws, state, mapId, x, y) {
  return moveSmokePlayer(ws, state, { mapId, x, y, name: "潮洞測試員", className: "hunter" });
}

const { ws, state } = await connectClient();

await movePlayer(ws, state, "fog-harbor-test", 1385, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-old-warehouse" }));
await wait(500);

await movePlayer(ws, state, "old-harbor-warehouse", 2110, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-coral-cavern" }));
await wait(500);

await movePlayer(ws, state, "coral-tide-cavern", 235, 466);
ws.send(JSON.stringify({ type: "npc:interact", npcId: "cavern-scholar" }));
await wait(500);

await movePlayer(ws, state, "coral-tide-cavern", 70, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-old-warehouse" }));
await wait(500);

ws.close();

if (!state.mapChanges.includes("old-harbor-warehouse")) {
  throw new Error(`cavern smoke did not enter old-harbor-warehouse: ${state.mapChanges.join(", ")}`);
}

if (!state.mapChanges.includes("coral-tide-cavern")) {
  throw new Error(`cavern smoke did not enter coral-tide-cavern: ${state.mapChanges.join(", ")}`);
}

const lockNotice = state.notices.find((notice) => notice.includes("尚未解鎖") && notice.includes("擊退倉庫巡弋者"));
if (!lockNotice) {
  throw new Error(`cavern smoke did not receive chapter lock notice: ${state.notices.join(" | ")}`);
}

console.log("Cavern smoke passed: warehouse <-> coral cavern portal and chapter lock verified.");
