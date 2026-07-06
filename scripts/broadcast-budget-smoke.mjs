// smoke:broadcast-budget — 驗證 world:snapshot 廣播成本不隨同圖人數線性成長。
// 做法:連 N 個 client 到同一張圖,取兩次 /debug/broadcast-stats,
// 斷言「每個廣播 pass 的 JSON.stringify 次數 ≈ 有人的地圖數」而非「≈ 在線人數」。
// SMOKE_REPORT_ONLY=1 只印量測數字不斷言(用來量改前基準)。
import { WebSocket } from "ws";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const httpUrl = process.env.SMOKE_HTTP_URL ?? "http://localhost:8787";
const playerCount = Number.parseInt(process.env.SMOKE_PLAYER_COUNT ?? "15", 10);
const sampleMs = Number.parseInt(process.env.SMOKE_SAMPLE_MS ?? "3000", 10);
const reportOnly = process.env.SMOKE_REPORT_ONLY === "1";
const mapId = "fog-harbor-test";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStats() {
  const response = await fetch(`${httpUrl}/debug/broadcast-stats`);
  if (!response.ok) {
    throw new Error(`/debug/broadcast-stats responded ${response.status}`);
  }
  return response.json();
}

function connectClient(index) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=broadcast-budget-smoke-${index}-${Date.now()}`);
    const state = { index, playerId: "", snapshots: 0 };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`client ${index} welcome timed out`));
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
        state.snapshots += 1;
      }
    });
    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
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
        name: `廣播測試${state.index}`,
        className: "swordsman",
        mapId,
        x: 260 + state.index * 24,
        y: 430,
        facing: "right",
        animation: "idle"
      }
    })
  );
}

// 等所有 client 都落到同一張圖、快照穩定後再取樣。
await wait(1200);
for (const { state } of clients) {
  state.snapshots = 0;
}

const before = await fetchStats();
await wait(sampleMs);
const after = await fetchStats();

await Promise.all(
  clients.map(
    ({ ws }) =>
      new Promise((resolve) => {
        ws.once("close", resolve);
        ws.close();
      })
  )
);

const passes = after.passes - before.passes;
const serializations = after.snapshotSerializations - before.snapshotSerializations;
const messages = after.snapshotMessages - before.snapshotMessages;
const bytes = after.snapshotBytes - before.snapshotBytes;
if (passes <= 0) {
  throw new Error(`no broadcast passes observed in ${sampleMs}ms (server not ticking?)`);
}

const serializationsPerPass = serializations / passes;
const messagesPerPass = messages / passes;
const seconds = sampleMs / 1000;
const summary = [
  `clients=${playerCount} (same map: ${mapId})`,
  `online=${after.online}, activeMaps=${after.activeMaps}`,
  `passes=${passes} (${(passes / seconds).toFixed(1)}/s)`,
  `serializations/pass=${serializationsPerPass.toFixed(2)}`,
  `messages/pass=${messagesPerPass.toFixed(2)}`,
  `bytes/pass=${Math.round(bytes / passes)}`,
  `bytes/client/s=${Math.round(bytes / after.online / seconds)}`
].join(", ");

console.log(`broadcast-budget: ${summary}`);

if (reportOnly) {
  console.log("broadcast-budget: report-only mode, no assertions.");
} else {
  assertBudget();
}

function assertBudget() {

// 核心斷言:每 pass 序列化次數 ≈ 有人的地圖數(+1 容忍取樣期間換圖),而非 ≈ 人數。
if (serializationsPerPass > after.activeMaps + 1) {
  throw new Error(
    `serializations/pass ${serializationsPerPass.toFixed(2)} exceeds activeMaps+1 (${after.activeMaps + 1}) — per-receiver serialization regression?`
  );
}
if (playerCount >= 10 && serializationsPerPass > playerCount / 2) {
  throw new Error(
    `serializations/pass ${serializationsPerPass.toFixed(2)} scales with player count (${playerCount}) — grouping broken`
  );
}
// 每個 client 仍要收到快照(送達不因共用字串而漏)。
if (messagesPerPass < playerCount - 1) {
  throw new Error(
    `messages/pass ${messagesPerPass.toFixed(2)} < clients-1 (${playerCount - 1}) — some clients stopped receiving snapshots`
  );
}
const starved = clients.filter(({ state }) => state.snapshots < 10);
if (starved.length > 0) {
  throw new Error(
    `clients with <10 snapshots in window: ${starved.map(({ state }) => state.index).join(", ")}`
  );
}

console.log("broadcast-budget smoke passed: serialization cost tracks maps, not players.");
}
