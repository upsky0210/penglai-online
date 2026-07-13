const httpUrl = process.env.SMOKE_HTTP_URL ?? "http://127.0.0.1:8787";
const adminToken = process.env.SMOKE_ADMIN_TOKEN ?? "";
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

if (!adminToken) throw new Error("SMOKE_ADMIN_TOKEN is required");

const first = await login("s01", `p10a-${runId}-s01`);
const second = await login("s02", `p10a-${runId}-s02`);

if (first.account.email === second.account.email || first.sessionId === second.sessionId) {
  throw new Error("student accounts or sessions were not isolated");
}
assertSlots(first, [`p10a-${runId}-s01`]);
assertSlots(second, [`p10a-${runId}-s02`]);

const firstSlots = await request(`/account/save-slots?session=${encodeURIComponent(first.sessionId)}`, 200);
const secondSlots = await request(`/account/save-slots?session=${encodeURIComponent(second.sessionId)}`, 200);
assertSlots(firstSlots, [`p10a-${runId}-s01`]);
assertSlots(secondSlots, [`p10a-${runId}-s02`]);

await request("/admin/classroom/progress", 403);
const csvResponse = await fetch(`${httpUrl}/admin/classroom/progress.csv?token=${encodeURIComponent(adminToken)}`);
if (!csvResponse.ok) throw new Error(`teacher CSV failed with ${csvResponse.status}`);
const csv = await csvResponse.text();
const header = csv.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0].toLowerCase();
for (const forbidden of ["email", "save_slot", "password", "token", "session"]) {
  if (header.includes(forbidden)) throw new Error(`teacher CSV exposes forbidden field: ${forbidden}`);
}

await request("/auth/logout", 200, { method: "POST", body: JSON.stringify({ sessionId: first.sessionId }) });
await request(`/auth/session?session=${encodeURIComponent(first.sessionId)}`, 401);
const secondStillActive = await request(`/auth/session?session=${encodeURIComponent(second.sessionId)}`, 200);
if (!secondStillActive.active || secondStillActive.account.email !== second.account.email) {
  throw new Error("logging out one student affected another student session");
}

console.log("P10-A account isolation smoke passed: separate students/saves/sessions, teacher auth and privacy-safe classroom CSV.");

async function login(label, saveSlot) {
  return request("/auth/google", 200, {
    method: "POST",
    body: JSON.stringify({
      credential: `mock:p10a-${runId}-${label}@example.invalid`,
      saveSlot,
      characterName: label.toUpperCase()
    })
  });
}

async function request(path, expectedStatus, init) {
  const response = await fetch(`${httpUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${path} expected ${expectedStatus}, received ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function assertSlots(payload, expected) {
  const slots = (payload.saveSlots ?? []).map((entry) => entry.saveSlot).sort();
  if (JSON.stringify(slots) !== JSON.stringify([...expected].sort())) {
    throw new Error(`account save slots crossed boundaries: ${JSON.stringify(slots)}`);
  }
}
