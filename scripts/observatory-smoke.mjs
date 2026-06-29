import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=observatory-smoke-${Date.now()}`);
    const state = {
      playerId: "",
      mapChanges: [],
      notices: []
    };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("observatory smoke welcome timed out"));
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
        name: "觀測台測試員",
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

sendPlayerUpdate(ws, state, "coral-tide-cavern", 2320, 455);
await wait(120);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-sunken-archive" }));
await wait(500);

sendPlayerUpdate(ws, state, "sunken-archive", 2520, 455);
await wait(120);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-starlit-observatory" }));
await wait(500);

sendPlayerUpdate(ws, state, "starlit-observatory", 250, 466);
await wait(120);
ws.send(JSON.stringify({ type: "npc:interact", npcId: "observatory-keeper" }));
await wait(500);

sendPlayerUpdate(ws, state, "starlit-observatory", 70, 455);
await wait(120);
ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-sunken-archive" }));
await wait(500);

ws.close();

for (const expectedMap of ["old-harbor-warehouse", "coral-tide-cavern", "sunken-archive", "starlit-observatory"]) {
  if (!state.mapChanges.includes(expectedMap)) {
    throw new Error(`observatory smoke did not enter ${expectedMap}: ${state.mapChanges.join(", ")}`);
  }
}

const lockNotice = state.notices.find((notice) => notice.includes("尚未解鎖") && notice.includes("回收書庫封印"));
if (!lockNotice) {
  throw new Error(`observatory smoke did not receive chapter lock notice: ${state.notices.join(" | ")}`);
}

console.log("Observatory smoke passed: sunken archive <-> starlit observatory portal and chapter lock verified.");
