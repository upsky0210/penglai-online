import { WebSocket } from "ws";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:8787";
const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const adminToken = process.env.SMOKE_ADMIN_TOKEN ?? "";
if (!adminToken) throw new Error("SMOKE_ADMIN_TOKEN is required for P9-D classroom smoke.");

const slot = `smoke-p9-d-${Date.now()}`;
const socket = new WebSocket(`${wsUrl}?slot=${encodeURIComponent(slot)}`);
const queue = [];
const waiters = [];
socket.on("message", (data) => {
  const message = JSON.parse(data.toString());
  const waiterIndex = waiters.findIndex((waiter) => waiter.predicate(message));
  if (waiterIndex >= 0) {
    const [waiter] = waiters.splice(waiterIndex, 1);
    clearTimeout(waiter.timer);
    waiter.resolve(message);
  } else {
    queue.push(message);
  }
});

function waitForMessage(predicate, label, timeoutMs = 5000) {
  const queuedIndex = queue.findIndex(predicate);
  if (queuedIndex >= 0) return Promise.resolve(queue.splice(queuedIndex, 1)[0]);
  return new Promise((resolve, reject) => {
    const waiter = { predicate, resolve, timer: undefined };
    waiter.timer = setTimeout(() => {
      const index = waiters.indexOf(waiter);
      if (index >= 0) waiters.splice(index, 1);
      reject(new Error(`Timed out waiting for ${label}.`));
    }, timeoutMs);
    waiters.push(waiter);
  });
}

async function request(path, expectedStatus, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${path} expected ${expectedStatus}, got ${response.status}: ${text}`);
  }
  return { response, text };
}

const authed = (path) => `${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(adminToken)}`;

try {
  const welcome = await waitForMessage((message) => message.type === "session:welcome", "session welcome");
  const playerId = welcome.playerId;
  await waitForMessage((message) => message.type === "quest:update", "initial quest state");

  await request("/admin/classroom/progress", 403);
  await request("/admin/classroom/progress.csv", 403);
  await request("/admin/classroom/hint", 403, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, text: "unauthorized" })
  });
  await request("/admin/classroom/reset-position", 403, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId })
  });

  const beforePayload = JSON.parse((await request(authed("/admin/classroom/progress"), 200)).text);
  const before = beforePayload.students.find((student) => student.playerId === playerId);
  if (!before || typeof before.mapName !== "string" || typeof before.lastActivityAt !== "number" || !Array.isArray(before.stuckReasons)) {
    throw new Error(`Classroom progress row is incomplete: ${JSON.stringify(before)}`);
  }

  await request(authed("/admin/classroom/hint"), 400, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, text: "   " })
  });
  const hintText = `[SMOKE:P9-D] 請先查看目前任務方向。`;
  await request(authed("/admin/classroom/hint"), 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, text: hintText })
  });
  const notice = await waitForMessage((message) => message.type === "admin:notice" && message.text === hintText, "individual hint");
  if (notice.category !== "classroom") throw new Error("Individual hint did not use classroom notice category.");

  const resetPayload = JSON.parse((await request(authed("/admin/classroom/reset-position"), 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId })
  })).text);
  if (!resetPayload.preserved?.includes("quests") || !resetPayload.preserved?.includes("inventory") || !resetPayload.preserved?.includes("save")) {
    throw new Error(`Reset response did not guarantee progress preservation: ${JSON.stringify(resetPayload)}`);
  }
  await waitForMessage((message) => message.type === "map:change" && message.playerId === playerId, "safe-zone map change");

  const afterPayload = JSON.parse((await request(authed("/admin/classroom/progress"), 200)).text);
  const after = afterPayload.students.find((student) => student.playerId === playerId);
  for (const field of ["level", "currentQuestId", "questStatus", "questProgress", "questTarget", "completedQuests", "totalQuests"]) {
    if (after?.[field] !== before[field]) throw new Error(`Reset changed ${field}: before=${before[field]} after=${after?.[field]}`);
  }

  const csv = (await request(authed("/admin/classroom/progress.csv"), 200)).text;
  const header = csv.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0].toLowerCase();
  for (const forbidden of ["password", "token", "session", "account_email", "save_slot"]) {
    if (header.includes(forbidden)) throw new Error(`Classroom CSV leaked forbidden field: ${forbidden}`);
  }
  for (const required of ["character_name", "completed_quests", "current_quest", "quest_progress"]) {
    if (!header.includes(required)) throw new Error(`Classroom CSV missing teacher field: ${required}`);
  }

  const logs = JSON.parse((await request(authed("/admin/action-logs?limit=30"), 200)).text).actionLogs;
  if (!logs.some((log) => log.action === "student_hint" && log.targetPlayerId === playerId)) {
    throw new Error("Student hint action log was not recorded.");
  }
  if (!logs.some((log) => log.action === "reset_player_position" && log.targetPlayerId === playerId)) {
    throw new Error("Position reset action log was not recorded.");
  }
  console.log("P9-D classroom API, permission, safe reset, export and action-log smoke passed.");
} finally {
  socket.close();
}
