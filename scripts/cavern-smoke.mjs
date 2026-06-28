import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=cavern-smoke-${Date.now()}`);
    const state = {
      playerId: "",
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
        state.mapChanges.push(message.mapId);
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
        name: "潮洞測試員",
        className: "hunter",
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

sendPlayerUpdate(ws, state, "old-harbor-warehouse", 2110, 455);
await wait(120);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-coral-cavern" }));
await wait(500);

sendPlayerUpdate(ws, state, "coral-tide-cavern", 235, 466);
await wait(120);
ws.send(JSON.stringify({ type: "npc:interact", npcId: "cavern-scholar" }));
await wait(500);

sendPlayerUpdate(ws, state, "coral-tide-cavern", 70, 455);
await wait(120);
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
