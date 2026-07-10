import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const httpUrl = process.env.SMOKE_HTTP_URL ?? "http://localhost:8787";
const slot = `message-validation-smoke-${Date.now()}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, label, timeoutMs = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = predicate();
    if (result) {
      return result;
    }
    await wait(50);
  }
  throw new Error(`timed out waiting for ${label}`);
}

async function fetchReliabilityStats() {
  const response = await fetch(`${httpUrl}/debug/reliability-stats`);
  if (!response.ok) {
    throw new Error(`/debug/reliability-stats responded ${response.status}`);
  }
  return response.json();
}

function connect(slotName = slot) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=${slotName}`);
    const state = { playerId: "", self: null };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("message validation smoke welcome timed out"));
    }, 5000);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome") {
        state.playerId = message.playerId;
        clearTimeout(timer);
        resolve({ ws, state });
        return;
      }
      if (message.type === "world:snapshot") {
        state.self = message.players.find((player) => player.id === state.playerId) ?? state.self;
      }
    });
    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function playerUpdate(state, overrides = {}) {
  return {
    type: "player:update",
    player: {
      id: state.playerId,
      name: "驗證測試員",
      className: "hunter",
      mapId: "fog-harbor-test",
      x: state.self.x,
      y: state.self.y,
      facing: "right",
      animation: "idle",
      ...overrides
    }
  };
}

const before = await fetchReliabilityStats();
const { ws, state } = await connect();
await waitFor(() => state.self, "initial self snapshot");

// The first valid update is the one allowed character-creation assignment.
ws.send(JSON.stringify(playerUpdate(state)));
await waitFor(() => state.self?.name === "驗證測試員" && state.self?.className === "hunter", "initial identity assignment");
const accepted = { x: state.self.x, y: state.self.y };

// Invalid JSON, unknown message type, malformed payload, and unknown item must
// all be rejected at the runtime boundary without crashing the process.
ws.send('{"type":');
ws.send(JSON.stringify({ type: "unknown:test", payload: true }));
ws.send(JSON.stringify(playerUpdate(state, { x: null })));
ws.send(JSON.stringify({ type: "inventory:use", itemId: "not-a-real-item" }));

// Valid-shaped attempts to change maps, teleport, or change an established
// identity must also be rejected by the stateful server checks.
ws.send(JSON.stringify(playerUpdate(state, { mapId: "old-harbor-warehouse" })));
ws.send(JSON.stringify(playerUpdate(state, { x: accepted.x + 1_000_000 })));
ws.send(JSON.stringify(playerUpdate(state, { name: "竄改名稱", className: "talisman" })));

await wait(500);
const after = await fetchReliabilityStats();
const health = await fetch(`${httpUrl}/health`);
if (!health.ok) {
  throw new Error(`server health failed after hostile messages: ${health.status}`);
}

const current = await waitFor(() => state.self, "post-validation self snapshot");
if (current.name !== "驗證測試員" || current.className !== "hunter") {
  throw new Error(`identity changed despite lock: ${current.name}/${current.className}`);
}
if (Math.abs(current.x - accepted.x) > 1 || Math.abs(current.y - accepted.y) > 1) {
  throw new Error(`position changed despite rejected movement: (${accepted.x},${accepted.y}) -> (${current.x},${current.y})`);
}

const deltas = {
  invalidMessages: after.messages.invalidMessages - before.messages.invalidMessages,
  rejectedMapChanges: after.messages.rejectedMapChanges - before.messages.rejectedMapChanges,
  rejectedMovements: after.messages.rejectedMovements - before.messages.rejectedMovements,
  rejectedIdentityChanges: after.messages.rejectedIdentityChanges - before.messages.rejectedIdentityChanges
};
if (deltas.invalidMessages < 4) {
  throw new Error(`expected at least 4 invalid messages, got ${deltas.invalidMessages}`);
}
for (const key of ["rejectedMapChanges", "rejectedMovements", "rejectedIdentityChanges"]) {
  if (deltas[key] < 1) {
    throw new Error(`expected ${key} to increase, got ${deltas[key]}`);
  }
}

await new Promise((resolve) => {
  ws.once("close", resolve);
  ws.close();
});

// A player may close the browser while still on the title screen. That creates
// a save row, but must not consume the one allowed character-creation update.
const titleOnlySlot = `message-validation-title-only-${Date.now()}`;
const titleOnly = await connect(titleOnlySlot);
await waitFor(() => titleOnly.state.self, "title-only initial snapshot");
await new Promise((resolve) => {
  titleOnly.ws.once("close", resolve);
  titleOnly.ws.close();
});
await wait(150);
const resumed = await connect(titleOnlySlot);
await waitFor(() => resumed.state.self, "title-only reconnect snapshot");
resumed.ws.send(
  JSON.stringify(playerUpdate(resumed.state, { name: "稍後建立角色", className: "talisman" }))
);
await waitFor(
  () => resumed.state.self?.name === "稍後建立角色" && resumed.state.self?.className === "talisman",
  "deferred initial identity assignment"
);
await new Promise((resolve) => {
  resumed.ws.once("close", resolve);
  resumed.ws.close();
});

const oversized = await connect(`message-validation-oversized-${Date.now()}`);
await waitFor(() => oversized.state.self, "oversized-frame initial snapshot");
const oversizedClosed = new Promise((resolve) => oversized.ws.once("close", resolve));
oversized.ws.send(JSON.stringify({ type: "chat:send", text: "x".repeat(20_000) }));
await Promise.race([
  oversizedClosed,
  wait(3000).then(() => {
    throw new Error("oversized WebSocket frame was not closed");
  })
]);
const finalHealth = await fetch(`${httpUrl}/health`);
if (!finalHealth.ok) {
  throw new Error(`server health failed after oversized frame: ${finalHealth.status}`);
}
console.log(`Message validation smoke passed: ${JSON.stringify(deltas)}; server remained healthy.`);
