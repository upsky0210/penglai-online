import { WebSocket } from "ws";
import { moveSmokePlayer } from "./smoke-movement.mjs";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=quest-lock-smoke-${Date.now()}`);
    const state = {
      playerId: "",
      mapId: "fog-harbor-test",
      x: 280,
      y: 430,
      notices: []
    };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("quest lock smoke welcome timed out"));
    }, 5000);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome") {
        state.playerId = message.playerId;
        clearTimeout(timer);
        resolve({ ws, state });
        return;
      }

      if (message.type === "quest:notice") {
        state.notices.push(message.text);
      }

      if (message.type === "map:change") {
        state.mapId = message.mapId;
        state.x = message.x;
        state.y = message.y;
      }


      if (message.type === "world:snapshot") {
        const self = message.players.find((player) => player.id === state.playerId);
        if (self) {
          state.mapId = self.mapId;
          state.x = self.x;
          state.y = self.y;
        }
      }
    });

    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function movePlayer(ws, state, mapId, x, y) {
  return moveSmokePlayer(ws, state, { mapId, x, y, name: "任務鎖測", className: "swordsman" });
}

const { ws, state } = await connectClient();

await movePlayer(ws, state, "fog-harbor-test", 1385, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-old-warehouse" }));
await wait(500);

await movePlayer(ws, state, "old-harbor-warehouse", 220, 466);
ws.send(JSON.stringify({ type: "npc:interact", npcId: "warehouse-keeper" }));
await wait(500);

ws.close();

const lockNotice = state.notices.find((notice) => notice.includes("尚未解鎖") && notice.includes("調查潮位尺"));
const historicalLockNotice = state.notices.find((notice) => notice.includes("尚未解鎖") && notice.includes("抄錄淡水河潮尺"));
if (!lockNotice && !historicalLockNotice) {
  throw new Error(`quest lock smoke did not receive lock notice: ${state.notices.join(" | ")}`);
}

console.log("Quest lock smoke passed: warehouse quest is locked before chapter prerequisite.");
