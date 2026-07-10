import { WebSocket } from "ws";
import { moveSmokePlayer } from "./smoke-movement.mjs";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=warehouse-smoke-${Date.now()}`);
    const state = {
      playerId: "",
      mapId: "fog-harbor-test",
      x: 280,
      y: 430,
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
    });

    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function movePlayer(ws, state, mapId, x, y) {
  return moveSmokePlayer(ws, state, { mapId, x, y, name: "倉庫煙測", className: "swordsman" });
}

const { ws, state } = await connectClient();

await movePlayer(ws, state, "fog-harbor-test", 1385, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-old-warehouse" }));
await wait(500);

await movePlayer(ws, state, "old-harbor-warehouse", 70, 455);
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
