import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=warehouse-smoke-${Date.now()}`);
    const state = {
      playerId: "",
      mapChanges: []
    };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("warehouse smoke welcome timed out"));
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
        name: "倉庫煙測",
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

sendPlayerUpdate(ws, state, "old-harbor-warehouse", 70, 455);
await wait(120);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-fog-harbor" }));
await wait(500);

ws.close();

if (!state.mapChanges.includes("old-harbor-warehouse")) {
  throw new Error(`warehouse smoke did not enter old-harbor-warehouse: ${state.mapChanges.join(", ")}`);
}

if (!state.mapChanges.includes("fog-harbor-test")) {
  throw new Error(`warehouse smoke did not return to fog-harbor-test: ${state.mapChanges.join(", ")}`);
}

console.log("Warehouse smoke passed: fog harbor <-> old harbor warehouse portals.");

