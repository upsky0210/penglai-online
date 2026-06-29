import { randomUUID } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { basename, dirname, join } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import {
  CLASS_SKILL_IDS,
  DEFAULT_GAME_MAP,
  FOG_HARBOR_TEST_MAP,
  GAME_MAPS,
  ITEM_DEFINITIONS,
  MONSTER_KIND_NAMES,
  QUEST_DEFINITIONS,
  SHOP_DEFINITIONS,
  SKILL_DEFINITIONS,
  getGameMap,
  type CharacterClass,
  type ClientMessage,
  type EquipmentSnapshot,
  type InventorySlot,
  type ItemDropSnapshot,
  type ItemId,
  type MapId,
  type MonsterSnapshot,
  type PlayerSnapshot,
  type QuestSnapshot,
  type ServerMessage,
  type ShopDefinition,
  type SkillId
} from "@penglai/shared";
import { GoogleAuthError, GoogleAuthVerifier } from "./googleAuth.js";
import {
  bindAccountSaveSlot,
  createAuthSession,
  cleanupSmokeTestData,
  getAccountById,
  getAdminSaveAudit,
  getAdminSummary,
  getAuthSession,
  getDatabasePath,
  getFirstSaveSlotForAccount,
  getTestDataReport,
  listAdminActionLogs,
  listActiveAdminAnnouncements,
  listAdminAnnouncements,
  listAdminCharacters,
  listAdminChatLogs,
  listAdminTestFeedback,
  listSaveSlotsForAccount,
  loadGame,
  logAdminAction,
  logChatMessage,
  revokeAuthSession,
  saveAdminAnnouncement,
  saveGame,
  saveTestFeedback,
  updateTestFeedbackStatus,
  upsertGoogleAccount,
  type FeedbackStatus,
  type SavedQuest
} from "./persistence.js";

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const allowedGoogleHostedDomain = process.env.GOOGLE_HOSTED_DOMAIN ?? "";
const authCorsOrigin = process.env.AUTH_CORS_ORIGIN ?? "*";
const adminToken = process.env.ADMIN_TOKEN ?? "";
const backupDirectory = process.env.PENGLAI_BACKUP_DIR ?? join(dirname(getDatabasePath()), "../backups");
const googleAuth = new GoogleAuthVerifier(googleClientId, allowedGoogleHostedDomain);
const httpServer = createServer((request, response) => {
  void handleHttpRequest(request, response);
});
const wss = new WebSocketServer({ server: httpServer });
const players = new Map<string, PlayerSnapshot>();
const sockets = new Map<string, WebSocket>();
const monsters = new Map<string, MonsterSnapshot>();
const itemDrops = new Map<string, ItemDropSnapshot>();
const inventories = new Map<string, Map<ItemId, number>>();
const playerEquipment = new Map<string, EquipmentSnapshot>();
const playerQuests = new Map<string, Map<string, QuestSnapshot>>();
const playerSaveSlots = new Map<string, string>();
const playerAccountIds = new Map<string, string>();
const respawnAt = new Map<string, number>();
const playerRespawnAt = new Map<string, number>();
const playerDamageCooldownUntil = new Map<string, number>();
const playerInvulnerableUntil = new Map<string, number>();
const playerSkillReadyAt = new Map<string, Map<SkillId, number>>();
const playerChatReadyAt = new Map<string, number>();
const playerReturnSafeReadyAt = new Map<string, number>();
const mutedPlayers = new Map<string, { reason: string; mutedAt: number }>();
const recentAttacks = new Map<string, number>();
let lastWorldTickAt = Date.now();
let classroomChatLocked = false;
let classroomChatLockMessage = "課堂聊天已暫停，請聽老師說明。";

const baseAttack = 12;
const baseDefense = 0;
const contactDamage = 12;
const contactDamageCooldownMs = 850;
const playerRespawnDelayMs = 1500;
const playerRespawnInvulnerableMs = 1200;
const itemPickupRange = 72;
const itemDropLifetimeMs = 60_000;
const chatCooldownMs = 1200;
const returnSafeCooldownMs = 15_000;
const equipmentDropChances: Partial<Record<ItemId, number>> = {
  "training-sword": 0.18,
  "cloth-vest": 0.24,
  "harbor-dagger": 0.12,
  "patched-jacket": 0.16,
  "warehouse-talisman": 0.08,
  "reef-blade": 0.08,
  "coral-coat": 0.07,
  "archive-wand": 0.06,
  "scholar-robe": 0.06,
  "star-sabre": 0.07,
  "observer-cloak": 0.06
};
const equipmentDropMapRestrictions: Partial<Record<ItemId, MapId>> = {
  "harbor-dagger": "old-harbor-warehouse",
  "patched-jacket": "old-harbor-warehouse",
  "warehouse-talisman": "old-harbor-warehouse",
  "reef-blade": "coral-tide-cavern",
  "coral-coat": "coral-tide-cavern",
  "archive-wand": "sunken-archive",
  "scholar-robe": "sunken-archive",
  "star-sabre": "starlit-observatory",
  "observer-cloak": "starlit-observatory"
};
const equipmentDropChanceMultiplier = Number.parseFloat(process.env.EQUIPMENT_DROP_CHANCE_MULTIPLIER ?? "1");
const characterClasses = new Set<CharacterClass>(["swordsman", "talisman", "hunter"]);
const classConfigs: Record<
  CharacterClass,
  {
    maxHp: number;
    maxMp: number;
    mpRegenPerSecond: number;
    attackBonus: number;
    defenseBonus: number;
    normalAttackRange: number;
    normalAttackVerticalRange: number;
    skillDamageBonus: number;
    skillRangeBonus: number;
    skillVerticalRangeBonus: number;
  }
> = {
  swordsman: {
    maxHp: 115,
    maxMp: 36,
    mpRegenPerSecond: 4.5,
    attackBonus: 3,
    defenseBonus: 2,
    normalAttackRange: 70,
    normalAttackVerticalRange: 48,
    skillDamageBonus: 0,
    skillRangeBonus: 0,
    skillVerticalRangeBonus: 0
  },
  talisman: {
    maxHp: 90,
    maxMp: 60,
    mpRegenPerSecond: 6,
    attackBonus: -1,
    defenseBonus: 0,
    normalAttackRange: 64,
    normalAttackVerticalRange: 46,
    skillDamageBonus: 10,
    skillRangeBonus: 14,
    skillVerticalRangeBonus: 8
  },
  hunter: {
    maxHp: 100,
    maxMp: 42,
    mpRegenPerSecond: 5,
    attackBonus: 1,
    defenseBonus: 0,
    normalAttackRange: 100,
    normalAttackVerticalRange: 54,
    skillDamageBonus: 2,
    skillRangeBonus: 26,
    skillVerticalRangeBonus: 4
  }
};

for (const map of Object.values(GAME_MAPS)) {
  for (const spawn of map.monsterSpawns) {
    monsters.set(spawn.id, {
      id: spawn.id,
      kind: spawn.kind,
      mapId: map.id,
      name: spawn.name,
      x: spawn.x,
      y: spawn.y,
      hp: spawn.maxHp,
      maxHp: spawn.maxHp,
      alive: true,
      facing: "left",
      hitAt: 0,
      updatedAt: Date.now()
    });
  }
}

function getExpToNext(level: number) {
  return 60 + (level - 1) * 45;
}

function normalizePlayerName(name: string) {
  return Array.from(name.trim().replace(/\s+/g, "")).slice(0, 12).join("") || "旅人";
}

function isCharacterClass(value: unknown): value is CharacterClass {
  return typeof value === "string" && characterClasses.has(value as CharacterClass);
}

function getClassConfig(className: CharacterClass) {
  return classConfigs[className];
}

function getPlayerClassConfig(playerId: string) {
  return getClassConfig(players.get(playerId)?.className ?? "swordsman");
}

function getMaxHp(playerId: string, className?: CharacterClass) {
  return getClassConfig(className ?? players.get(playerId)?.className ?? "swordsman").maxHp;
}

function getMaxMp(playerId: string, className?: CharacterClass) {
  return getClassConfig(className ?? players.get(playerId)?.className ?? "swordsman").maxMp;
}

function clampStat(value: number | undefined, max: number) {
  return Math.max(0, Math.min(value ?? max, max));
}

function createInitialQuests(): Map<string, QuestSnapshot> {
  return new Map(
    QUEST_DEFINITIONS.map((quest) => [
      quest.id,
      {
        ...quest,
        status: "available",
        progress: 0,
        interactedTargetIds: []
      }
    ])
  );
}

function createQuestsFromSave(savedQuests: SavedQuest[]) {
  const quests = createInitialQuests();
  for (const savedQuest of savedQuests) {
    const quest = quests.get(savedQuest.questId);
    if (!quest) {
      continue;
    }

    quests.set(savedQuest.questId, {
      ...quest,
      status: savedQuest.status,
      progress: Math.max(0, Math.min(quest.targetCount, savedQuest.progress)),
      interactedTargetIds: savedQuest.interactedTargetIds ?? []
    });
  }
  return quests;
}

function createInitialEquipment(): EquipmentSnapshot {
  return {
    weapon: null,
    armor: null
  };
}

function createInventoryFromSave(savedInventory: InventorySlot[]) {
  const inventory = new Map<ItemId, number>();
  for (const slot of savedInventory) {
    if (slot.itemId in ITEM_DEFINITIONS && slot.quantity > 0) {
      inventory.set(slot.itemId, slot.quantity);
    }
  }
  return inventory;
}

function createEquipmentFromSave(savedEquipment: EquipmentSnapshot) {
  const equipment = createInitialEquipment();
  for (const slot of ["weapon", "armor"] as const) {
    const itemId = savedEquipment[slot];
    const item = itemId ? ITEM_DEFINITIONS[itemId] : undefined;
    if (item?.kind === "equipment" && item.equipmentSlot === slot) {
      equipment[slot] = itemId;
    }
  }
  return equipment;
}

function normalizeSaveSlot(rawSlot: string | null | undefined, fallback: string) {
  const normalized = rawSlot?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return normalized && normalized.length >= 8 ? normalized : `guest-${fallback}`;
}

function getSaveSlot(requestUrl: string | undefined, fallback: string) {
  try {
    const url = new URL(requestUrl ?? "/", "http://localhost");
    return normalizeSaveSlot(url.searchParams.get("slot"), fallback);
  } catch {
    return `guest-${fallback}`;
  }
}

function getRequestedSaveSlot(requestUrl: string | undefined) {
  try {
    const url = new URL(requestUrl ?? "/", "http://localhost");
    return url.searchParams.get("slot");
  } catch {
    return null;
  }
}

function getSessionId(requestUrl: string | undefined) {
  try {
    const url = new URL(requestUrl ?? "/", "http://localhost");
    return url.searchParams.get("session");
  } catch {
    return null;
  }
}

