// Save roundtrip smoke: verifies that (mapId, x, y) and core character fields
// survive a disconnect/reconnect, and that re-entering with the same save code
// (what the client's 匯入存檔碼 does) restores an equivalent character.
// Requires a running server on localhost:8787 (like every other smoke script).
import { WebSocket } from "ws";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const slot = `smoke-save-rt-${Date.now()}`;

// Bounds of the maps this script touches (mirrors shared GAME_MAPS; smoke scripts
// are plain .mjs and cannot import the TS shared workspace).
const MAP_BOUNDS = {
  "fog-harbor-test": { width: 2400, height: 540 },
  "old-harbor-warehouse": { width: 2200, height: 540 }
};

const TARGET_MAP = "old-harbor-warehouse";
const TARGET_X = 1800;
const TARGET_Y = 430;

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

function fail(message) {
  console.error(`save-roundtrip smoke FAILED: ${message}`);
  process.exit(1);
}

function connectClient(slotName) {
  return new Promise((resolveConnect, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=${slotName}`);
    const state = { playerId: "", welcome: null, mapChanges: [], snapshots: [] };
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("save-roundtrip smoke welcome timed out"));
    }, 5000);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome") {
        state.playerId = message.playerId;
        state.welcome = message;
        clearTimeout(timer);
        resolveConnect({ ws, state });
        return;
      }
      if (message.type === "map:change") {
        state.mapChanges.push({ mapId: message.mapId, x: message.x, y: message.y });
      }
      if (message.type === "world:snapshot") {
        state.snapshots.push(message);
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
        name: "Smoke存檔旅人",
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

async function movePlayer(ws, state, mapId, targetX, targetY) {
  const current = latestSelf(state);
  if (!current || current.mapId !== mapId) {
    fail(`cannot move without current ${mapId} snapshot: ${JSON.stringify(current)}`);
  }

  let x = current.x;
  let y = current.y;
  while (Math.abs(targetX - x) > 1 || Math.abs(targetY - y) > 1) {
    x += Math.sign(targetX - x) * Math.min(20, Math.abs(targetX - x));
    y += Math.sign(targetY - y) * Math.min(45, Math.abs(targetY - y));
    sendPlayerUpdate(ws, state, mapId, x, y);
    await wait(100);
  }
  await wait(150);
}

function latestSelf(state) {
  for (let i = state.snapshots.length - 1; i >= 0; i -= 1) {
    const self = state.snapshots[i].players.find((player) => player.id === state.playerId);
    if (self) {
      return { mapId: state.snapshots[i].mapId, ...self };
    }
  }
  return null;
}

function describe(self) {
  return `map=${self.mapId} x=${self.x} y=${self.y} lv=${self.level} exp=${self.exp} gold=${self.gold}`;
}

function assertInBounds(self) {
  const bounds = MAP_BOUNDS[self.mapId];
  if (!bounds) {
    fail(`unexpected map '${self.mapId}' (no bounds entry)`);
  }
  if (self.x < 0 || self.x > bounds.width || self.y < 0 || self.y > bounds.height) {
    fail(`position out of bounds for ${self.mapId} (${bounds.width}x${bounds.height}): x=${self.x} y=${self.y}`);
  }
}

function assertEquivalent(label, before, after) {
  const fields = ["mapId", "name", "className", "level", "exp", "gold"];
  for (const field of fields) {
    if (before[field] !== after[field]) {
      fail(`${label}: field '${field}' differs (${before[field]} -> ${after[field]})`);
    }
  }
  if (Math.abs(before.x - after.x) > 1 || Math.abs(before.y - after.y) > 1) {
    fail(`${label}: position differs (${before.x},${before.y}) -> (${after.x},${after.y})`);
  }
}

function cleanupSlot(slotName) {
  const dbPath = resolve(process.env.PENGLAI_DB_PATH ?? "server/data/penglai.sqlite");
  if (!existsSync(dbPath)) {
    console.warn(`cleanup skipped: ${dbPath} not found (slot ${slotName} matches %smoke% for admin cleanup)`);
    return;
  }
  try {
    const db = new DatabaseSync(dbPath);
    try {
      db.exec("PRAGMA busy_timeout = 2000");
      for (const table of ["characters", "inventory_items", "equipment_items", "quest_states", "account_save_slots"]) {
        db.prepare(`DELETE FROM ${table} WHERE save_slot = ?`).run(slotName);
      }
    } finally {
      db.close();
    }
  } catch (error) {
    console.warn(`cleanup skipped (${error.message}); slot ${slotName} matches %smoke% for admin cleanup`);
  }
}

// Phase 1: fresh slot, travel to a non-default map, stand at an in-bounds spot.
const first = await connectClient(slot);
await wait(250);
await movePlayer(first.ws, first.state, "fog-harbor-test", 1385, 455);
first.ws.send(JSON.stringify({ type: "portal:enter", portalId: "to-old-warehouse" }));
await wait(400);
if (!first.state.mapChanges.some((change) => change.mapId === TARGET_MAP)) {
  fail(`never entered ${TARGET_MAP}: ${JSON.stringify(first.state.mapChanges)}`);
}
await movePlayer(first.ws, first.state, TARGET_MAP, TARGET_X, TARGET_Y);
const before = latestSelf(first.state);
if (!before || before.mapId !== TARGET_MAP) {
  fail(`server did not place player on ${TARGET_MAP} before disconnect: ${JSON.stringify(before)}`);
}
console.log(`before disconnect: ${describe(before)}`);
first.ws.close();
await wait(400);

// Phase 2: reconnect the same slot — must come back to the same map, in bounds.
const second = await connectClient(slot);
if (second.state.welcome.mapId !== TARGET_MAP) {
  fail(`welcome after reconnect returned mapId '${second.state.welcome.mapId}', expected '${TARGET_MAP}'`);
}
await wait(600);
if (!second.state.mapChanges.some((change) => change.mapId === TARGET_MAP)) {
  fail(`reconnect did not send map:change for ${TARGET_MAP}: ${JSON.stringify(second.state.mapChanges)}`);
}
const restored = latestSelf(second.state);
if (!restored) {
  fail("no snapshot containing the player after reconnect");
}
assertInBounds(restored);
assertEquivalent("reconnect roundtrip", before, restored);
console.log(`after reconnect:  ${describe(restored)}`);
second.ws.close();
await wait(400);

// Phase 3: the exported save code IS the slot code; importing it on another
// client reconnects to the same slot. Verify that yields an equivalent character.
const third = await connectClient(slot);
await wait(600);
const imported = latestSelf(third.state);
if (!imported) {
  fail("no snapshot containing the player after save-code import");
}
assertInBounds(imported);
assertEquivalent("save-code import", restored, imported);
console.log(`after import:     ${describe(imported)}`);
third.ws.close();
await wait(400);

cleanupSlot(slot);
console.log("Save roundtrip smoke passed: mapId/coords/level/exp/gold survive reconnect and save-code import.");
