import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import type {
  CharacterClass,
  EquipmentSnapshot,
  Facing,
  InventorySlot,
  ItemId,
  PlayerSnapshot,
  QuestSnapshot,
  QuestStatus
} from "@penglai/shared";

export interface SavedCharacter {
  name: string;
  className: CharacterClass;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  hp: number;
  mp: number;
  x: number;
  y: number;
  facing: Facing;
}

export interface SavedQuest {
  questId: string;
  status: QuestStatus;
  progress: number;
  interactedTargetIds: string[];
}

export interface SavedGame {
  character?: SavedCharacter;
  inventory: InventorySlot[];
  equipment: EquipmentSnapshot;
  quests: SavedQuest[];
}

export interface SaveGameInput {
  player: PlayerSnapshot;
  inventory: InventorySlot[];
  equipment: EquipmentSnapshot;
  quests: QuestSnapshot[];
}

interface CharacterRow {
  name: string;
  class_name: CharacterClass;
  level: number;
  exp: number;
  exp_to_next: number;
  gold: number;
  hp: number;
  mp: number;
  x: number;
  y: number;
  facing: Facing;
}

interface InventoryRow {
  item_id: ItemId;
  name: string;
  quantity: number;
}

interface EquipmentRow {
  slot: keyof EquipmentSnapshot;
  item_id: ItemId | null;
}

interface QuestRow {
  quest_id: string;
  status: QuestStatus;
  progress: number;
  interacted_target_ids?: string;
}

export interface GoogleAccountProfile {
  subject: string;
  email?: string;
  hostedDomain?: string;
  displayName?: string;
}

export interface AuthSession {
  sessionId: string;
  accountId: string;
  expiresAt: number;
}

export interface AccountSummary {
  accountId: string;
  email?: string;
  hostedDomain?: string;
  displayName?: string;
}

export interface AccountSaveSlotSummary {
  saveSlot: string;
  characterName?: string;
  level?: number;
  updatedAt: number;
}

export interface AdminSummary {
  accounts: number;
  characters: number;
  saveSlots: number;
  activeSessions: number;
  recentCharacters: AdminCharacterSummary[];
}

export interface AdminSaveAudit {
  totalCharacters: number;
  accountBoundCharacters: number;
  guestCharacters: number;
  accountSaveSlots: number;
  smokeTestCharacters: number;
  recentGuestCharacters: AdminCharacterSummary[];
  recentAccountCharacters: AdminCharacterSummary[];
}

export interface AdminCharacterSummary {
  saveSlot: string;
  characterName: string;
  className: CharacterClass;
  level: number;
  gold: number;
  accountEmail?: string;
  hostedDomain?: string;
  updatedAt: number;
}

export interface TestDataReport {
  smokeCharacters: number;
  smokeFeedback: number;
  smokeChatLogs: number;
  smokeActionLogs: number;
  smokeAccountSaveSlots: number;
}

export interface TestDataCleanupResult {
  dryRun: boolean;
  report: TestDataReport;
  deleted?: TestDataReport;
}

export interface ChatLogInput {
  playerId: string;
  saveSlot: string;
  playerName: string;
  accountId?: string;
  text: string;
  sentAt: number;
}

export interface AdminChatLog {
  playerId: string;
  saveSlot: string;
  playerName: string;
  accountEmail?: string;
  text: string;
  sentAt: number;
}

export interface AdminActionLogInput {
  action: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  details?: string;
  createdAt?: number;
}

export interface AdminActionLog {
  id: number;
  action: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  details?: string;
  createdAt: number;
}

export interface TestFeedbackInput {
  testerName: string;
  schoolName?: string;
  classGroup: string;
  playerName: string;
  saveSlot: string;
  accountId?: string;
  mapId: string;
  currentZone?: string;
  activeQuest?: string;
  chapterProgress: string;
  feedbackCategory?: string;
  deviceType?: string;
  difficulty: number;
  stuckPoint: string;
  suggestion: string;
  contactAllowed?: boolean;
  userAgent?: string;
  submittedAt?: number;
}

export type FeedbackStatus = "open" | "reviewing" | "fixed" | "deferred";