function getSessionIdFromUrl(url: URL) {
  return url.searchParams.get("session");
}

function setCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", authCorsOrigin);
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  setCorsHeaders(response);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function sendText(response: ServerResponse, statusCode: number, contentType: string, body: string) {
  setCorsHeaders(response);
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
}

function isAdminRequest(url: URL) {
  return Boolean(adminToken) && url.searchParams.get("token") === adminToken;
}

function rejectAdminRequest(response: ServerResponse) {
  if (!adminToken) {
    sendJson(response, 503, { error: "admin_api_not_configured" });
    return;
  }

  sendJson(response, 403, { error: "admin_token_required" });
}

function csvCell(value: unknown) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function normalizeAdminText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 180) : "";
}

function normalizeAnnouncementCategory(value: unknown) {
  const category = typeof value === "string" ? value.trim() : "";
  return ["system", "classroom", "maintenance", "event"].includes(category) ? category : "classroom";
}

function normalizeAnnouncementExpiresAt(value: unknown) {
  const ttlMinutes = typeof value === "number" ? value : Number.parseInt(typeof value === "string" ? value : "", 10);
  if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
    return undefined;
  }

  return Date.now() + Math.min(Math.trunc(ttlMinutes), 7 * 24 * 60) * 60_000;
}

function normalizeFeedbackStatus(value: unknown): FeedbackStatus {
  const status = typeof value === "string" ? value.trim() : "";
  return status === "reviewing" || status === "fixed" || status === "deferred" ? status : "open";
}

function normalizeFeedbackCategory(value: unknown) {
  const category = typeof value === "string" ? value.trim() : "";
  return ["bug", "balance", "navigation", "ui", "performance", "content", "other"].includes(category)
    ? category
    : "other";
}

function normalizeDeviceType(value: unknown) {
  const deviceType = typeof value === "string" ? value.trim() : "";
  return ["desktop", "laptop", "tablet", "mobile", "unknown"].includes(deviceType) ? deviceType : "unknown";
}

function normalizeBoolean(value: unknown) {
  return value === true || value === "true" || value === "1" || value === 1;
}

function normalizeChatText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 160) : "";
}

function normalizeFeedbackText(value: unknown, maxLength = 240) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function normalizeDifficulty(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numberValue)) {
    return 3;
  }

  return Math.max(1, Math.min(5, Math.round(numberValue)));
}

function isBlockedChatText(text: string) {
  const normalized = text.toLowerCase();
  return ["幹你", "白癡", "智障", "fuck", "shit"].some((word) => normalized.includes(word));
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > 16_384) {
      throw new Error("body_too_large");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

async function handleHttpRequest(request: IncomingMessage, response: ServerResponse) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      googleAuthConfigured: googleAuth.isConfigured,
      hostedDomainRestricted: Boolean(allowedGoogleHostedDomain)
    });
    return;
  }

  if (url.pathname === "/auth/google" && request.method === "POST") {
    await handleGoogleAuth(request, response);
    return;
  }

  if (url.pathname === "/auth/session" && request.method === "GET") {
    sendAuthSessionSummary(response, getSessionIdFromUrl(url));
    return;
  }

  if (url.pathname === "/account/save-slots" && request.method === "GET") {
    sendAccountSaveSlots(response, getSessionIdFromUrl(url));
    return;
  }

  if (url.pathname === "/auth/logout" && request.method === "POST") {
    await handleLogout(request, response);
    return;
  }

  if (url.pathname === "/feedback" && request.method === "POST") {
    await handleFeedbackSubmit(request, response);
    return;
  }

  if (url.pathname === "/admin/summary" && request.method === "GET") {
    sendAdminSummary(response, url);
    return;
  }

  if (url.pathname === "/admin/system" && request.method === "GET") {
    sendAdminSystem(response, url);
    return;
  }

  if (url.pathname === "/admin/backups" && request.method === "GET") {
    sendAdminBackups(response, url);
    return;
  }

  if (url.pathname === "/admin/backups" && request.method === "POST") {
    handleAdminCreateBackup(response, url);
    return;
  }

  if (url.pathname === "/admin/save-audit" && request.method === "GET") {
    sendAdminSaveAudit(response, url);
    return;
  }

  if (url.pathname === "/admin/test-data" && request.method === "GET") {
    sendAdminTestDataReport(response, url);
    return;
  }

  if (url.pathname === "/admin/test-data/cleanup" && request.method === "POST") {
    await handleAdminTestDataCleanup(request, response, url);
    return;
  }

  if (url.pathname === "/admin/characters" && request.method === "GET") {
    sendAdminCharacters(response, url);
    return;
  }

  if (url.pathname === "/admin/characters.csv" && request.method === "GET") {
    sendAdminCharactersCsv(response, url);
    return;
  }

  if (url.pathname === "/admin/online" && request.method === "GET") {
    sendAdminOnlinePlayers(response, url);
    return;
  }

  if (url.pathname === "/admin/broadcast" && request.method === "POST") {
    await handleAdminBroadcast(request, response, url);
    return;
  }

  if (url.pathname === "/admin/announcements" && request.method === "GET") {
    sendAdminAnnouncements(response, url);
    return;
  }

  if (url.pathname === "/admin/announcements.csv" && request.method === "GET") {
    sendAdminAnnouncementsCsv(response, url);
    return;
  }

  if (url.pathname === "/admin/chat-logs" && request.method === "GET") {
    sendAdminChatLogs(response, url);
    return;
  }

  if (url.pathname === "/admin/chat-logs.csv" && request.method === "GET") {
    sendAdminChatLogsCsv(response, url);
    return;
  }

  if (url.pathname === "/admin/action-logs" && request.method === "GET") {
    sendAdminActionLogs(response, url);
    return;
  }

  if (url.pathname === "/admin/action-logs.csv" && request.method === "GET") {
    sendAdminActionLogsCsv(response, url);
    return;
  }

  if (url.pathname === "/admin/feedback" && request.method === "GET") {
    sendAdminFeedback(response, url);
    return;
  }

  if (url.pathname === "/admin/feedback.csv" && request.method === "GET") {
    sendAdminFeedbackCsv(response, url);
    return;
  }

  if (url.pathname === "/admin/feedback/status" && request.method === "POST") {
    await handleAdminFeedbackStatus(request, response, url);
    return;
  }

  if (url.pathname === "/admin/classroom" && request.method === "GET") {
    sendAdminClassroomState(response, url);
    return;
  }

  if (url.pathname === "/admin/classroom" && request.method === "POST") {
    await handleAdminClassroomState(request, response, url);
    return;
  }

  if (url.pathname === "/admin/mute" && request.method === "POST") {
    await handleAdminMute(request, response, url);
    return;
  }

  if (url.pathname === "/admin/kick" && request.method === "POST") {
    await handleAdminKick(request, response, url);
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

async function handleGoogleAuth(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody(request);
    const credential = body.credential;
    if (typeof credential !== "string" || credential.length < 20) {
      sendJson(response, 400, { error: "missing_google_credential" });
      return;
    }

    const profile = await googleAuth.verifyCredential(credential);
    const account = upsertGoogleAccount(profile);
    const fallbackSlot = `account-${account.accountId.slice(5, 13)}`;
    const requestedSlot = typeof body.saveSlot === "string" ? body.saveSlot : getFirstSaveSlotForAccount(account.accountId);
    const saveSlot = normalizeSaveSlot(requestedSlot, fallbackSlot);
    const characterName = typeof body.characterName === "string" ? normalizePlayerName(body.characterName) : undefined;
    bindAccountSaveSlot(account.accountId, saveSlot, characterName);
    const session = createAuthSession(account.accountId);
    const saveSlots = listSaveSlotsForAccount(account.accountId);

    sendJson(response, 200, {
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      saveSlot,
      account: {
        email: account.email,
        hostedDomain: account.hostedDomain,
        displayName: account.displayName
      },
      saveSlots
    });
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      const statusCode =
        error.code === "not_configured" ? 503 : error.code === "hosted_domain_not_allowed" ? 403 : 401;
      sendJson(response, statusCode, { error: error.code });
      return;
    }

    const message = error instanceof Error ? error.message : "unknown_error";
    sendJson(response, message === "body_too_large" ? 413 : 400, { error: "invalid_request" });
  }
}

function getSessionSummary(sessionId: string | null | undefined) {
  const session = getAuthSession(sessionId);
  if (!session) {
    return undefined;
  }

  const account = getAccountById(session.accountId);
  if (!account) {
    return undefined;
  }

  return {
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
    account,
    saveSlots: listSaveSlotsForAccount(session.accountId)
  };
}

function sendAuthSessionSummary(response: ServerResponse, sessionId: string | null | undefined) {
  const summary = getSessionSummary(sessionId);
  if (!summary) {
    sendJson(response, 401, { active: false, error: "invalid_session" });
    return;
  }

  sendJson(response, 200, {
    active: true,
    ...summary
  });
}

function sendAccountSaveSlots(response: ServerResponse, sessionId: string | null | undefined) {
  const summary = getSessionSummary(sessionId);
  if (!summary) {
    sendJson(response, 401, { error: "invalid_session", saveSlots: [] });
    return;
  }

  sendJson(response, 200, {
    saveSlots: summary.saveSlots
  });
}

async function handleLogout(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody(request);
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;
    revokeAuthSession(sessionId);
    sendJson(response, 200, { ok: true });
  } catch {
    sendJson(response, 400, { error: "invalid_request" });
  }
}

function sendAdminSummary(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  sendJson(response, 200, {
    ...getAdminSummary(),
    betaFeedback: createBetaFeedbackSummary()
  });
}

function createBetaFeedbackSummary() {
  const feedback = listAdminTestFeedback(1000);
  const openItems = feedback.filter((entry) => entry.status === "open" || entry.status === "reviewing");
  const averageDifficulty =
    feedback.length > 0
      ? Number((feedback.reduce((sum, entry) => sum + entry.difficulty, 0) / feedback.length).toFixed(2))
      : 0;

  return {
    total: feedback.length,
    open: openItems.length,
    averageDifficulty,
    byClassGroup: countFeedbackBy(feedback, (entry) => entry.classGroup || "未填班級"),
    byMap: countFeedbackBy(feedback, (entry) => entry.mapId || "unknown"),
    byCategory: countFeedbackBy(feedback, (entry) => entry.feedbackCategory || "other"),
    recentOpen: openItems.slice(0, 5).map((entry) => ({
      id: entry.id,
      testerName: entry.testerName,
      classGroup: entry.classGroup,
      mapId: entry.mapId,
      category: entry.feedbackCategory,
      difficulty: entry.difficulty,
      stuckPoint: entry.stuckPoint,
      submittedAt: entry.submittedAt
    }))
  };
}

