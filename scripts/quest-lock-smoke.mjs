import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=quest-lock-smoke-${Date.now()}`);
    const state = {
      playerId: "",
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
    });

    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function sendPlayerUpdate(ws, state, mapId, x, y) {
  ws.send(
    JSON.stringify({
      type: "player:update",
      player: {
        id: state.playerId,
        name: "任務鎖測",
        className: "swordsman",
        mapId,
        x,
        y,
        facing: "right",
        animation: "idle"
      }
    })
  );
}

const { ws, state } = await connectClient();

sendPlayerUpdate(ws, state, "fog-harbor-test", 1385, 455);
await wait(120);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-old-warehouse" }));
await wait(500);

sendPlayerUpdate(ws, state, "old-harbor-warehouse", 220, 466);
await wait(120);
ws.send(JSON.stringify({ type: "npc:interact", npcId: "warehouse-keeper" }));
await wait(500);

ws.close();

const lockNotice = state.notices.find((notice) => notice.includes("尚未解鎖") && notice.includes("調查潮位尺"));
if (!lockNotice) {
  throw new Error(`quest lock smoke did not receive lock notice: ${state.notices.join(" | ")}`);
}

console.log("Quest lock smoke passed: warehouse quest is locked before chapter prerequisite.");

