import { WebSocket } from "ws";
import { moveSmokePlayer } from "./smoke-movement.mjs";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=archive-smoke-${Date.now()}`);
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
      reject(new Error("archive smoke welcome timed out"));
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
  return moveSmokePlayer(ws, state, { mapId, x, y, name: "書庫測試員", className: "hunter" });
}

const { ws, state } = await connectClient();

await movePlayer(ws, state, "fog-harbor-test", 1385, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-old-warehouse" }));
await wait(500);

await movePlayer(ws, state, "old-harbor-warehouse", 2110, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-coral-cavern" }));
await wait(500);

await movePlayer(ws, state, "coral-tide-cavern", 2320, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-sunken-archive" }));
await wait(500);

await movePlayer(ws, state, "sunken-archive", 250, 466);
ws.send(JSON.stringify({ type: "npc:interact", npcId: "archive-curator" }));
await wait(500);

await movePlayer(ws, state, "sunken-archive", 70, 455);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-coral-cavern" }));
await wait(500);

ws.close();

for (const expectedMap of ["old-harbor-warehouse", "coral-tide-cavern", "sunken-archive"]) {
  if (!state.mapChanges.includes(expectedMap)) {
    throw new Error(`archive smoke did not enter ${expectedMap}: ${state.mapChanges.join(", ")}`);
  }
}

const lockNotice = state.notices.find((notice) => notice.includes("尚未解鎖") && notice.includes("回收珊瑚潮鑰"));
if (!lockNotice) {
  throw new Error(`archive smoke did not receive chapter lock notice: ${state.notices.join(" | ")}`);
}

console.log("Archive smoke passed: coral cavern <-> sunken archive portal and chapter lock verified.");