function countFeedbackBy(feedback: ReturnType<typeof listAdminTestFeedback>, getKey: (entry: ReturnType<typeof listAdminTestFeedback>[number]) => string) {
  const counts = new Map<string, number>();
  for (const entry of feedback) {
    const key = getKey(entry);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, 12);
}

function getBackupFiles() {
  if (!existsSync(backupDirectory)) {
    return [];
  }

  return readdirSync(backupDirectory)
    .filter((fileName) => fileName.endsWith(".sqlite"))
    .map((fileName) => {
      const filePath = join(backupDirectory, fileName);
      const stats = statSync(filePath);
      return {
        fileName: basename(fileName),
        sizeBytes: stats.size,
        createdAt: stats.mtimeMs
      };
    })
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, 20);
}

function createSqliteBackup() {
  const databasePath = getDatabasePath();
  if (!existsSync(databasePath)) {
    throw new Error("database_not_found");
  }

  mkdirSync(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `penglai-${timestamp}.sqlite`;
  const filePath = join(backupDirectory, fileName);
  copyFileSync(databasePath, filePath);

  const stats = statSync(filePath);
  return {
    fileName,
    sizeBytes: stats.size,
    createdAt: stats.mtimeMs
  };
}

function sendAdminSystem(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const memory = process.memoryUsage();
  sendJson(response, 200, {
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal
    },
    databasePath: getDatabasePath(),
    backupDirectory,
    onlinePlayers: sockets.size,
    chatLocked: classroomChatLocked,
    mutedPlayers: mutedPlayers.size,
    adminApiConfigured: Boolean(adminToken),
    googleAuthConfigured: googleAuth.isConfigured,
    googleClientConfigured: Boolean(googleClientId),
    googleHostedDomain: allowedGoogleHostedDomain,
    authCorsOrigin
  });
}

function sendAdminBackups(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  sendJson(response, 200, {
    backupDirectory,
    backups: getBackupFiles()
  });
}

function handleAdminCreateBackup(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  try {
    const backup = createSqliteBackup();
    logAdminAction({
      action: "database_backup",
      details: JSON.stringify(backup)
    });
    sendJson(response, 200, {
      ok: true,
      backup,
      backups: getBackupFiles()
    });
  } catch {
    sendJson(response, 500, { error: "backup_failed" });
  }
}

function sendAdminSaveAudit(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  sendJson(response, 200, getAdminSaveAudit());
}

function sendAdminTestDataReport(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  sendJson(response, 200, {
    report: getTestDataReport(),
    cleanup: {
      endpoint: "/admin/test-data/cleanup",
      dryRunDefault: true,
      requiredConfirmText: "DELETE_SMOKE_TEST_DATA"
    }
  });
}

async function handleAdminTestDataCleanup(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const dryRun = body.dryRun !== false;
    const confirmText = typeof body.confirmText === "string" ? body.confirmText : "";
    if (!dryRun && confirmText !== "DELETE_SMOKE_TEST_DATA") {
      sendJson(response, 400, { error: "confirmation_required", requiredConfirmText: "DELETE_SMOKE_TEST_DATA" });
      return;
    }

    const backup = dryRun ? undefined : createSqliteBackup();
    const result = cleanupSmokeTestData(dryRun);
    if (!dryRun) {
      logAdminAction({
        action: "cleanup_smoke_test_data",
        details: JSON.stringify({ backup, deleted: result.deleted })
      });
    }

    sendJson(response, 200, {
      ok: true,
      backup,
      ...result
    });
  } catch {
    sendJson(response, 400, { error: "invalid_cleanup_request" });
  }
}

function sendAdminCharacters(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const limit = Number.parseInt(url.searchParams.get("limit") ?? "200", 10);
  sendJson(response, 200, {
    characters: listAdminCharacters(Number.isFinite(limit) ? limit : 200)
  });
}

function sendAdminCharactersCsv(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const characters = listAdminCharacters(1000);
  const lines = [
    ["save_slot", "character_name", "class_name", "level", "gold", "account_email", "hosted_domain", "updated_at"].map(
      csvCell
    ).join(","),
    ...characters.map((character) =>
      [
        character.saveSlot,
        character.characterName,
        character.className,
        character.level,
        character.gold,
        character.accountEmail,
        character.hostedDomain,
        new Date(character.updatedAt).toISOString()
      ]
        .map(csvCell)
        .join(",")
    )
  ];

  response.setHeader("Content-Disposition", 'attachment; filename="penglai-characters.csv"');
  sendText(response, 200, "text/csv; charset=utf-8", `${lines.join("\n")}\n`);
}

function sendAdminOnlinePlayers(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  sendJson(response, 200, {
    onlinePlayers: [...players.values()].map((player) => ({
      playerId: player.id,
      name: player.name,
      className: player.className,
      level: player.level,
      hp: player.hp,
      maxHp: player.maxHp,
      saveSlot: playerSaveSlots.get(player.id),
      authenticated: playerAccountIds.has(player.id),
      muted: mutedPlayers.has(player.id),
      updatedAt: player.updatedAt
    }))
  });
}

async function handleAdminBroadcast(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const text = normalizeAdminText(body.text);
    if (!text) {
      sendJson(response, 400, { error: "empty_broadcast" });
      return;
    }

    const sentAt = Date.now();
    const category = normalizeAnnouncementCategory(body.category);
    const expiresAt = normalizeAnnouncementExpiresAt(body.ttlMinutes ?? body.expiresInMinutes);
    broadcast({ type: "admin:notice", text, sentAt, category, expiresAt });
    const announcement = saveAdminAnnouncement({
      text,
      audience: "all",
      category,
      deliveredCount: sockets.size,
      createdAt: sentAt,
      expiresAt
    });
    logAdminAction({
      action: "broadcast",
      details: JSON.stringify({ announcementId: announcement.id, text, category, expiresAt, delivered: sockets.size }),
      createdAt: sentAt
    });
    sendJson(response, 200, { ok: true, delivered: sockets.size, sentAt, announcement });
  } catch {
    sendJson(response, 400, { error: "invalid_request" });
  }
}

function sendAdminAnnouncements(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  sendJson(response, 200, {
    announcements: listAdminAnnouncements(Number.isFinite(limit) ? limit : 50)
  });
}

function sendAdminAnnouncementsCsv(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const announcements = listAdminAnnouncements(200);
  const lines = [
    ["id", "text", "audience", "category", "delivered_count", "created_at", "expires_at"].map(csvCell).join(","),
    ...announcements.map((announcement) =>
      [
        announcement.id,
        announcement.text,
        announcement.audience,
        announcement.category,
        announcement.deliveredCount,
        new Date(announcement.createdAt).toISOString(),
        announcement.expiresAt ? new Date(announcement.expiresAt).toISOString() : ""
      ]
        .map(csvCell)
        .join(",")
    )
  ];

  response.setHeader("Content-Disposition", 'attachment; filename="penglai-announcements.csv"');
  sendText(response, 200, "text/csv; charset=utf-8", `${lines.join("\n")}\n`);
}

function sendAdminChatLogs(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const limit = Number.parseInt(url.searchParams.get("limit") ?? "200", 10);
  sendJson(response, 200, {
    chatLogs: listAdminChatLogs(Number.isFinite(limit) ? limit : 200)
  });
}

function sendAdminChatLogsCsv(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const logs = listAdminChatLogs(1000);
  const lines = [
    ["player_id", "save_slot", "player_name", "account_email", "text", "sent_at"].map(csvCell).join(","),
    ...logs.map((log) =>
      [log.playerId, log.saveSlot, log.playerName, log.accountEmail, log.text, new Date(log.sentAt).toISOString()]
        .map(csvCell)
        .join(",")
    )
  ];

  response.setHeader("Content-Disposition", 'attachment; filename="penglai-chat-logs.csv"');
  sendText(response, 200, "text/csv; charset=utf-8", `${lines.join("\n")}\n`);
}

function sendAdminActionLogs(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const limit = Number.parseInt(url.searchParams.get("limit") ?? "200", 10);
  sendJson(response, 200, {
    actionLogs: listAdminActionLogs(Number.isFinite(limit) ? limit : 200)
  });
}

function sendAdminActionLogsCsv(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const logs = listAdminActionLogs(1000);
  const lines = [
    ["id", "action", "target_player_id", "target_player_name", "details", "created_at"].map(csvCell).join(","),
    ...logs.map((log) =>
      [log.id, log.action, log.targetPlayerId, log.targetPlayerName, log.details, new Date(log.createdAt).toISOString()]
        .map(csvCell)
        .join(",")
    )
  ];

  response.setHeader("Content-Disposition", 'attachment; filename="penglai-admin-actions.csv"');
  sendText(response, 200, "text/csv; charset=utf-8", `${lines.join("\n")}\n`);
}

async function handleFeedbackSubmit(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody(request);
    const testerName = normalizeFeedbackText(body.testerName, 40);
    const schoolName = normalizeFeedbackText(body.schoolName, 60);
    const classGroup = normalizeFeedbackText(body.classGroup, 40);
    const stuckPoint = normalizeFeedbackText(body.stuckPoint, 160);
    const suggestion = normalizeFeedbackText(body.suggestion, 360);
    if (!testerName || !classGroup || !stuckPoint || !suggestion) {
      sendJson(response, 400, { error: "missing_feedback_fields" });
      return;
    }

    const session = getAuthSession(typeof body.sessionId === "string" ? body.sessionId : undefined);
    const saved = saveTestFeedback({
      testerName,
      schoolName,
      classGroup,
      playerName: normalizeFeedbackText(body.playerName, 40) || "未命名角色",
      saveSlot: normalizeSaveSlot(typeof body.saveSlot === "string" ? body.saveSlot : undefined, "feedback-guest"),
      accountId: session?.accountId,
      mapId: normalizeFeedbackText(body.mapId, 40) || DEFAULT_GAME_MAP.id,
      currentZone: normalizeFeedbackText(body.currentZone, 60),
      activeQuest: normalizeFeedbackText(body.activeQuest, 80),
      chapterProgress: normalizeFeedbackText(body.chapterProgress, 120) || "未提供",
      feedbackCategory: normalizeFeedbackCategory(body.feedbackCategory),
      deviceType: normalizeDeviceType(body.deviceType),
      difficulty: normalizeDifficulty(body.difficulty),
      stuckPoint,
      suggestion,
      contactAllowed: normalizeBoolean(body.contactAllowed),
      userAgent: normalizeFeedbackText(request.headers["user-agent"], 220)
    });
    sendJson(response, 200, { ok: true, id: saved.id, submittedAt: saved.submittedAt });
  } catch {
    sendJson(response, 400, { error: "invalid_feedback" });
  }
}