export interface AdminTestFeedback {
  id: number;
  testerName: string;
  schoolName: string;
  classGroup: string;
  playerName: string;
  saveSlot: string;
  accountEmail?: string;
  mapId: string;
  currentZone: string;
  activeQuest: string;
  chapterProgress: string;
  feedbackCategory: string;
  deviceType: string;
  difficulty: number;
  stuckPoint: string;
  suggestion: string;
  contactAllowed: boolean;
  status: FeedbackStatus;
  adminNote: string;
  submittedAt: number;
  updatedAt: number;
}

export interface AdminAnnouncementInput {
  text: string;
  audience?: string;
  category?: string;
  deliveredCount?: number;
  createdAt?: number;
  expiresAt?: number | null;
}

export interface AdminAnnouncement {
  id: number;
  text: string;
  audience: string;
  category: string;
  deliveredCount: number;
  createdAt: number;
  expiresAt?: number;
}

interface AccountRow {
  account_id: string;
  provider: string;
  provider_subject: string;
  email: string | null;
  hosted_domain: string | null;
  display_name: string | null;
}

interface AuthSessionRow {
  session_id: string;
  account_id: string;
  expires_at: number;
  revoked_at: number | null;
}

interface AccountSaveSlotRow {
  save_slot: string;
}

interface AccountSaveSlotSummaryRow {
  save_slot: string;
  character_name: string | null;
  level: number | null;
  updated_at: number;
}

interface AdminCharacterSummaryRow {
  save_slot: string;
  character_name: string;
  class_name: CharacterClass;
  level: number;
  gold: number;
  account_email: string | null;
  hosted_domain: string | null;
  updated_at: number;
}

interface CountRow {
  count: number;
}

interface AdminChatLogRow {
  player_id: string;
  save_slot: string;
  player_name: string;
  account_email: string | null;
  text: string;
  sent_at: number;
}

interface AdminActionLogRow {
  id: number;
  action: string;
  target_player_id: string | null;
  target_player_name: string | null;
  details: string | null;
  created_at: number;
}

interface AdminTestFeedbackRow {
  id: number;
  tester_name: string;
  school_name: string;
  class_group: string;
  player_name: string;
  save_slot: string;
  account_email: string | null;
  map_id: string;
  current_zone: string;
  active_quest: string;
  chapter_progress: string;
  feedback_category: string;
  device_type: string;
  difficulty: number;
  stuck_point: string;
  suggestion: string;
  contact_allowed: number;
  status: FeedbackStatus;
  admin_note: string;
  submitted_at: number;
  updated_at: number;
}

interface AdminAnnouncementRow {
  id: number;
  text: string;
  audience: string;
  category: string;
  delivered_count: number;
  created_at: number;
  expires_at: number | null;
}

const defaultDbPath = fileURLToPath(new URL("../data/penglai.sqlite", import.meta.url));
const dbPath = process.env.PENGLAI_DB_PATH ?? defaultDbPath;

mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS characters (
    save_slot TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    level INTEGER NOT NULL,
    exp INTEGER NOT NULL,
    exp_to_next INTEGER NOT NULL,
    gold INTEGER NOT NULL,
    hp INTEGER NOT NULL,
    mp REAL NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    facing TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inventory_items (
    save_slot TEXT NOT NULL,
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (save_slot, item_id)
  );

  CREATE TABLE IF NOT EXISTS equipment_items (
    save_slot TEXT NOT NULL,
    slot TEXT NOT NULL,
    item_id TEXT,
    PRIMARY KEY (save_slot, slot)
  );

  CREATE TABLE IF NOT EXISTS quest_states (
    save_slot TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL,
    PRIMARY KEY (save_slot, quest_id)
  );

  CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_subject TEXT NOT NULL,
    email TEXT,
    hosted_domain TEXT,
    display_name TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE (provider, provider_subject)
  );

  CREATE TABLE IF NOT EXISTS account_save_slots (
    account_id TEXT NOT NULL,
    save_slot TEXT NOT NULL,
    character_name TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (account_id, save_slot),
    UNIQUE (save_slot),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
  );

  CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    save_slot TEXT NOT NULL,
    player_name TEXT NOT NULL,
    account_id TEXT,
    text TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
  );

  CREATE TABLE IF NOT EXISTS admin_action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    target_player_id TEXT,
    target_player_name TEXT,
    details TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS test_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tester_name TEXT NOT NULL,
    class_group TEXT NOT NULL,
    player_name TEXT NOT NULL,
    save_slot TEXT NOT NULL,
    account_id TEXT,
    map_id TEXT NOT NULL,
    chapter_progress TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    stuck_point TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    user_agent TEXT,
    submitted_at INTEGER NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
  );

  CREATE TABLE IF NOT EXISTS admin_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'all',
    category TEXT NOT NULL DEFAULT 'classroom',
    delivered_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
  );
