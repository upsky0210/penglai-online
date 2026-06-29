import { WebSocket } from "ws";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:8787";
const wsUrl = process.env.SMOKE_WS_URL ?? "ws://localhost:8787";
const adminToken = process.env.SMOKE_ADMIN_TOKEN ?? "";

async function assertFetch(path, expectedStatus, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${path} expected ${expectedStatus}, got ${response.status}: ${text}`);
  }
  return text;
}

async function assertFetchAny(path, expectedStatuses, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${path} expected ${expectedStatuses.join(" or ")}, got ${response.status}: ${text}`);
  }
  return text;
}

async function assertWebSocketWelcome() {
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?slot=smoke-script-slot`);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket welcome timed out."));
    }, 4000);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "session:welcome" && message.saveSlot === "smoke-script-slot") {
        clearTimeout(timer);
        ws.close();
        resolve();
      }
    });
    ws.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

await assertFetch("/health", 200);
await assertFetch("/auth/session?session=sess_fake", 401);
await assertFetch("/account/save-slots?session=sess_fake", 401);
await assertFetch("/auth/logout", 200, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId: "sess_fake" })
});
const feedbackResponse = await assertFetch("/feedback", 200, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    testerName: "Smoke Tester",
    schoolName: "Smoke School",
    classGroup: "Smoke Class",
    playerName: "Smoke Hero",
    saveSlot: "smoke-script-slot",
    mapId: "fog-harbor-test",
    currentZone: "Smoke Zone",
    activeQuest: "Smoke Quest",
    chapterProgress: "Smoke progress",
    feedbackCategory: "bug",
    deviceType: "desktop",
    difficulty: 3,
    stuckPoint: "Smoke stuck point",
    suggestion: "Smoke suggestion",
    contactAllowed: true
  })
});
const feedbackId = JSON.parse(feedbackResponse).id;
if (adminToken) {
  const summaryResponse = await assertFetch(`/admin/summary?token=${encodeURIComponent(adminToken)}`, 200);
  const summary = JSON.parse(summaryResponse);
  if (!summary.betaFeedback || summary.betaFeedback.total < 1 || !Array.isArray(summary.betaFeedback.byCategory)) {
    throw new Error(`admin summary missing beta feedback metrics: ${summaryResponse}`);
  }
  const systemResponse = await assertFetch(`/admin/system?token=${encodeURIComponent(adminToken)}`, 200);
  const systemStatus = JSON.parse(systemResponse);
  if (typeof systemStatus.googleClientConfigured !== "boolean" || typeof systemStatus.authCorsOrigin !== "string") {
    throw new Error(`admin system missing auth readiness fields: ${systemResponse}`);
  }
  await assertFetch(`/admin/characters?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/characters.csv?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/online?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/chat-logs?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/chat-logs.csv?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/action-logs?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/action-logs.csv?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/announcements?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/announcements.csv?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/feedback?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/feedback.csv?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/feedback/status?token=${encodeURIComponent(adminToken)}`, 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: feedbackId, status: "reviewing", adminNote: "Smoke status update" })
  });
  await assertFetch(`/admin/backups?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/backups?token=${encodeURIComponent(adminToken)}`, 200, {
    method: "POST"
  });
  await assertFetch(`/admin/save-audit?token=${encodeURIComponent(adminToken)}`, 200);
  const testDataResponse = await assertFetch(`/admin/test-data?token=${encodeURIComponent(adminToken)}`, 200);
  const testData = JSON.parse(testDataResponse);
  if (!testData.report || typeof testData.report.smokeFeedback !== "number") {
    throw new Error(`admin test data report missing smoke metrics: ${testDataResponse}`);
  }
  const dryRunCleanupResponse = await assertFetch(`/admin/test-data/cleanup?token=${encodeURIComponent(adminToken)}`, 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dryRun: true })
  });
  const dryRunCleanup = JSON.parse(dryRunCleanupResponse);
  if (!dryRunCleanup.dryRun || !dryRunCleanup.report || typeof dryRunCleanup.report.smokeCharacters !== "number") {
    throw new Error(`admin test data dry-run cleanup returned invalid payload: ${dryRunCleanupResponse}`);
  }
  await assertFetch(`/admin/test-data/cleanup?token=${encodeURIComponent(adminToken)}`, 400, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dryRun: false, confirmText: "WRONG" })
  });
  await assertFetch(`/admin/classroom?token=${encodeURIComponent(adminToken)}`, 200);
  await assertFetch(`/admin/classroom?token=${encodeURIComponent(adminToken)}`, 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatLocked: false, chatLockMessage: "Smoke test classroom state" })
  });
  await assertFetch(`/admin/broadcast?token=${encodeURIComponent(adminToken)}`, 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Smoke test announcement", category: "system", ttlMinutes: 60 })
  });
  await assertFetch(`/admin/mute?token=${encodeURIComponent(adminToken)}`, 404, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId: "missing-player", muted: true })
  });
  await assertFetch(`/admin/kick?token=${encodeURIComponent(adminToken)}`, 404, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId: "missing-player" })
  });
} else {
  await assertFetchAny("/admin/summary", [403, 503]);
}
await assertWebSocketWelcome();

console.log("Smoke checks passed.");