function sendAdminFeedback(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const limit = Number.parseInt(url.searchParams.get("limit") ?? "200", 10);
  sendJson(response, 200, {
    feedback: listAdminTestFeedback(Number.isFinite(limit) ? limit : 200)
  });
}

function sendAdminFeedbackCsv(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  const feedback = listAdminTestFeedback(1000);
  const lines = [
    [
      "id",
      "tester_name",
      "school_name",
      "class_group",
      "player_name",
      "save_slot",
      "account_email",
      "map_id",
      "current_zone",
      "active_quest",
      "chapter_progress",
      "feedback_category",
      "device_type",
      "difficulty",
      "stuck_point",
      "suggestion",
      "contact_allowed",
      "status",
      "admin_note",
      "submitted_at",
      "updated_at"
    ]
      .map(csvCell)
      .join(","),
    ...feedback.map((entry) =>
      [
        entry.id,
        entry.testerName,
        entry.schoolName,
        entry.classGroup,
        entry.playerName,
        entry.saveSlot,
        entry.accountEmail,
        entry.mapId,
        entry.currentZone,
        entry.activeQuest,
        entry.chapterProgress,
        entry.feedbackCategory,
        entry.deviceType,
        entry.difficulty,
        entry.stuckPoint,
        entry.suggestion,
        entry.contactAllowed ? "yes" : "no",
        entry.status,
        entry.adminNote,
        new Date(entry.submittedAt).toISOString(),
        new Date(entry.updatedAt).toISOString()
      ]
        .map(csvCell)
        .join(",")
    )
  ];

  response.setHeader("Content-Disposition", 'attachment; filename="penglai-test-feedback.csv"');
  sendText(response, 200, "text/csv; charset=utf-8", `${lines.join("\n")}\n`);
}

async function handleAdminFeedbackStatus(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const id = typeof body.id === "number" ? body.id : Number.parseInt(typeof body.id === "string" ? body.id : "", 10);
    if (!Number.isFinite(id) || id <= 0) {
      sendJson(response, 400, { error: "invalid_feedback_id" });
      return;
    }

    const status = normalizeFeedbackStatus(body.status);
    const adminNote = normalizeFeedbackText(body.adminNote, 240);
    const result = updateTestFeedbackStatus(Math.trunc(id), status, adminNote);
    if (!result.changed) {
      sendJson(response, 404, { error: "feedback_not_found" });
      return;
    }

    logAdminAction({
      action: "feedback_status_update",
      details: JSON.stringify({ id: Math.trunc(id), status, adminNote })
    });
    sendJson(response, 200, { ok: true, id: Math.trunc(id), status, adminNote, updatedAt: result.updatedAt });
  } catch {
    sendJson(response, 400, { error: "invalid_request" });
  }
}

function getClassroomState() {
  return {
    chatLocked: classroomChatLocked,
    chatLockMessage: classroomChatLockMessage,
    mutedPlayers: [...mutedPlayers.entries()].map(([playerId, mute]) => ({
      playerId,
      playerName: players.get(playerId)?.name ?? playerId,
      reason: mute.reason,
      mutedAt: mute.mutedAt
    }))
  };
}

function sendAdminClassroomState(response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  sendJson(response, 200, getClassroomState());
}

async function handleAdminClassroomState(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  try {
    const body = await readJsonBody(request);
    if (typeof body.chatLocked === "boolean") {
      classroomChatLocked = body.chatLocked;
    }
    const nextMessage = normalizeAdminText(body.chatLockMessage);
    if (nextMessage) {
      classroomChatLockMessage = nextMessage;
    }
    logAdminAction({
      action: classroomChatLocked ? "classroom_chat_lock" : "classroom_chat_unlock",
      details: JSON.stringify({ chatLocked: classroomChatLocked, chatLockMessage: classroomChatLockMessage })
    });
    sendJson(response, 200, getClassroomState());
  } catch {
    sendJson(response, 400, { error: "invalid_request" });
  }
}

async function handleAdminMute(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    if (!sockets.has(playerId)) {
      sendJson(response, 404, { error: "player_not_online" });
      return;
    }

    const muted = body.muted !== false;
    const reason = normalizeAdminText(body.reason) || "教師已限制你的聊天。";
    const targetPlayerName = players.get(playerId)?.name ?? playerId;
    if (muted) {
      mutedPlayers.set(playerId, { reason, mutedAt: Date.now() });
      send(sockets.get(playerId)!, { type: "chat:notice", playerId, text: reason });
    } else {
      mutedPlayers.delete(playerId);
      send(sockets.get(playerId)!, { type: "chat:notice", playerId, text: "教師已解除你的聊天限制。" });
    }
    logAdminAction({
      action: muted ? "mute_player" : "unmute_player",
      targetPlayerId: playerId,
      targetPlayerName,
      details: JSON.stringify({ reason })
    });

    sendJson(response, 200, { ok: true, muted, classroom: getClassroomState() });
  } catch {
    sendJson(response, 400, { error: "invalid_request" });
  }
}

async function handleAdminKick(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (!isAdminRequest(url)) {
    rejectAdminRequest(response);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    const ws = sockets.get(playerId);
    if (!ws) {
      sendJson(response, 404, { error: "player_not_online" });
      return;
    }

    const reason = normalizeAdminText(body.reason) || "教師已將你移出遊戲，請稍後再重新進入。";
    const targetPlayerName = players.get(playerId)?.name ?? playerId;
    send(ws, { type: "admin:notice", text: reason, sentAt: Date.now() });
    logAdminAction({
      action: "kick_player",
      targetPlayerId: playerId,
      targetPlayerName,
      details: JSON.stringify({ reason })
    });
    setTimeout(() => ws.close(1000, "admin_kick"), 350);
    sendJson(response, 200, { ok: true });
  } catch {
    sendJson(response, 400, { error: "invalid_request" });
  }
}

function getEquipment(playerId: string) {
  const equipment = playerEquipment.get(playerId);
  if (equipment) {
    return equipment;
  }

  const initialEquipment = createInitialEquipment();
  playerEquipment.set(playerId, initialEquipment);
  return initialEquipment;
}

function getAttackBonus(playerId: string) {
  const equipment = getEquipment(playerId);
  return Object.values(equipment).reduce((total, itemId) => {
    if (!itemId) {
      return total;
    }

    return total + (ITEM_DEFINITIONS[itemId].attackBonus ?? 0);
  }, 0);
}

function getDefenseBonus(playerId: string) {
  const equipment = getEquipment(playerId);
  return Object.values(equipment).reduce((total, itemId) => {
    if (!itemId) {
      return total;
    }

    return total + (ITEM_DEFINITIONS[itemId].defenseBonus ?? 0);
  }, 0);
}

function getAttack(playerId: string, className?: CharacterClass) {
  return baseAttack + getClassConfig(className ?? players.get(playerId)?.className ?? "swordsman").attackBonus + getAttackBonus(playerId);
}

function getDefense(playerId: string, className?: CharacterClass) {
  return baseDefense + getClassConfig(className ?? players.get(playerId)?.className ?? "swordsman").defenseBonus + getDefenseBonus(playerId);
}

function syncPlayerStats(playerId: string) {
  const player = players.get(playerId);
  if (!player) {
    return;
  }

  players.set(playerId, {
    ...player,
    hp: Math.min(player.hp, getMaxHp(playerId)),
    maxHp: getMaxHp(playerId),
    mp: Math.min(player.mp, getMaxMp(playerId)),
    maxMp: getMaxMp(playerId),
    attack: getAttack(playerId),
    defense: getDefense(playerId),
    updatedAt: Date.now()
  });
}

function savePlayerGame(playerId: string) {
  const saveSlot = playerSaveSlots.get(playerId);
  const player = players.get(playerId);
  if (!saveSlot || !player) {
    return;
  }

  saveGame(saveSlot, {
    player,
    inventory: getInventorySlots(playerId),
    equipment: getEquipment(playerId),
    quests: [...(playerQuests.get(playerId)?.values() ?? [])]
  });
}

function send(ws: WebSocket, message: ServerMessage) {
  ws.send(JSON.stringify(message));
}

function sendToPlayer(playerId: string, message: ServerMessage) {
  const ws = sockets.get(playerId);
  if (ws?.readyState === WebSocket.OPEN) {
    send(ws, message);
  }
}