`);

function tableColumnNames(tableName: string) {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as unknown as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

function addColumnIfMissing(tableName: string, columnName: string, definition: string) {
  if (tableColumnNames(tableName).has(columnName)) {
    return;
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

function parseInteractedTargetIds(value: string | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string").slice(0, 32);
  } catch {
    return [];
  }
}

addColumnIfMissing("admin_announcements", "category", "TEXT NOT NULL DEFAULT 'classroom'");
addColumnIfMissing("admin_announcements", "expires_at", "INTEGER");
addColumnIfMissing("test_feedback", "school_name", "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("test_feedback", "current_zone", "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("test_feedback", "active_quest", "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("test_feedback", "feedback_category", "TEXT NOT NULL DEFAULT 'other'");
addColumnIfMissing("test_feedback", "device_type", "TEXT NOT NULL DEFAULT 'unknown'");
addColumnIfMissing("test_feedback", "contact_allowed", "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("test_feedback", "status", "TEXT NOT NULL DEFAULT 'open'");
addColumnIfMissing("test_feedback", "admin_note", "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("test_feedback", "updated_at", "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("quest_states", "interacted_target_ids", "TEXT NOT NULL DEFAULT '[]'");

export function loadGame(saveSlot: string): SavedGame {
  const character = db
    .prepare(
      `
        SELECT name, class_name, level, exp, exp_to_next, gold, hp, mp, x, y, facing
        FROM characters
        WHERE save_slot = ?
      `
    )
    .get(saveSlot) as CharacterRow | undefined;

  const inventory = db
    .prepare(
      `
        SELECT item_id, name, quantity
        FROM inventory_items
        WHERE save_slot = ?
        ORDER BY item_id
      `
    )
    .all(saveSlot) as unknown as InventoryRow[];

  const equipmentRows = db
    .prepare(
      `
        SELECT slot, item_id
        FROM equipment_items
        WHERE save_slot = ?
      `
    )
    .all(saveSlot) as unknown as EquipmentRow[];

  const quests = db
    .prepare(
      `
        SELECT quest_id, status, progress, interacted_target_ids
        FROM quest_states
        WHERE save_slot = ?
      `
    )
    .all(saveSlot) as unknown as QuestRow[];

  const equipment: EquipmentSnapshot = {
    weapon: null,
    armor: null
  };

  for (const row of equipmentRows) {
    if (row.slot === "weapon" || row.slot === "armor") {
      equipment[row.slot] = row.item_id;
    }
  }

  return {
    character: character
      ? {
          name: character.name,
          className: character.class_name,
          level: character.level,
          exp: character.exp,
          expToNext: character.exp_to_next,
          gold: character.gold,
          hp: character.hp,
          mp: character.mp,
          x: character.x,
          y: character.y,
          facing: character.facing
        }
      : undefined,
    inventory: inventory.map((row) => ({
      itemId: row.item_id,
      name: row.name,
      quantity: row.quantity
    })),
    equipment,
    quests: quests.map((row) => ({
      questId: row.quest_id,
      status: row.status,
      progress: row.progress,
      interactedTargetIds: parseInteractedTargetIds(row.interacted_target_ids)
    }))
  };
}

export function saveGame(saveSlot: string, data: SaveGameInput) {
  db.exec("BEGIN IMMEDIATE");

  try {
    db.prepare(
      `
        INSERT INTO characters (
          save_slot,
          name,
          class_name,
          level,
          exp,
          exp_to_next,
          gold,
          hp,
          mp,
          x,
          y,
          facing,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(save_slot) DO UPDATE SET
          name = excluded.name,
          class_name = excluded.class_name,
          level = excluded.level,
          exp = excluded.exp,
          exp_to_next = excluded.exp_to_next,
          gold = excluded.gold,
          hp = excluded.hp,
          mp = excluded.mp,
          x = excluded.x,
          y = excluded.y,
          facing = excluded.facing,
          updated_at = excluded.updated_at
      `
    ).run(
      saveSlot,
      data.player.name,
      data.player.className,
      data.player.level,
      data.player.exp,
      data.player.expToNext,
      data.player.gold,
      data.player.hp,
      data.player.mp,
      data.player.x,
      data.player.y,
      data.player.facing,
      Date.now()
    );

    db.prepare("DELETE FROM inventory_items WHERE save_slot = ?").run(saveSlot);
    const insertInventory = db.prepare(
      `
        INSERT INTO inventory_items (save_slot, item_id, name, quantity)
        VALUES (?, ?, ?, ?)
      `
    );
    for (const slot of data.inventory) {
      if (slot.quantity > 0) {
        insertInventory.run(saveSlot, slot.itemId, slot.name, slot.quantity);
      }
    }

    db.prepare("DELETE FROM equipment_items WHERE save_slot = ?").run(saveSlot);
    const insertEquipment = db.prepare(
      `
        INSERT INTO equipment_items (save_slot, slot, item_id)
        VALUES (?, ?, ?)
      `
    );
    insertEquipment.run(saveSlot, "weapon", data.equipment.weapon);
    insertEquipment.run(saveSlot, "armor", data.equipment.armor);

    db.prepare("DELETE FROM quest_states WHERE save_slot = ?").run(saveSlot);
    const insertQuest = db.prepare(
      `
        INSERT INTO quest_states (save_slot, quest_id, status, progress, interacted_target_ids)
        VALUES (?, ?, ?, ?, ?)
      `
    );
    for (const quest of data.quests) {
      insertQuest.run(saveSlot, quest.id, quest.status, quest.progress, JSON.stringify(quest.interactedTargetIds ?? []));
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function upsertGoogleAccount(profile: GoogleAccountProfile) {
  const now = Date.now();
  const existing = db
    .prepare(
      `
        SELECT account_id, provider, provider_subject, email, hosted_domain, display_name
        FROM accounts
        WHERE provider = 'google' AND provider_subject = ?
      `
    )
    .get(profile.subject) as AccountRow | undefined;

  const accountId = existing?.account_id ?? `acct_${randomUUID()}`;
  db.prepare(
    `
      INSERT INTO accounts (
        account_id,
        provider,
        provider_subject,
        email,
        hosted_domain,
        display_name,
        created_at,
        updated_at
      )
      VALUES (?, 'google', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider, provider_subject) DO UPDATE SET
        email = excluded.email,
        hosted_domain = excluded.hosted_domain,
        display_name = excluded.display_name,
        updated_at = excluded.updated_at
    `
  ).run(
    accountId,
    profile.subject,
    profile.email ?? null,
    profile.hostedDomain ?? null,
    profile.displayName ?? null,
    now,
    now
  );

  return {
    accountId,
    provider: "google",
    subject: profile.subject,
    email: profile.email,
    hostedDomain: profile.hostedDomain,
    displayName: profile.displayName
  };
}

export function getAccountById(accountId: string): AccountSummary | undefined {
  const row = db
    .prepare(
      `
        SELECT account_id, provider, provider_subject, email, hosted_domain, display_name
        FROM accounts
        WHERE account_id = ?
      `
    )
    .get(accountId) as AccountRow | undefined;

  if (!row) {
    return undefined;
  }

  return {
    accountId: row.account_id,
    email: row.email ?? undefined,
    hostedDomain: row.hosted_domain ?? undefined,
    displayName: row.display_name ?? undefined
  };
}

export function bindAccountSaveSlot(accountId: string, saveSlot: string, characterName?: string) {
  const now = Date.now();
  db.prepare(
    `
      INSERT INTO account_save_slots (account_id, save_slot, character_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(save_slot) DO UPDATE SET
        account_id = excluded.account_id,
        character_name = COALESCE(excluded.character_name, account_save_slots.character_name),
        updated_at = excluded.updated_at
    `
  ).run(accountId, saveSlot, characterName ?? null, now, now);
}

export function getFirstSaveSlotForAccount(accountId: string) {
  const row = db
    .prepare(
      `
        SELECT save_slot
        FROM account_save_slots
        WHERE account_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `
    )
    .get(accountId) as AccountSaveSlotRow | undefined;
  return row?.save_slot;
}

export function listSaveSlotsForAccount(accountId: string): AccountSaveSlotSummary[] {
  const rows = db
    .prepare(
      `
        SELECT
          account_save_slots.save_slot,
          COALESCE(characters.name, account_save_slots.character_name) AS character_name,
          characters.level,
          account_save_slots.updated_at
        FROM account_save_slots
        LEFT JOIN characters ON characters.save_slot = account_save_slots.save_slot
        WHERE account_save_slots.account_id = ?
        ORDER BY account_save_slots.updated_at DESC
      `
    )
    .all(accountId) as unknown as AccountSaveSlotSummaryRow[];

  return rows.map((row) => ({
    saveSlot: row.save_slot,
    characterName: row.character_name ?? undefined,
    level: row.level ?? undefined,
    updatedAt: row.updated_at
  }));
}

export function createAuthSession(accountId: string, ttlMs = 7 * 24 * 60 * 60 * 1000): AuthSession {
  const now = Date.now();
  const sessionId = `sess_${randomUUID()}`;
  const expiresAt = now + ttlMs;
  db.prepare(
    `
      INSERT INTO auth_sessions (session_id, account_id, created_at, expires_at, revoked_at)
      VALUES (?, ?, ?, ?, NULL)
    `
  ).run(sessionId, accountId, now, expiresAt);
  return {
    sessionId,
    accountId,
    expiresAt
  };
}

export function revokeAuthSession(sessionId: string | null | undefined) {
  if (!sessionId) {
    return;
  }

  db.prepare(
    `
      UPDATE auth_sessions
      SET revoked_at = ?
      WHERE session_id = ?
    `
  ).run(Date.now(), sessionId);
}

export function getAuthSession(sessionId: string | null | undefined): AuthSession | undefined {
  if (!sessionId) {
    return undefined;
  }

  const row = db
    .prepare(
      `
        SELECT session_id, account_id, expires_at, revoked_at
        FROM auth_sessions
        WHERE session_id = ?
      `
    )
    .get(sessionId) as AuthSessionRow | undefined;

  if (!row || row.revoked_at || row.expires_at <= Date.now()) {
    return undefined;
  }

  return {
    sessionId: row.session_id,
    accountId: row.account_id,
    expiresAt: row.expires_at
  };
}

function getCount(sql: string, value?: string | number | bigint | null) {
  const statement = db.prepare(sql);
  const row = value === undefined ? statement.get() : statement.get(value);
  return ((row as CountRow | undefined)?.count ?? 0) as number;
}

export function getAdminSummary(): AdminSummary {
  const now = Date.now();
  return {
    accounts: getCount("SELECT COUNT(*) AS count FROM accounts"),
    characters: getCount("SELECT COUNT(*) AS count FROM characters"),
    saveSlots: getCount("SELECT COUNT(*) AS count FROM account_save_slots"),
    activeSessions: getCount(
      "SELECT COUNT(*) AS count FROM auth_sessions WHERE revoked_at IS NULL AND expires_at > ?",
      now
    ),
    recentCharacters: listAdminCharacters(12)
  };
}

function mapAdminCharacterSummaryRow(row: AdminCharacterSummaryRow): AdminCharacterSummary {
  return {
    saveSlot: row.save_slot,
    characterName: row.character_name,
    className: row.class_name,
    level: row.level,
    gold: row.gold,
    accountEmail: row.account_email ?? undefined,
    hostedDomain: row.hosted_domain ?? undefined,
    updatedAt: row.updated_at
  };
}

export function listAdminCharacters(limit = 200): AdminCharacterSummary[] {
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const rows = db
    .prepare(
      `
        SELECT
          characters.save_slot,
          characters.name AS character_name,
          characters.class_name,
          characters.level,
          characters.gold,
          accounts.email AS account_email,
          accounts.hosted_domain,
          characters.updated_at
        FROM characters
        LEFT JOIN account_save_slots ON account_save_slots.save_slot = characters.save_slot
        LEFT JOIN accounts ON accounts.account_id = account_save_slots.account_id
        ORDER BY characters.updated_at DESC
        LIMIT ?
      `
    )
    .all(safeLimit) as unknown as AdminCharacterSummaryRow[];

  return rows.map(mapAdminCharacterSummaryRow);
}

function listAdminCharactersByAccountBinding(bound: boolean, limit = 12): AdminCharacterSummary[] {
  const rows = db
    .prepare(
      `
        SELECT
          characters.save_slot,
          characters.name AS character_name,
          characters.class_name,
          characters.level,
          characters.gold,
          accounts.email AS account_email,
          accounts.hosted_domain,
          characters.updated_at
        FROM characters
        LEFT JOIN account_save_slots ON account_save_slots.save_slot = characters.save_slot
        LEFT JOIN accounts ON accounts.account_id = account_save_slots.account_id
        WHERE account_save_slots.account_id IS ${bound ? "NOT NULL" : "NULL"}
        ORDER BY characters.updated_at DESC
        LIMIT ?
      `
    )
    .all(Math.max(1, Math.min(limit, 100))) as unknown as AdminCharacterSummaryRow[];

  return rows.map(mapAdminCharacterSummaryRow);
}

export function getAdminSaveAudit(): AdminSaveAudit {
  return {
    totalCharacters: getCount("SELECT COUNT(*) AS count FROM characters"),
    accountBoundCharacters: getCount(
      "SELECT COUNT(*) AS count FROM characters INNER JOIN account_save_slots ON account_save_slots.save_slot = characters.save_slot"
    ),
    guestCharacters: getCount(
      "SELECT COUNT(*) AS count FROM characters LEFT JOIN account_save_slots ON account_save_slots.save_slot = characters.save_slot WHERE account_save_slots.account_id IS NULL"
    ),
    accountSaveSlots: getCount("SELECT COUNT(*) AS count FROM account_save_slots"),
    smokeTestCharacters: getCount("SELECT COUNT(*) AS count FROM characters WHERE save_slot LIKE '%smoke%'"),
    recentGuestCharacters: listAdminCharactersByAccountBinding(false, 8),
    recentAccountCharacters: listAdminCharactersByAccountBinding(true, 8)
  };
}

export function getTestDataReport(): TestDataReport {
  return {
    smokeCharacters: getCount("SELECT COUNT(*) AS count FROM characters WHERE save_slot LIKE '%smoke%'"),
    smokeFeedback: getCount(
      "SELECT COUNT(*) AS count FROM test_feedback WHERE save_slot LIKE '%smoke%' OR tester_name LIKE 'Smoke%' OR class_group LIKE 'Smoke%'"
    ),
    smokeChatLogs: getCount("SELECT COUNT(*) AS count FROM chat_logs WHERE save_slot LIKE '%smoke%' OR player_name LIKE 'Smoke%'"),
    smokeActionLogs: getCount("SELECT COUNT(*) AS count FROM admin_action_logs WHERE details LIKE '%Smoke%'"),
    smokeAccountSaveSlots: getCount("SELECT COUNT(*) AS count FROM account_save_slots WHERE save_slot LIKE '%smoke%'")
  };
}

export function cleanupSmokeTestData(dryRun = true): TestDataCleanupResult {
  const report = getTestDataReport();
  if (dryRun) {
    return { dryRun: true, report };
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const deleted: TestDataReport = {
      smokeCharacters: 0,
      smokeFeedback: 0,
      smokeChatLogs: 0,
      smokeActionLogs: 0,
      smokeAccountSaveSlots: 0
    };
    const toDeletedCount = (changes: number | bigint) => Number(changes);
    deleted.smokeFeedback = toDeletedCount(
      db
        .prepare("DELETE FROM test_feedback WHERE save_slot LIKE '%smoke%' OR tester_name LIKE 'Smoke%' OR class_group LIKE 'Smoke%'")
        .run().changes
    );
    deleted.smokeChatLogs = toDeletedCount(
      db.prepare("DELETE FROM chat_logs WHERE save_slot LIKE '%smoke%' OR player_name LIKE 'Smoke%'").run().changes
    );
    deleted.smokeActionLogs = toDeletedCount(db.prepare("DELETE FROM admin_action_logs WHERE details LIKE '%Smoke%'").run().changes);
    deleted.smokeAccountSaveSlots = toDeletedCount(db.prepare("DELETE FROM account_save_slots WHERE save_slot LIKE '%smoke%'").run().changes);
    db.prepare("DELETE FROM inventory_items WHERE save_slot LIKE '%smoke%'").run();
    db.prepare("DELETE FROM equipment_items WHERE save_slot LIKE '%smoke%'").run();
    db.prepare("DELETE FROM quest_states WHERE save_slot LIKE '%smoke%'").run();
    deleted.smokeCharacters = toDeletedCount(db.prepare("DELETE FROM characters WHERE save_slot LIKE '%smoke%'").run().changes);
    db.exec("COMMIT");
    return { dryRun: false, report, deleted };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function logChatMessage(input: ChatLogInput) {
  db.prepare(
    `
      INSERT INTO chat_logs (player_id, save_slot, player_name, account_id, text, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
  ).run(input.playerId, input.saveSlot, input.playerName, input.accountId ?? null, input.text, input.sentAt);
}

export function listAdminChatLogs(limit = 200): AdminChatLog[] {
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const rows = db
    .prepare(
      `
        SELECT
          chat_logs.player_id,
          chat_logs.save_slot,
          chat_logs.player_name,
          accounts.email AS account_email,
          chat_logs.text,
          chat_logs.sent_at
        FROM chat_logs
        LEFT JOIN accounts ON accounts.account_id = chat_logs.account_id
        ORDER BY chat_logs.sent_at DESC
        LIMIT ?
      `
    )
    .all(safeLimit) as unknown as AdminChatLogRow[];

  return rows.map((row) => ({
    playerId: row.player_id,
    saveSlot: row.save_slot,
    playerName: row.player_name,
    accountEmail: row.account_email ?? undefined,
    text: row.text,
    sentAt: row.sent_at
  }));
}

export function logAdminAction(input: AdminActionLogInput) {
  db.prepare(
    `
      INSERT INTO admin_action_logs (action, target_player_id, target_player_name, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(
    input.action,
    input.targetPlayerId ?? null,
    input.targetPlayerName ?? null,
    input.details ?? null,
    input.createdAt ?? Date.now()
  );
}

export function listAdminActionLogs(limit = 200): AdminActionLog[] {
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const rows = db
    .prepare(
      `
        SELECT id, action, target_player_id, target_player_name, details, created_at
        FROM admin_action_logs
        ORDER BY created_at DESC
        LIMIT ?
      `
    )
    .all(safeLimit) as unknown as AdminActionLogRow[];

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetPlayerId: row.target_player_id ?? undefined,
    targetPlayerName: row.target_player_name ?? undefined,
    details: row.details ?? undefined,
    createdAt: row.created_at
  }));
}

export function saveTestFeedback(input: TestFeedbackInput) {
  const submittedAt = input.submittedAt ?? Date.now();
  const result = db
    .prepare(
      `
        INSERT INTO test_feedback (
          tester_name,
          school_name,
          class_group,
          player_name,
          save_slot,
          account_id,
          map_id,
          current_zone,
          active_quest,
          chapter_progress,
          feedback_category,
          device_type,
          difficulty,
          stuck_point,
          suggestion,
          contact_allowed,
          user_agent,
          submitted_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      input.testerName,
      input.schoolName ?? "",
      input.classGroup,
      input.playerName,
      input.saveSlot,
      input.accountId ?? null,
      input.mapId,
      input.currentZone ?? "",
      input.activeQuest ?? "",
      input.chapterProgress,
      input.feedbackCategory ?? "other",
      input.deviceType ?? "unknown",
      input.difficulty,
      input.stuckPoint,
      input.suggestion,
      input.contactAllowed ? 1 : 0,
      input.userAgent ?? null,
      submittedAt,
      submittedAt
    );

  return {
    id: Number(result.lastInsertRowid),
    submittedAt
  };
}

export function listAdminTestFeedback(limit = 200): AdminTestFeedback[] {
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const rows = db
    .prepare(
      `
        SELECT
          test_feedback.id,
          test_feedback.tester_name,
          test_feedback.school_name,
          test_feedback.class_group,
          test_feedback.player_name,
          test_feedback.save_slot,
          accounts.email AS account_email,
          test_feedback.map_id,
          test_feedback.current_zone,
          test_feedback.active_quest,
          test_feedback.chapter_progress,
          test_feedback.feedback_category,
          test_feedback.device_type,
          test_feedback.difficulty,
          test_feedback.stuck_point,
          test_feedback.suggestion,
          test_feedback.contact_allowed,
          test_feedback.status,
          test_feedback.admin_note,
          test_feedback.submitted_at,
          test_feedback.updated_at
        FROM test_feedback
        LEFT JOIN accounts ON accounts.account_id = test_feedback.account_id
        ORDER BY test_feedback.submitted_at DESC
        LIMIT ?
      `
    )
    .all(safeLimit) as unknown as AdminTestFeedbackRow[];

  return rows.map((row) => ({
    id: row.id,
    testerName: row.tester_name,
    schoolName: row.school_name,
    classGroup: row.class_group,
    playerName: row.player_name,
    saveSlot: row.save_slot,
    accountEmail: row.account_email ?? undefined,
    mapId: row.map_id,
    currentZone: row.current_zone,
    activeQuest: row.active_quest,
    chapterProgress: row.chapter_progress,
    feedbackCategory: row.feedback_category,
    deviceType: row.device_type,
    difficulty: row.difficulty,
    stuckPoint: row.stuck_point,
    suggestion: row.suggestion,
    contactAllowed: row.contact_allowed === 1,
    status: row.status,
    adminNote: row.admin_note,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at || row.submitted_at
  }));
}

export function updateTestFeedbackStatus(id: number, status: FeedbackStatus, adminNote: string) {
  const updatedAt = Date.now();
  const result = db
    .prepare(
      `
        UPDATE test_feedback
        SET status = ?, admin_note = ?, updated_at = ?
        WHERE id = ?
      `
    )
    .run(status, adminNote, updatedAt, id);

  return {
    changed: result.changes > 0,
    updatedAt
  };
}

export function saveAdminAnnouncement(input: AdminAnnouncementInput): AdminAnnouncement {
  const createdAt = input.createdAt ?? Date.now();
  const result = db
    .prepare(
      `
        INSERT INTO admin_announcements (text, audience, category, delivered_count, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(input.text, input.audience ?? "all", input.category ?? "classroom", input.deliveredCount ?? 0, createdAt, input.expiresAt ?? null);

  return {
    id: Number(result.lastInsertRowid),
    text: input.text,
    audience: input.audience ?? "all",
    category: input.category ?? "classroom",
    deliveredCount: input.deliveredCount ?? 0,
    createdAt,
    expiresAt: input.expiresAt ?? undefined
  };
}

export function listAdminAnnouncements(limit = 50): AdminAnnouncement[] {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const rows = db
    .prepare(
      `
        SELECT id, text, audience, category, delivered_count, created_at, expires_at
        FROM admin_announcements
        ORDER BY created_at DESC
        LIMIT ?
      `
    )
    .all(safeLimit) as unknown as AdminAnnouncementRow[];

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    audience: row.audience,
    category: row.category,
    deliveredCount: row.delivered_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? undefined
  }));
}

export function listActiveAdminAnnouncements(limit = 5): AdminAnnouncement[] {
  const safeLimit = Math.max(1, Math.min(limit, 20));
  const now = Date.now();
  const rows = db
    .prepare(
      `
        SELECT id, text, audience, category, delivered_count, created_at, expires_at
        FROM admin_announcements
        WHERE expires_at IS NULL OR expires_at > ?
        ORDER BY created_at DESC
        LIMIT ?
      `
    )
    .all(now, safeLimit) as unknown as AdminAnnouncementRow[];

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    audience: row.audience,
    category: row.category,
    deliveredCount: row.delivered_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? undefined
  }));
}

export function getDatabasePath() {
  return dbPath;
}
