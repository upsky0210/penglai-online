import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const playerCount = Number.parseInt(process.env.SMOKE_PLAYER_COUNT ?? "3", 10);

function connectClient(index) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=multi-smoke-${index}-${Date.now()}`);
    const state = {
      index,
      playerId: "",
      welcomed: false,
      snapshots: 0,
      chats: 0,
      notices: 0,
      mapChanges: 0
    };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`client ${index} welcome timed out`));
    }, 5000);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome") {
        state.playerId = message.playerId;
        state.welcomed = true;
        clearTimeout(timer);
        resolve({ ws, state });
        return;
      }

      if (message.type === "world:snapshot") {
        state.snapshots += 1;
      }

      if (message.type === "chat:message") {
        state.chats += 1;
      }

      if (message.type === "chat:notice") {
        state.notices += 1;
      }

      if (message.type === "map:change") {
        state.mapChanges += 1;
      }
    });
    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const clients = await Promise.all(
  Array.from({ length: playerCount }, (_, index) => connectClient(index + 1))
);

for (const { ws, state } of clients) {
  ws.send(
    JSON.stringify({
      type: "player:update",
      player: {
        id: state.playerId,
        name: `多人測試${state.index}`,
        className: "swordsman",
        mapId: "fog-harbor-test",
        x: 280 + state.index * 32,
        y: 430,
        facing: "right",
        animation: "idle"
      }
    })
  );
}

clients[0].ws.send(JSON.stringify({ type: "chat:send", text: "多人 smoke 測試" }));
clients[1].ws.send(JSON.stringify({ type: "player:return-safe" }));

await wait(1800);

for (const { ws } of clients) {
  ws.close();
}

const missingSnapshot = clients.filter(({ state }) => state.snapshots === 0);
if (missingSnapshot.length > 0) {
  throw new Error(`missing snapshots: ${missingSnapshot.map(({ state }) => state.index).join(", ")}`);
}

const totalChats = clients.reduce((sum, { state }) => sum + state.chats, 0);
if (totalChats === 0) {
  throw new Error("chat broadcast was not observed");
}

console.log(
  `Multiplayer smoke passed: ${clients.length} clients, ${totalChats} chat observations, ${clients.reduce(
    (sum, { state }) => sum + state.mapChanges,
    0
  )} map changes.`
);