function broadcast(message: ServerMessage) {
  const data = JSON.stringify(message);
  for (const ws of sockets.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function getAllMonsterSpawns() {
  return Object.values(GAME_MAPS).flatMap((map) => map.monsterSpawns);
}

function getMonsterSpawn(monsterId: string) {
  return getAllMonsterSpawns().find((spawn) => spawn.id === monsterId);
}

function getPlayerMap(player: PlayerSnapshot | undefined) {
  return getGameMap(player?.mapId);
}

function getMapPlayers(mapId: MapId) {
  return [...players.values()].filter((player) => player.mapId === mapId);
}

function getMapMonsters(mapId: MapId) {
  return [...monsters.values()].filter((monster) => monster.mapId === mapId);
}

function getMapItemDrops(mapId: MapId) {
  return [...itemDrops.values()].filter((drop) => drop.mapId === mapId);
}

function sendWorldSnapshot(playerId: string) {
  const player = players.get(playerId);
  if (!player) {
    return;
  }

  sendToPlayer(playerId, {
    type: "world:snapshot",
    mapId: player.mapId,
    players: getMapPlayers(player.mapId),
    monsters: getMapMonsters(player.mapId),
    itemDrops: getMapItemDrops(player.mapId)
  });
}

function broadcastWorldSnapshots() {
  for (const playerId of sockets.keys()) {
    sendWorldSnapshot(playerId);
  }
}

function snapshot() {
  tickMonsterRespawns();
  broadcastWorldSnapshots();
}

function tickMonsterRespawns() {
  const now = Date.now();
  for (const spawn of getAllMonsterSpawns()) {
    const dueAt = respawnAt.get(spawn.id);
    if (!dueAt || dueAt > now) {
      continue;
    }

    monsters.set(spawn.id, {
      id: spawn.id,
      kind: spawn.kind,
      mapId: spawn.mapId,
      name: spawn.name,
      x: spawn.x,
      y: spawn.y,
      hp: spawn.maxHp,
      maxHp: spawn.maxHp,
      alive: true,
      facing: "left",
      hitAt: 0,
      updatedAt: now
    });
    respawnAt.delete(spawn.id);
  }
}

function tickWorld() {
  const now = Date.now();
  const dt = Math.min((now - lastWorldTickAt) / 1000, 0.1);
  lastWorldTickAt = now;

  tickMonsterRespawns();
  tickMonsterPatrols(now, dt);
  tickPlayerMp(now, dt);
  tickPlayerRespawns(now);
  tickPlayerHazards(now);
  tickItemDrops(now);
  broadcastWorldSnapshots();
}

function tickPlayerMp(now: number, dt: number) {
  for (const player of players.values()) {
    if (player.hp <= 0 || player.mp >= player.maxMp) {
      continue;
    }

    const config = getClassConfig(player.className);
    players.set(player.id, {
      ...player,
      mp: Math.min(player.maxMp, Number((player.mp + config.mpRegenPerSecond * dt).toFixed(2))),
      updatedAt: now
    });
  }
}

function tickItemDrops(now: number) {
  for (const [dropId, drop] of itemDrops) {
    if (now - drop.createdAt > itemDropLifetimeMs) {
      itemDrops.delete(dropId);
    }
  }
}

function tickMonsterPatrols(now: number, dt: number) {
  for (const spawn of getAllMonsterSpawns()) {
    const monster = monsters.get(spawn.id);
    if (!monster?.alive) {
      continue;
    }

    const direction = monster.facing === "right" ? 1 : -1;
    let nextX = monster.x + direction * spawn.patrolSpeed * dt;
    let nextFacing = monster.facing;

    if (nextX <= spawn.patrolMinX) {
      nextX = spawn.patrolMinX;
      nextFacing = "right";
    } else if (nextX >= spawn.patrolMaxX) {
      nextX = spawn.patrolMaxX;
      nextFacing = "left";
    }

    monsters.set(spawn.id, {
      ...monster,
      x: nextX,
      facing: nextFacing,
      updatedAt: now
    });
  }
}

function tickPlayerRespawns(now: number) {
  for (const [playerId, dueAt] of playerRespawnAt) {
    if (dueAt > now) {
      continue;
    }

    const player = players.get(playerId);
    if (!player) {
      playerRespawnAt.delete(playerId);
      continue;
    }

    players.set(playerId, {
      ...player,
      x: getPlayerMap(player).playerSpawn.x,
      y: getPlayerMap(player).playerSpawn.y,
      hp: player.maxHp,
      mp: player.maxMp,
      animation: "idle",
      updatedAt: now
    });
    playerRespawnAt.delete(playerId);
    playerDamageCooldownUntil.set(playerId, now + playerRespawnInvulnerableMs);
    playerInvulnerableUntil.set(playerId, now + playerRespawnInvulnerableMs);

    broadcast({
      type: "player:respawn",
      playerId,
      mapId: player.mapId,
      x: getPlayerMap(player).playerSpawn.x,
      y: getPlayerMap(player).playerSpawn.y
    });
  }
}

function tickPlayerHazards(now: number) {
  for (const player of players.values()) {
    if (player.hp <= 0 || isInSafeZone(player)) {
      continue;
    }

    if ((playerDamageCooldownUntil.get(player.id) ?? 0) > now || (playerInvulnerableUntil.get(player.id) ?? 0) > now) {
      continue;
    }

    const touchingMonster = [...monsters.values()].find((monster) => {
      if (!monster.alive || monster.mapId !== player.mapId) {
        return false;
      }

      return Math.abs(monster.x - player.x) <= 30 && Math.abs(monster.y - player.y) <= 38;
    });

    if (!touchingMonster) {
      continue;
    }

    damagePlayer(player.id, contactDamage, now);
  }
}

function isInSafeZone(player: PlayerSnapshot) {
  return getPlayerMap(player).safeZones.some((zone) => {
    const left = zone.x - zone.width / 2;
    const right = zone.x + zone.width / 2;
    const top = zone.y - zone.height / 2;
    const bottom = zone.y + zone.height / 2;

    return player.x >= left && player.x <= right && player.y >= top && player.y <= bottom;
  });
}

function damagePlayer(playerId: string, rawDamage: number, now: number) {
  const player = players.get(playerId);
  if (!player || player.hp <= 0) {
    return;
  }

  const damage = Math.max(1, rawDamage - getDefense(playerId));
  const nextHp = Math.max(0, player.hp - damage);
  const defeated = nextHp === 0;
  players.set(playerId, {
    ...player,
    hp: nextHp,
    animation: defeated ? "idle" : player.animation,
    updatedAt: now
  });
  playerDamageCooldownUntil.set(playerId, now + contactDamageCooldownMs);

  if (defeated) {
    playerRespawnAt.set(playerId, now + playerRespawnDelayMs);
  }

  broadcast({
    type: "player:damaged",
    playerId,
    damage,
    hp: nextHp,
    defeated
  });
}

function awardExp(playerId: string, expReward: number) {
  const player = players.get(playerId);
  if (!player || expReward <= 0) {
    return {
      level: player?.level ?? 1,
      leveledUp: false
    };
  }

  let level = player.level;
  let exp = player.exp + expReward;
  let expToNext = player.expToNext;
  let leveledUp = false;

  while (exp >= expToNext) {
    exp -= expToNext;
    level += 1;
    expToNext = getExpToNext(level);
    leveledUp = true;
  }

  players.set(playerId, {
    ...player,
    level,
    exp,
    expToNext,
    hp: leveledUp ? player.maxHp : player.hp,
    mp: leveledUp ? player.maxMp : player.mp,
    updatedAt: Date.now()
  });

  if (leveledUp) {
    broadcast({
      type: "player:level-up",
      playerId,
      level
    });
  }

  return {
    level,
    leveledUp
  };
}

function addGold(playerId: string, amount: number) {
  const player = players.get(playerId);
  if (!player || amount <= 0) {
    return;
  }

  players.set(playerId, {
    ...player,
    gold: player.gold + amount,
    updatedAt: Date.now()
  });
}

function getInventorySlots(playerId: string): InventorySlot[] {
  const inventory = inventories.get(playerId);
  if (!inventory) {
    return [];
  }

  return [...inventory.entries()]
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => ({
      itemId,
      name: ITEM_DEFINITIONS[itemId].name,
      quantity
    }));
}

function sendInventory(playerId: string) {
  sendToPlayer(playerId, {
    type: "inventory:update",
    playerId,
    slots: getInventorySlots(playerId)
  });
}

function sendEquipment(playerId: string) {
  sendToPlayer(playerId, {
    type: "equipment:update",
    playerId,
    equipment: getEquipment(playerId),
    attack: getAttack(playerId),
    defense: getDefense(playerId)
  });
}

function sendItemNotice(playerId: string, text: string, itemId?: ItemId, quantity?: number, healed?: number) {
  sendToPlayer(playerId, {
    type: "item:notice",
    playerId,
    text,
    itemId,
    quantity,
    healed
  });
}

function sendShopOpen(playerId: string, shop: ShopDefinition) {
  sendToPlayer(playerId, {
    type: "shop:open",
    playerId,
    npcId: shop.npcId,
    shop
  });
}

function sendShopNotice(playerId: string, text: string, itemId?: ItemId, quantity?: number, priceGold?: number) {
  sendToPlayer(playerId, {
    type: "shop:notice",
    playerId,
    text,
    itemId,
    quantity,
    priceGold
  });
}

function sendSkillNotice(
  playerId: string,
  skillId: SkillId,
  text: string,
  mp: number,
  cooldownRemainingMs?: number
) {
  sendToPlayer(playerId, {
    type: "skill:notice",
    playerId,
    skillId,
    text,
    mp,
    cooldownRemainingMs
  });
}

function sendCombatMiss(playerId: string, isSkill: boolean, skillId?: SkillId) {
  sendToPlayer(playerId, {
    type: "combat:miss",
    playerId,
    isSkill,
    skillId
  });
}

function addInventoryItem(playerId: string, itemId: ItemId, quantity: number) {
  if (quantity <= 0) {
    return;
  }

  const inventory = inventories.get(playerId);
  if (!inventory) {
    return;
  }

  inventory.set(itemId, (inventory.get(itemId) ?? 0) + quantity);
  sendInventory(playerId);
}

function createItemDrop(itemId: ItemId, quantity: number, mapId: MapId, x: number, y: number) {
  const item = ITEM_DEFINITIONS[itemId];
  const dropId = `${itemId}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  itemDrops.set(dropId, {
    id: dropId,
    itemId,
    mapId,
    name: item.name,
    quantity,
    x,
    y,
    createdAt: Date.now()
  });
}

function createEquipmentDrops(mapId: MapId, x: number, y: number) {
  for (const [itemId, chance] of Object.entries(equipmentDropChances) as [ItemId, number][]) {
    const restrictedMapId = equipmentDropMapRestrictions[itemId];
    if (restrictedMapId && mapId !== restrictedMapId) {
      continue;
    }

    const adjustedChance = Math.min(1, chance * equipmentDropChanceMultiplier);
    if (Math.random() <= adjustedChance) {
      const offsetX =
        itemId === "training-sword" ||
        itemId === "harbor-dagger" ||
        itemId === "reef-blade" ||
        itemId === "archive-wand" ||
        itemId === "star-sabre"
          ? -28
          : 56;
      createItemDrop(itemId, 1, mapId, x + offsetX, y);
    }
  }
}

function createMonsterDrops(monster: MonsterSnapshot) {
  createItemDrop("small-hp-potion", 1, monster.mapId, monster.x, monster.y);
  if ((monster.kind === "mist-puppet" || monster.kind === "warehouse-sentry") && Math.random() <= 0.35) {
    createItemDrop("medium-hp-potion", 1, monster.mapId, monster.x - 34, monster.y);
  }

  if (monster.kind === "field-rat") {
    createItemDrop("rat-tail", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "mist-slime") {
    createItemDrop("mist-gel", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "tide-watcher") {
    createItemDrop("watcher-shell", 1, monster.mapId, monster.x + 32, monster.y);
  }

  if (monster.kind === "warehouse-rat") {
    createItemDrop("warehouse-cloth", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "mist-puppet") {
    createItemDrop("damp-wood", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "warehouse-sentry") {
    createItemDrop("damp-wood", 2, monster.mapId, monster.x + 32, monster.y);
    createItemDrop("warehouse-cloth", 1, monster.mapId, monster.x - 28, monster.y);
  }

  if (monster.kind === "cave-crab") {
    createItemDrop("crab-shell", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "reef-wisp") {
    createItemDrop("reef-spark", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "coral-warden") {
    createItemDrop("coral-key", 1, monster.mapId, monster.x + 32, monster.y);
    createItemDrop("reef-spark", 1, monster.mapId, monster.x - 28, monster.y);
    createItemDrop("medium-hp-potion", 1, monster.mapId, monster.x + 68, monster.y);
  }

  if (monster.kind === "archive-drifter") {
    createItemDrop("salted-page", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "ink-sprite") {
    createItemDrop("ink-core", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "archive-guardian") {
    createItemDrop("archive-seal", 1, monster.mapId, monster.x + 32, monster.y);
    createItemDrop("ink-core", 1, monster.mapId, monster.x - 28, monster.y);
    createItemDrop("medium-hp-potion", 1, monster.mapId, monster.x + 68, monster.y);
  }

  if (monster.kind === "star-moth") {
    createItemDrop("star-dust", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "lens-sentinel") {
    createItemDrop("lens-core", 1, monster.mapId, monster.x + 28, monster.y);
  }

  if (monster.kind === "astral-keeper") {
    createItemDrop("astral-seal", 1, monster.mapId, monster.x + 32, monster.y);
    createItemDrop("lens-core", 1, monster.mapId, monster.x - 28, monster.y);
    createItemDrop("medium-hp-potion", 1, monster.mapId, monster.x + 68, monster.y);
  }

  createEquipmentDrops(monster.mapId, monster.x, monster.y);
}

function handleItemPickup(playerId: string, dropId: string) {
  const player = players.get(playerId);
  const drop = itemDrops.get(dropId);
  if (!player || player.hp <= 0 || !drop || player.mapId !== drop.mapId) {
    return;
  }

  const inRange = Math.abs(player.x - drop.x) <= itemPickupRange && Math.abs(player.y - drop.y) <= itemPickupRange;
  if (!inRange) {
    return;
  }

  itemDrops.delete(dropId);
  addInventoryItem(playerId, drop.itemId, drop.quantity);
  progressCollectQuests(playerId, drop.itemId);
  sendItemNotice(playerId, `拾取 ${drop.name} x${drop.quantity}。`, drop.itemId, drop.quantity);
  savePlayerGame(playerId);
  snapshot();
}

function handleUseItem(playerId: string, itemId: ItemId) {
  const player = players.get(playerId);
  const inventory = inventories.get(playerId);
  const item = ITEM_DEFINITIONS[itemId];
  const quantity = inventory?.get(itemId) ?? 0;

  if (!player || player.hp <= 0 || !inventory) {
    return;
  }

  if (quantity <= 0) {
    sendItemNotice(playerId, `你沒有 ${item.name}。`, itemId, 0);
    return;
  }

  if (item.kind !== "consumable" || !item.healHp) {
    sendItemNotice(playerId, `${item.name} 不能直接使用。`, itemId, quantity, 0);
    return;
  }

  if (player.hp >= player.maxHp) {
    sendItemNotice(playerId, "生命已經全滿。", itemId, quantity, 0);
    return;
  }

  const nextHp = Math.min(player.maxHp, player.hp + item.healHp);
  const healed = nextHp - player.hp;
  players.set(playerId, {
    ...player,
    hp: nextHp,
    updatedAt: Date.now()
  });

  if (quantity <= 1) {
    inventory.delete(itemId);
  } else {
    inventory.set(itemId, quantity - 1);
  }

  sendInventory(playerId);
  sendItemNotice(playerId, `使用 ${item.name}。`, itemId, inventory.get(itemId) ?? 0, healed);
  savePlayerGame(playerId);
  snapshot();
}

function handleEquipItem(playerId: string, itemId: ItemId) {
  const player = players.get(playerId);
  const inventory = inventories.get(playerId);
  const item = ITEM_DEFINITIONS[itemId];
  const quantity = inventory?.get(itemId) ?? 0;

  if (!player || player.hp <= 0 || !inventory) {
    return;
  }

  if (quantity <= 0) {
    sendItemNotice(playerId, `你沒有 ${item.name}。`, itemId, 0);
    return;
  }

  if (item.kind !== "equipment" || !item.equipmentSlot) {
    sendItemNotice(playerId, `${item.name} 不能裝備。`, itemId, quantity);
    return;
  }

  const equipment = getEquipment(playerId);
  if (equipment[item.equipmentSlot] === itemId) {
    sendItemNotice(playerId, `${item.name} 已經裝備中。`, itemId, quantity);
    return;
  }

  equipment[item.equipmentSlot] = itemId;
  syncPlayerStats(playerId);
  sendEquipment(playerId);
  sendItemNotice(playerId, `已裝備 ${item.name}。`, itemId, quantity);
  savePlayerGame(playerId);
  snapshot();
}

function getNpc(player: PlayerSnapshot, npcId: string) {
  return getPlayerMap(player).npcs.find((npc) => npc.id === npcId);
}

function getShopByNpc(npcId: string) {
  return SHOP_DEFINITIONS.find((shop) => shop.npcId === npcId);
}

function isNearNpc(player: PlayerSnapshot, npcId: string) {
  const npc = getNpc(player, npcId);
  if (!npc) {
    return false;
  }

  return Math.abs(player.x - npc.x) <= npc.interactionRadius && Math.abs(player.y - npc.y) <= npc.interactionRadius;
}

function getInteractable(player: PlayerSnapshot, interactableId: string) {
  return getPlayerMap(player).interactables.find((interactable) => interactable.id === interactableId);
}

function isNearInteractable(player: PlayerSnapshot, interactableId: string) {
  const interactable = getInteractable(player, interactableId);
  if (!interactable) {
    return false;
  }

  return (
    Math.abs(player.x - interactable.x) <= interactable.interactionRadius &&
    Math.abs(player.y - interactable.y) <= interactable.interactionRadius
  );
}

function handlePortalEnter(playerId: string, portalId: string) {
  const player = players.get(playerId);
  if (!player || player.hp <= 0) {
    return;
  }

  const portal = getPlayerMap(player).portals.find((candidate) => candidate.id === portalId);
  if (!portal) {
    return;
  }

  const inRange =
    Math.abs(player.x - portal.x) <= portal.width / 2 + 18 && Math.abs(player.y - portal.y) <= portal.height / 2 + 28;
  if (!inRange) {
    return;
  }

  const targetMap = getGameMap(portal.targetMapId);
  const nextPlayer: PlayerSnapshot = {
    ...player,
    mapId: targetMap.id,
    x: portal.targetX,
    y: portal.targetY,
    animation: "idle",
    updatedAt: Date.now()
  };
  players.set(playerId, nextPlayer);
  playerInvulnerableUntil.set(playerId, Date.now() + playerRespawnInvulnerableMs);
  sendToPlayer(playerId, {
    type: "map:change",
    playerId,
    mapId: targetMap.id,
    x: portal.targetX,
    y: portal.targetY,
    map: targetMap
  });
  savePlayerGame(playerId);
  broadcastWorldSnapshots();
}

function handleReturnSafe(playerId: string) {
  const player = players.get(playerId);
  if (!player || player.hp <= 0) {
    return;
  }

  const now = Date.now();
  const readyAt = playerReturnSafeReadyAt.get(playerId) ?? 0;
  if (readyAt > now) {
    sendToPlayer(playerId, {
      type: "chat:notice",
      playerId,
      text: `回安全區冷卻中，還要 ${Math.ceil((readyAt - now) / 1000)} 秒。`
    });
    return;
  }

  const map = getPlayerMap(player);
  const nextPlayer: PlayerSnapshot = {
    ...player,
    x: map.playerSpawn.x,
    y: map.playerSpawn.y,
    animation: "idle",
    updatedAt: now
  };
  players.set(playerId, nextPlayer);
  playerReturnSafeReadyAt.set(playerId, now + returnSafeCooldownMs);
  playerInvulnerableUntil.set(playerId, now + playerRespawnInvulnerableMs);
  sendToPlayer(playerId, {
    type: "map:change",
    playerId,
    mapId: map.id,
    x: map.playerSpawn.x,
    y: map.playerSpawn.y,
    map
  });
  sendToPlayer(playerId, {
    type: "chat:notice",
    playerId,
    text: "已返回安全區。"
  });
  savePlayerGame(playerId);
  broadcastWorldSnapshots();
}

function sendQuest(playerId: string) {
  const quests = playerQuests.get(playerId);
  if (!quests) {
    return;
  }

  for (const quest of quests.values()) {
    sendToPlayer(playerId, {
      type: "quest:update",
      playerId,
      quest
    });
  }
}

function sendSingleQuest(playerId: string, quest: QuestSnapshot) {
  sendToPlayer(playerId, {
    type: "quest:update",
    playerId,
    quest
  });
}

function sendQuestNotice(playerId: string, text: string, rewardExp?: number, rewardGold?: number) {
  sendToPlayer(playerId, {
    type: "quest:notice",
    playerId,
    text,
    rewardExp,
    rewardGold
  });
}

function getQuestProgress(playerId: string, quest: QuestSnapshot) {
  if (quest.objective.type === "collect") {
    const inventory = inventories.get(playerId);
    return Math.min(quest.targetCount, inventory?.get(quest.objective.itemId) ?? 0);
  }

  if (quest.objective.type === "interact") {
    return Math.min(quest.targetCount, Math.max(quest.progress, quest.interactedTargetIds?.length ?? 0));
  }

  return quest.progress;
}

function canCompleteQuest(playerId: string, quest: QuestSnapshot) {
  return getQuestProgress(playerId, quest) >= quest.targetCount;
}

function areQuestPrerequisitesMet(quests: Map<string, QuestSnapshot>, quest: QuestSnapshot) {
  return (quest.prerequisiteQuestIds ?? []).every((questId) => quests.get(questId)?.status === "completed");
}

function getQuestLockText(quests: Map<string, QuestSnapshot>, quest: QuestSnapshot) {
  const missingQuestId = (quest.prerequisiteQuestIds ?? []).find((questId) => quests.get(questId)?.status !== "completed");
  if (!missingQuestId) {
    return "";
  }

  return `尚未解鎖：先完成「${quests.get(missingQuestId)?.title ?? "前置任務"}」。`;
}

function syncUnlockedAvailableQuests(playerId: string, quests: Map<string, QuestSnapshot>) {
  for (const quest of quests.values()) {
    if (quest.status === "available" && areQuestPrerequisitesMet(quests, quest)) {
      sendSingleQuest(playerId, quest);
    }
  }
}

function consumeQuestItems(playerId: string, quest: QuestSnapshot) {
  if (quest.objective.type !== "collect" || !quest.objective.consumeItems) {
    return;
  }

  const inventory = inventories.get(playerId);
  if (!inventory) {
    return;
  }

  const current = inventory.get(quest.objective.itemId) ?? 0;
  const nextQuantity = Math.max(0, current - quest.targetCount);
  if (nextQuantity === 0) {
    inventory.delete(quest.objective.itemId);
  } else {
    inventory.set(quest.objective.itemId, nextQuantity);
  }
  sendInventory(playerId);
}

function awardQuestRewards(playerId: string, quest: QuestSnapshot) {
  awardExp(playerId, quest.rewardExp);
  addGold(playerId, quest.rewardGold);
}

function getAcceptedText(quest: QuestSnapshot) {
  if (quest.objective.type === "collect") {
    return `任務已接受：收集 ${quest.targetCount} 個${ITEM_DEFINITIONS[quest.objective.itemId].name}。`;
  }

  if (quest.objective.type === "interact") {
    return `任務已接受：完成 ${quest.targetCount} 個地圖互動點。`;
  }

  return `任務已接受：擊退 ${quest.targetCount} 隻${MONSTER_KIND_NAMES[quest.objective.targetKind]}。`;
}

function getActiveText(quest: QuestSnapshot, remaining: number) {
  if (quest.objective.type === "collect") {
    return `任務進行中：還需要 ${remaining} 個${ITEM_DEFINITIONS[quest.objective.itemId].name}。`;
  }

  if (quest.objective.type === "interact") {
    return `任務進行中：還需要完成 ${remaining} 個地圖互動點。`;
  }

  return `任務進行中：還需要擊退 ${remaining} 隻${MONSTER_KIND_NAMES[quest.objective.targetKind]}。`;
}

function handleMapInteract(playerId: string, interactableId: string) {
  const player = players.get(playerId);
  if (!player || player.hp <= 0 || !isNearInteractable(player, interactableId)) {
    return;
  }

  const interactable = getInteractable(player, interactableId);
  const quests = playerQuests.get(playerId);
  if (!interactable || !quests) {
    return;
  }

  const activeQuest = [...quests.values()].find(
    (quest) => quest.status === "active" && quest.objective.type === "interact" && quest.objective.targetId === interactable.targetId
  );
  if (!activeQuest) {
    sendQuestNotice(playerId, `${interactable.name} 已檢查。若要推進任務，請先找 NPC 接取相關委託。`);
    return;
  }

  const interactedTargetIds = activeQuest.interactedTargetIds ?? [];
  if (interactedTargetIds.includes(interactable.id)) {
    sendQuestNotice(playerId, `${interactable.name} 已完成，不需要重複處理。`);
    return;
  }

  const nextInteractedTargetIds = [...interactedTargetIds, interactable.id];
  const progress = Math.min(activeQuest.targetCount, Math.max(activeQuest.progress, nextInteractedTargetIds.length));
  const nextQuest: QuestSnapshot = {
    ...activeQuest,
    progress,
    status: progress >= activeQuest.targetCount ? "ready" : "active",
    interactedTargetIds: nextInteractedTargetIds
  };
  quests.set(activeQuest.id, nextQuest);
  sendSingleQuest(playerId, nextQuest);

  if (nextQuest.status === "ready") {
    sendQuestNotice(playerId, `互動完成：${interactable.name}。任務可回報。`);
  } else {
    const remaining = Math.max(0, nextQuest.targetCount - nextQuest.progress);
    sendQuestNotice(playerId, `互動完成：${interactable.name}。還需要 ${remaining} 個目標。`);
  }
  savePlayerGame(playerId);
}

function handleNpcInteract(playerId: string, npcId: string) {
  const player = players.get(playerId);
  if (!player || player.hp <= 0 || !isNearNpc(player, npcId)) {
    return;
  }

  const shop = getShopByNpc(npcId);
  if (shop) {
    const offer = shop.items[0];
    const itemName = offer ? ITEM_DEFINITIONS[offer.itemId].name : "商品";
    sendShopOpen(playerId, shop);
    sendShopNotice(
      playerId,
      `${getNpc(player, npcId)?.name ?? shop.name}：${itemName} x${offer?.quantity ?? 1} 售價 ${offer?.priceGold ?? 0} 金幣。按 N 選商品，按 B 購買。`
    );
    return;
  }

  const quests = playerQuests.get(playerId);
  const npcQuests = [...(quests?.values() ?? [])].filter((candidate) => candidate.npcId === npcId);
  const unlockedAvailableQuest = npcQuests.find(
    (candidate) => candidate.status === "available" && areQuestPrerequisitesMet(quests ?? new Map(), candidate)
  );
  const lockedAvailableQuest = npcQuests.find(
    (candidate) => candidate.status === "available" && !areQuestPrerequisitesMet(quests ?? new Map(), candidate)
  );
  const quest =
    npcQuests.find((candidate) => candidate.status === "ready") ??
    npcQuests.find((candidate) => candidate.status === "active") ??
    unlockedAvailableQuest ??
    npcQuests[0];
  if (!quests || !quest) {
    return;
  }

  if (quest.status === "available" && !areQuestPrerequisitesMet(quests, quest)) {
    sendQuestNotice(playerId, getQuestLockText(quests, lockedAvailableQuest ?? quest));
    return;
  }

  if (quest.status === "available") {
    const activeQuest: QuestSnapshot = {
      ...quest,
      status: "active",
      progress: getQuestProgress(playerId, quest)
    };
    quests.set(quest.id, activeQuest);
    sendSingleQuest(playerId, activeQuest);
    sendQuestNotice(playerId, getAcceptedText(activeQuest));
    savePlayerGame(playerId);
    return;
  }

  if (quest.status === "active") {
    const progress = getQuestProgress(playerId, quest);
    if (progress >= quest.targetCount) {
      const readyQuest: QuestSnapshot = {
        ...quest,
        progress: quest.targetCount,
        status: "ready"
      };
      quests.set(quest.id, readyQuest);
      sendSingleQuest(playerId, readyQuest);
      sendQuestNotice(playerId, `任務可回報：請回去找 ${getNpc(player, npcId)?.name ?? "委託人"}。`);
      savePlayerGame(playerId);
      return;
    }

    const remaining = Math.max(0, quest.targetCount - progress);
    sendQuestNotice(playerId, getActiveText(quest, remaining));
    return;
  }

  if (quest.status === "ready") {
    if (!canCompleteQuest(playerId, quest)) {
      sendQuestNotice(playerId, getActiveText(quest, quest.targetCount - getQuestProgress(playerId, quest)));
      return;
    }

    consumeQuestItems(playerId, quest);
    awardQuestRewards(playerId, quest);
    const completedQuest: QuestSnapshot = {
      ...quest,
      status: "completed",
      progress: quest.targetCount
    };
    quests.set(quest.id, completedQuest);
    sendSingleQuest(playerId, completedQuest);
    sendQuestNotice(playerId, "任務完成：已領取獎勵。", quest.rewardExp, quest.rewardGold);
    syncUnlockedAvailableQuests(playerId, quests);
    savePlayerGame(playerId);
    snapshot();
    return;
  }

  sendQuestNotice(playerId, `${getNpc(player, npcId)?.name ?? "這位 NPC"} 目前沒有新的委託。`);
}

function handleShopBuy(playerId: string, message: Extract<ClientMessage, { type: "shop:buy" }>) {
  const player = players.get(playerId);
  if (!player || player.hp <= 0 || !isNearNpc(player, message.npcId)) {
    return;
  }

  const shop = getShopByNpc(message.npcId);
  const offer = shop?.items.find((item) => item.itemId === message.itemId);
  if (!shop || !offer) {
    sendShopNotice(playerId, "這裡沒有販售這項物品。", message.itemId);
    return;
  }

  const buyCount = Math.max(1, Math.min(Number.isFinite(message.quantity) ? Math.trunc(message.quantity) : 1, 20));
  const itemQuantity = offer.quantity * buyCount;
  const priceGold = offer.priceGold * buyCount;
  const item = ITEM_DEFINITIONS[offer.itemId];

  if (player.gold < priceGold) {
    sendShopNotice(playerId, `購買 ${item.name} x${itemQuantity} 需要 ${priceGold} 金幣。`, offer.itemId, itemQuantity, priceGold);
    return;
  }

  players.set(playerId, {
    ...player,
    gold: player.gold - priceGold,
    updatedAt: Date.now()
  });
  addInventoryItem(playerId, offer.itemId, itemQuantity);
  sendShopNotice(playerId, `花費 ${priceGold} 金幣購買 ${item.name} x${itemQuantity}。`, offer.itemId, itemQuantity, priceGold);
  savePlayerGame(playerId);
  snapshot();
}

function progressKillQuest(playerId: string, monsterKind: MonsterSnapshot["kind"]) {
  const quests = playerQuests.get(playerId);
  if (!quests) {
    return;
  }

  for (const quest of quests.values()) {
    if (quest.status !== "active" || quest.objective.type !== "kill" || quest.objective.targetKind !== monsterKind) {
      continue;
    }

    const progress = Math.min(quest.targetCount, quest.progress + 1);
    const nextQuest: QuestSnapshot = {
      ...quest,
      progress,
      status: progress >= quest.targetCount ? "ready" : "active"
    };
    quests.set(quest.id, nextQuest);
    sendSingleQuest(playerId, nextQuest);

    if (nextQuest.status === "ready") {
      const player = players.get(playerId);
      sendQuestNotice(playerId, `任務可回報：請回去找 ${player ? getNpc(player, quest.npcId)?.name ?? "委託人" : "委託人"}。`);
    }
    savePlayerGame(playerId);
  }
}

function progressCollectQuests(playerId: string, itemId: ItemId) {
  const quests = playerQuests.get(playerId);
  if (!quests) {
    return;
  }

  for (const quest of quests.values()) {
    if (quest.status !== "active" || quest.objective.type !== "collect" || quest.objective.itemId !== itemId) {
      continue;
    }

    const progress = getQuestProgress(playerId, quest);
    const nextQuest: QuestSnapshot = {
      ...quest,
      progress,
      status: progress >= quest.targetCount ? "ready" : "active"
    };
    quests.set(quest.id, nextQuest);
    sendSingleQuest(playerId, nextQuest);

    if (nextQuest.status === "ready") {
      const player = players.get(playerId);
      sendQuestNotice(playerId, `任務可回報：請回去找 ${player ? getNpc(player, quest.npcId)?.name ?? "委託人" : "委託人"}。`);
    }
    savePlayerGame(playerId);
  }
}

function handleAttack(playerId: string, message: Extract<ClientMessage, { type: "combat:attack" }>) {
  const player = players.get(playerId);
  if (!player || player.hp <= 0 || recentAttacks.has(message.attackId)) {
    return;
  }

  const now = Date.now();
  const skillId = CLASS_SKILL_IDS[player.className];
  const skill = message.isSkill ? SKILL_DEFINITIONS[skillId] : undefined;
  const classConfig = getPlayerClassConfig(playerId);
  let attacker = player;

  if (message.isSkill) {
    if (!skill) {
      return;
    }

    const skillReadyAt = playerSkillReadyAt.get(playerId)?.get(skill.id) ?? 0;
    const cooldownRemainingMs = Math.max(0, skillReadyAt - now);
    if (cooldownRemainingMs > 0) {
      sendSkillNotice(
        playerId,
        skill.id,
        `${skill.name} 冷卻中：${(cooldownRemainingMs / 1000).toFixed(1)} 秒。`,
        player.mp,
        cooldownRemainingMs
      );
      return;
    }

    if (player.mp < skill.mpCost) {
      sendSkillNotice(playerId, skill.id, `${skill.name} 需要 ${skill.mpCost} 法力。`, player.mp, 0);
      return;
    }

    attacker = {
      ...player,
      mp: player.mp - skill.mpCost,
      animation: "skill",
      updatedAt: now
    };
    players.set(playerId, attacker);

    let cooldowns = playerSkillReadyAt.get(playerId);
    if (!cooldowns) {
      cooldowns = new Map();
      playerSkillReadyAt.set(playerId, cooldowns);
    }
    cooldowns.set(skill.id, now + skill.cooldownMs);
    sendSkillNotice(playerId, skill.id, `施放 ${skill.name}。`, attacker.mp, skill.cooldownMs);
  }

  recentAttacks.set(message.attackId, now);
  const range = skill ? skill.range + classConfig.skillRangeBonus : classConfig.normalAttackRange;
  const verticalRange = skill
    ? skill.verticalRange + classConfig.skillVerticalRangeBonus
    : classConfig.normalAttackVerticalRange;
  const damage = skill ? skill.damage + classConfig.skillDamageBonus + getAttackBonus(playerId) : getAttack(playerId);

  for (const monster of monsters.values()) {
    if (!monster.alive || monster.mapId !== attacker.mapId) {
      continue;
    }

    const dx = monster.x - attacker.x;
    const dy = Math.abs(monster.y - attacker.y);
    const inFront = attacker.facing === "right" ? dx >= 0 : dx <= 0;
    const inRange = Math.abs(dx) <= range && dy <= verticalRange;

    if (!inFront || !inRange) {
      continue;
    }

    const nextHp = Math.max(0, monster.hp - damage);
    const defeated = nextHp === 0;
    const spawn = getMonsterSpawn(monster.id);
    const expGained = defeated ? (spawn?.expReward ?? 0) : 0;
    monsters.set(monster.id, {
      ...monster,
      hp: nextHp,
      alive: !defeated,
      facing: dx >= 0 ? "left" : "right",
      hitAt: now,
      updatedAt: now
    });

    if (defeated) {
      respawnAt.set(monster.id, now + (spawn?.respawnMs ?? 3500));
      awardExp(playerId, expGained);
      progressKillQuest(playerId, monster.kind);
      createMonsterDrops(monster);
      savePlayerGame(playerId);
    }

    sendToPlayer(playerId, {
      type: "combat:hit",
      playerId,
      monsterId: monster.id,
      damage,
      remainingHp: nextHp,
      defeated,
      expGained,
      isSkill: message.isSkill,
      skillId: skill?.id
    });
    snapshot();
    return;
  }

  sendCombatMiss(playerId, message.isSkill, skill?.id);

  if (skill) {
    snapshot();
  }
}

setInterval(() => {
  const staleBefore = Date.now() - 10_000;
  for (const [attackId, seenAt] of recentAttacks) {
    if (seenAt < staleBefore) {
      recentAttacks.delete(attackId);
    }
  }
}, 5000);

wss.on("connection", (ws, request) => {
  const playerId = randomUUID();
  const authSession = getAuthSession(getSessionId(request.url));
  const fallbackSaveSlot = authSession ? `account-${authSession.accountId.slice(5, 13)}` : playerId;
  const requestedSaveSlot = getRequestedSaveSlot(request.url);
  const saveSlot = authSession
    ? normalizeSaveSlot(requestedSaveSlot ?? getFirstSaveSlotForAccount(authSession.accountId), fallbackSaveSlot)
    : getSaveSlot(request.url, playerId);
  if (authSession) {
    bindAccountSaveSlot(authSession.accountId, saveSlot);
  }
  const savedGame = loadGame(saveSlot);
  const savedCharacter = savedGame.character;
  const savedClassName = isCharacterClass(savedCharacter?.className) ? savedCharacter.className : "swordsman";
  const maxHp = getMaxHp(playerId, savedClassName);
  const maxMp = getMaxMp(playerId, savedClassName);
  sockets.set(playerId, ws);
  playerSaveSlots.set(playerId, saveSlot);
  if (authSession) {
    playerAccountIds.set(playerId, authSession.accountId);
  }
  playerEquipment.set(playerId, createEquipmentFromSave(savedGame.equipment));

  players.set(playerId, {
    id: playerId,
    name: savedCharacter?.name ?? `旅人-${playerId.slice(0, 4)}`,
    className: savedClassName,
    mapId: DEFAULT_GAME_MAP.id,
    x: savedCharacter?.x ?? DEFAULT_GAME_MAP.playerSpawn.x,
    y: savedCharacter?.y ?? DEFAULT_GAME_MAP.playerSpawn.y,
    facing: savedCharacter?.facing ?? "right",
    animation: "idle",
    level: savedCharacter?.level ?? 1,
    exp: savedCharacter?.exp ?? 0,
    expToNext: savedCharacter?.expToNext ?? getExpToNext(savedCharacter?.level ?? 1),
    gold: savedCharacter?.gold ?? 0,
    hp: clampStat(savedCharacter?.hp, maxHp),
    maxHp,
    mp: clampStat(savedCharacter?.mp, maxMp),
    maxMp,
    attack: getAttack(playerId, savedClassName),
    defense: getDefense(playerId, savedClassName),
    updatedAt: Date.now()
  });
  playerQuests.set(playerId, createQuestsFromSave(savedGame.quests));
  inventories.set(playerId, createInventoryFromSave(savedGame.inventory));
  playerSkillReadyAt.set(playerId, new Map());

  send(ws, { type: "session:welcome", playerId, saveSlot, authenticated: Boolean(authSession), mapId: DEFAULT_GAME_MAP.id });
  const latestAnnouncement = listActiveAdminAnnouncements(1)[0];
  if (latestAnnouncement) {
    send(ws, {
      type: "admin:notice",
      text: latestAnnouncement.text,
      sentAt: latestAnnouncement.createdAt,
      category: latestAnnouncement.category,
      expiresAt: latestAnnouncement.expiresAt
    });
  }
  sendQuest(playerId);
  sendInventory(playerId);
  sendEquipment(playerId);
  savePlayerGame(playerId);
  snapshot();

  ws.on("message", (raw) => {
    let message: ClientMessage;

    try {
      message = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      return;
    }

    if (message.type === "player:update") {
      const current = players.get(playerId);
      if (!current || message.player.id !== playerId) {
        return;
      }

      if (current.hp <= 0) {
        return;
      }

      const nextName = normalizePlayerName(message.player.name);
      const nextClassName = isCharacterClass(message.player.className) ? message.player.className : current.className;
      const identityChanged = nextName !== current.name || nextClassName !== current.className;
      const maxHp = getMaxHp(playerId, nextClassName);
      const maxMp = getMaxMp(playerId, nextClassName);
      const nextHp = current.hp >= current.maxHp ? maxHp : Math.min(current.hp, maxHp);
      const nextMp = current.mp >= current.maxMp ? maxMp : Math.min(current.mp, maxMp);
      players.set(playerId, {
        ...current,
        name: nextName,
        className: nextClassName,
        hp: nextHp,
        maxHp,
        mp: nextMp,
        maxMp,
        attack: getAttack(playerId, nextClassName),
        defense: getDefense(playerId, nextClassName),
        x: message.player.x,
        y: message.player.y,
        facing: message.player.facing,
        animation: message.player.animation,
        updatedAt: Date.now()
      });
      if (identityChanged) {
        sendEquipment(playerId);
        savePlayerGame(playerId);
      }
      return;
    }

    if (message.type === "combat:attack") {
      handleAttack(playerId, message);
      return;
    }

    if (message.type === "item:pickup") {
      handleItemPickup(playerId, message.dropId);
      return;
    }

    if (message.type === "inventory:use") {
      handleUseItem(playerId, message.itemId);
      return;
    }

    if (message.type === "inventory:equip") {
      handleEquipItem(playerId, message.itemId);
      return;
    }

    if (message.type === "shop:buy") {
      handleShopBuy(playerId, message);
      return;
    }

    if (message.type === "npc:interact") {
      handleNpcInteract(playerId, message.npcId);
      return;
    }

    if (message.type === "map:interact") {
      handleMapInteract(playerId, message.interactableId);
      return;
    }

    if (message.type === "portal:enter") {
      handlePortalEnter(playerId, message.portalId);
      return;
    }

    if (message.type === "player:return-safe") {
      handleReturnSafe(playerId);
      return;
    }

    if (message.type === "chat:send") {
      const now = Date.now();
      if (classroomChatLocked) {
        send(ws, { type: "chat:notice", playerId, text: classroomChatLockMessage });
        return;
      }

      const mute = mutedPlayers.get(playerId);
      if (mute) {
        send(ws, { type: "chat:notice", playerId, text: mute.reason });
        return;
      }

      const nextReadyAt = playerChatReadyAt.get(playerId) ?? 0;
      if (nextReadyAt > now) {
        send(ws, { type: "chat:notice", playerId, text: "發言太快，請稍後再試。" });
        return;
      }

      const text = normalizeChatText(message.text);
      if (!text) {
        return;
      }

      if (isBlockedChatText(text)) {
        send(ws, { type: "chat:notice", playerId, text: "訊息包含不適合課堂的文字，未送出。" });
        return;
      }

      playerChatReadyAt.set(playerId, now + chatCooldownMs);
      const player = players.get(playerId);
      logChatMessage({
        playerId,
        saveSlot,
        playerName: player?.name ?? playerId,
        accountId: authSession?.accountId,
        text,
        sentAt: now
      });
      broadcast({
        type: "chat:message",
        playerId,
        text,
        sentAt: now
      });
    }
  });

  ws.on("close", () => {
    savePlayerGame(playerId);
    sockets.delete(playerId);
    players.delete(playerId);
    inventories.delete(playerId);
    playerEquipment.delete(playerId);
    playerQuests.delete(playerId);
    playerSaveSlots.delete(playerId);
    playerAccountIds.delete(playerId);
    playerSkillReadyAt.delete(playerId);
    playerChatReadyAt.delete(playerId);
    playerReturnSafeReadyAt.delete(playerId);
    mutedPlayers.delete(playerId);
    playerRespawnAt.delete(playerId);
    playerDamageCooldownUntil.delete(playerId);
    playerInvulnerableUntil.delete(playerId);
    broadcast({ type: "player:left", playerId });
    snapshot();
  });
});

setInterval(tickWorld, 1000 / 15);

httpServer.listen(port, () => {
  console.log(`Penglai Online server listening on ws://localhost:${port}`);
  console.log(`Auth endpoint: http://localhost:${port}/auth/google`);
  console.log(`SQLite save database: ${getDatabasePath()}`);
  if (!googleClientId) {
    console.log("Google auth disabled: set GOOGLE_CLIENT_ID to enable /auth/google.");
  }
  if (allowedGoogleHostedDomain) {
    console.log(`Google hosted domain restriction: ${allowedGoogleHostedDomain}`);
  }
});
