interface AdminCharacter {
  saveSlot: string;
  characterName: string;
  className: "swordsman" | "talisman" | "hunter";
  level: number;
  gold: number;
  accountEmail?: string;
  hostedDomain?: string;
  updatedAt: number;
}

interface OnlinePlayer {
  playerId: string;
  name: string;
  className: AdminCharacter["className"];
  level: number;
  hp: number;
  maxHp: number;
  saveSlot?: string;
  authenticated: boolean;
  muted: boolean;
  updatedAt: number;
}

interface ChatLog {
  playerId: string;
  saveSlot: string;
  playerName: string;
  accountEmail?: string;
  text: string;
  sentAt: number;
}

interface AdminActionLog {
  id: number;
  action: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  details?: string;
  createdAt: number;
}

interface TestFeedback {
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
  status: "open" | "reviewing" | "fixed" | "deferred";
  adminNote: string;
  submittedAt: number;
  updatedAt: number;
}

interface Announcement {
  id: number;
  text: string;
  audience: string;
  category: "system" | "classroom" | "maintenance" | "event" | string;
  deliveredCount: number;
  createdAt: number;
  expiresAt?: number;
}

interface SystemStatus {
  uptimeSeconds: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  databasePath: string;
  backupDirectory: string;
  onlinePlayers: number;
  chatLocked: boolean;
  mutedPlayers: number;
  adminApiConfigured: boolean;
  googleAuthConfigured: boolean;
  googleClientConfigured: boolean;
  googleHostedDomain: string;
  authCorsOrigin: string;
}

interface BackupFile {
  fileName: string;
  sizeBytes: number;
  createdAt: number;
}

interface AdminSaveAudit {
  totalCharacters: number;
  accountBoundCharacters: number;
  guestCharacters: number;
  accountSaveSlots: number;
  smokeTestCharacters: number;
  recentGuestCharacters: AdminCharacter[];
  recentAccountCharacters: AdminCharacter[];
}

interface TestDataReport {
  smokeCharacters: number;
  smokeFeedback: number;
  smokeChatLogs: number;
  smokeActionLogs: number;
  smokeAccountSaveSlots: number;
}

interface TestDataCleanupResponse {
  ok: boolean;
  dryRun: boolean;
  report: TestDataReport;
  deleted?: TestDataReport;
  backup?: BackupFile;
}

interface AdminSummary {
  accounts: number;
  characters: number;
  saveSlots: number;
  activeSessions: number;
  betaFeedback?: {
    total: number;
    open: number;
    averageDifficulty: number;
    byClassGroup: Array<{ key: string; count: number }>;
    byMap: Array<{ key: string; count: number }>;
    byCategory: Array<{ key: string; count: number }>;
    recentOpen: Array<{
      id: number;
      testerName: string;
      classGroup: string;
      mapId: string;
      category: string;
      difficulty: number;
      stuckPoint: string;
      submittedAt: number;
    }>;
  };
  recentCharacters: AdminCharacter[];
}

interface ClassroomState {
  chatLocked: boolean;
  chatLockMessage: string;
  mutedPlayers: Array<{
    playerId: string;
    playerName: string;
    reason: string;
    mutedAt: number;
  }>;
}

const adminTokenStorageKey = "penglai-admin-token";
const classLabels: Record<AdminCharacter["className"], string> = {
  swordsman: "劍士",
  talisman: "符咒師",
  hunter: "獵人"
};

const announcementCategoryLabels: Record<string, string> = {
  system: "系統",
  classroom: "課堂",
  maintenance: "維護",
  event: "活動"
};
const feedbackStatusLabels: Record<TestFeedback["status"], string> = {
  open: "未處理",
  reviewing: "處理中",
  fixed: "已修正",
  deferred: "暫不處理"
};

const feedbackCategoryLabels: Record<string, string> = {
  bug: "Bug / 錯誤",
  balance: "難度平衡",
  navigation: "任務 / 路線",
  ui: "介面 / 文字",
  performance: "卡頓 / 連線",
  content: "新增內容",
  other: "其他"
};

const feedbackDeviceLabels: Record<string, string> = {
  desktop: "桌機",
  laptop: "筆電",
  tablet: "平板",
  mobile: "手機",
  unknown: "不確定"
};

export function mountAdminDashboard(root: HTMLElement) {
  root.className = "admin-shell";
  root.innerHTML = `
    <header class="admin-topbar">
      <div>
        <p class="admin-kicker">蓬萊異聞錄 Online</p>
        <h1>教師管理面板</h1>
      </div>
      <a class="admin-link" href="/">回到遊戲</a>
    </header>
    <main class="admin-main">
      <section class="admin-toolbar" aria-label="管理工具">
        <label>
          <span>Admin Token</span>
          <input id="admin-token" type="password" autocomplete="off" placeholder="請輸入 ADMIN_TOKEN" />
        </label>
        <button id="admin-refresh" type="button">重新整理</button>
        <button id="admin-download" type="button">下載角色 CSV</button>
        <button id="admin-chat-download" type="button">下載聊天 CSV</button>
        <button id="admin-action-download" type="button">下載操作 CSV</button>
        <button id="admin-announcement-download" type="button">下載公告 CSV</button>
        <button id="admin-feedback-download" type="button">下載回饋 CSV</button>
      </section>
      <p id="admin-status" class="admin-status">請先輸入 ADMIN_TOKEN 後重新整理。</p>
      <section class="admin-metrics" aria-label="統計"></section>
      <section class="admin-grid admin-maintenance">
        <section class="admin-table-section" aria-label="系統狀態">
          <div class="admin-section-head">
            <h2>系統狀態</h2>
          </div>
          <div class="admin-list" id="admin-system-list"></div>
        </section>
        <section class="admin-table-section" aria-label="資料庫備份">
          <div class="admin-section-head">
            <h2>資料庫備份</h2>
            <button id="admin-backup-create" type="button">建立備份</button>
          </div>
          <div class="admin-list" id="admin-backup-list"></div>
        </section>
      </section>
      <section class="admin-table-section admin-danger-zone" aria-label="測試資料清理">
        <div class="admin-section-head">
          <h2>Smoke 測試資料清理</h2>
          <div class="admin-actions">
            <button id="admin-test-data-dry-run" type="button">預覽清理範圍</button>
            <button id="admin-test-data-cleanup" type="button">清理 Smoke 測試資料</button>
          </div>
        </div>
        <div class="admin-list" id="admin-test-data-list"></div>
        <label class="admin-confirm-line">
          <span>確認文字</span>
          <input id="admin-test-data-confirm" type="text" autocomplete="off" placeholder="DELETE_SMOKE_TEST_DATA" />
        </label>
      </section>
      <section class="admin-broadcast" aria-label="公告廣播">
        <label>
          <span>公告廣播</span>
          <input id="admin-broadcast-text" type="text" maxlength="180" placeholder="請輸入要送給線上玩家的公告" />
        </label>
        <label>
          <span>分類</span>
          <select id="admin-broadcast-category">
            <option value="classroom">課堂</option>
            <option value="system">系統</option>
            <option value="maintenance">維護</option>
            <option value="event">活動</option>
          </select>
        </label>
        <label>
          <span>有效期限</span>
          <select id="admin-broadcast-ttl">
            <option value="60">1 小時</option>
            <option value="180">3 小時</option>
            <option value="1440">1 天</option>
            <option value="0">永久</option>
          </select>
        </label>
        <button id="admin-broadcast-send" type="button">送出公告</button>
      </section>
      <section class="admin-table-section" aria-label="公告歷史">
        <div class="admin-section-head">
          <h2>公告歷史</h2>
        </div>
        <div class="admin-list" id="admin-announcement-list"></div>
      </section>
      <section class="admin-broadcast" aria-label="課堂聊天控制">
        <label>
          <span>聊天鎖定訊息</span>
          <input id="admin-chat-lock-text" type="text" maxlength="180" placeholder="課堂聊天已暫停，請聽老師說明。" />
        </label>
        <button id="admin-chat-lock" type="button">鎖定聊天</button>
      </section>
      <section class="admin-grid">
        <section class="admin-table-section" aria-label="線上玩家">
          <div class="admin-section-head">
            <h2>線上玩家</h2>
          </div>
          <div class="admin-list" id="admin-online-list"></div>
        </section>
        <section class="admin-table-section" aria-label="聊天紀錄">
          <div class="admin-section-head">
            <h2>聊天紀錄</h2>
          </div>
          <div class="admin-list" id="admin-chat-list"></div>
        </section>
        <section class="admin-table-section" aria-label="操作紀錄">
          <div class="admin-section-head">
            <h2>操作紀錄</h2>
          </div>
          <div class="admin-list" id="admin-action-list"></div>
        </section>
      </section>
      <section class="admin-table-section" aria-label="測試回饋">
        <div class="admin-section-head">
          <h2>測試回饋</h2>
        </div>
        <div class="admin-list admin-feedback-list" id="admin-feedback-list"></div>
      </section>
      <section class="admin-table-section" aria-label="角色資料">
        <div class="admin-section-head">
          <h2>角色資料</h2>
          <div class="admin-filters">
            <input id="admin-search" type="search" placeholder="搜尋角色、帳號或存檔" />
            <select id="admin-class-filter">
              <option value="">全部職業</option>
              <option value="swordsman">劍士</option>
              <option value="talisman">符咒師</option>
              <option value="hunter">獵人</option>
            </select>
          </div>
        </div>
        <div class="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>角色</th>
                <th>職業</th>
                <th>等級</th>
                <th>金幣</th>
                <th>帳號</th>
                <th>存檔</th>
                <th>更新時間</th>
              </tr>
            </thead>
            <tbody id="admin-character-rows"></tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  const tokenInput = root.querySelector<HTMLInputElement>("#admin-token")!;
  const refreshButton = root.querySelector<HTMLButtonElement>("#admin-refresh")!;
  const downloadButton = root.querySelector<HTMLButtonElement>("#admin-download")!;
  const chatDownloadButton = root.querySelector<HTMLButtonElement>("#admin-chat-download")!;
  const actionDownloadButton = root.querySelector<HTMLButtonElement>("#admin-action-download")!;
  const announcementDownloadButton = root.querySelector<HTMLButtonElement>("#admin-announcement-download")!;
  const feedbackDownloadButton = root.querySelector<HTMLButtonElement>("#admin-feedback-download")!;
  const backupButton = root.querySelector<HTMLButtonElement>("#admin-backup-create")!;
  const testDataDryRunButton = root.querySelector<HTMLButtonElement>("#admin-test-data-dry-run")!;
  const testDataCleanupButton = root.querySelector<HTMLButtonElement>("#admin-test-data-cleanup")!;
  const testDataConfirmInput = root.querySelector<HTMLInputElement>("#admin-test-data-confirm")!;
  const broadcastButton = root.querySelector<HTMLButtonElement>("#admin-broadcast-send")!;
  const broadcastInput = root.querySelector<HTMLInputElement>("#admin-broadcast-text")!;
  const broadcastCategory = root.querySelector<HTMLSelectElement>("#admin-broadcast-category")!;
  const broadcastTtl = root.querySelector<HTMLSelectElement>("#admin-broadcast-ttl")!;
  const chatLockButton = root.querySelector<HTMLButtonElement>("#admin-chat-lock")!;
  const chatLockInput = root.querySelector<HTMLInputElement>("#admin-chat-lock-text")!;
  const status = root.querySelector<HTMLParagraphElement>("#admin-status")!;
  const metrics = root.querySelector<HTMLElement>(".admin-metrics")!;
  const rows = root.querySelector<HTMLTableSectionElement>("#admin-character-rows")!;
  const systemList = root.querySelector<HTMLElement>("#admin-system-list")!;
  const backupList = root.querySelector<HTMLElement>("#admin-backup-list")!;
  const testDataList = root.querySelector<HTMLElement>("#admin-test-data-list")!;
  const onlineList = root.querySelector<HTMLElement>("#admin-online-list")!;
  const chatList = root.querySelector<HTMLElement>("#admin-chat-list")!;
  const actionList = root.querySelector<HTMLElement>("#admin-action-list")!;
  const announcementList = root.querySelector<HTMLElement>("#admin-announcement-list")!;
  const feedbackList = root.querySelector<HTMLElement>("#admin-feedback-list")!;
  const searchInput = root.querySelector<HTMLInputElement>("#admin-search")!;
  const classFilter = root.querySelector<HTMLSelectElement>("#admin-class-filter")!;
  let characters: AdminCharacter[] = [];
  let onlinePlayers: OnlinePlayer[] = [];
  let chatLogs: ChatLog[] = [];
  let actionLogs: AdminActionLog[] = [];
  let announcements: Announcement[] = [];
  let feedbackEntries: TestFeedback[] = [];
  let systemStatus: SystemStatus | undefined;
  let backups: BackupFile[] = [];
  let saveAudit: AdminSaveAudit | undefined;
  let testDataReport: TestDataReport | undefined;
  let classroomState: ClassroomState = {
    chatLocked: false,
    chatLockMessage: "課堂聊天已暫停，請聽老師說明。",
    mutedPlayers: []
  };

  tokenInput.value = window.localStorage.getItem(adminTokenStorageKey) ?? "";

  const setStatus = (message: string, kind: "idle" | "ok" | "error" = "idle") => {
    status.textContent = message;
    status.dataset.kind = kind;
  };

  const renderMetrics = (summary: AdminSummary | undefined) => {
    const values = [
      ["帳號", summary?.accounts ?? 0],
      ["角色", summary?.characters ?? 0],
      ["存檔槽", summary?.saveSlots ?? 0],
      ["有效登入", summary?.activeSessions ?? 0],
      ["回饋總數", summary?.betaFeedback?.total ?? 0],
      ["待處理回饋", summary?.betaFeedback?.open ?? 0],
      ["平均難度", summary?.betaFeedback?.averageDifficulty ?? 0]
    ];
    metrics.innerHTML = values
      .map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`)
      .join("");
  };

  const renderSystemStatus = () => {
    if (!systemStatus) {
      systemList.innerHTML = `<p>尚未讀取系統狀態。</p>`;
      return;
    }

    const items = [
      ["運行時間", formatDuration(systemStatus.uptimeSeconds)],
      ["記憶體", `${formatBytes(systemStatus.memory.heapUsed)} / ${formatBytes(systemStatus.memory.heapTotal)}`],
      ["線上玩家", String(systemStatus.onlinePlayers)],
      ["聊天鎖定", systemStatus.chatLocked ? "已鎖定" : "開放"],
      ["靜音人數", String(systemStatus.mutedPlayers)],
      ["Google 登入", systemStatus.googleAuthConfigured ? "已設定" : "未設定"],
      ["Google Client ID", systemStatus.googleClientConfigured ? "已設定" : "未設定"],
      ["Google 網域限制", systemStatus.googleHostedDomain || "未限制"],
      ["Auth CORS", systemStatus.authCorsOrigin || "*"],
      ["帳號綁定角色", String(saveAudit?.accountBoundCharacters ?? 0)],
      ["匿名測試角色", String(saveAudit?.guestCharacters ?? 0)],
      ["Smoke 測試角色", String(testDataReport?.smokeCharacters ?? 0)],
      ["Smoke 測試回饋", String(testDataReport?.smokeFeedback ?? 0)],
      ["資料庫", systemStatus.databasePath],
      ["備份目錄", systemStatus.backupDirectory]
    ];

    systemList.innerHTML = items
      .map(
        ([label, value]) => `
          <article>
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(value)}</span>
          </article>
        `
      )
      .join("");
  };

  const renderBackups = () => {
    backupList.innerHTML =
      backups
        .map(
          (backup) => `
            <article>
              <strong>${escapeHtml(backup.fileName)}</strong>
              <span>${formatBytes(backup.sizeBytes)}</span>
              <small>${new Date(backup.createdAt).toLocaleString("zh-TW")}</small>
            </article>
          `
        )
        .join("") || `<p>尚未建立資料庫備份。</p>`;
  };

  const renderTestDataReport = () => {
    if (!testDataReport) {
      testDataList.innerHTML = `<p>尚未讀取測試資料報表。</p>`;
      return;
    }

    const total =
      testDataReport.smokeCharacters +
      testDataReport.smokeFeedback +
      testDataReport.smokeChatLogs +
      testDataReport.smokeActionLogs +
      testDataReport.smokeAccountSaveSlots;
    const items = [
      ["Smoke 測試角色", testDataReport.smokeCharacters],
      ["Smoke 測試回饋", testDataReport.smokeFeedback],
      ["Smoke 聊天紀錄", testDataReport.smokeChatLogs],
      ["Smoke 管理紀錄", testDataReport.smokeActionLogs],
      ["Smoke 帳號存檔", testDataReport.smokeAccountSaveSlots]
    ];

    testDataList.innerHTML = `
      <article>
        <strong>${total > 0 ? "可清理測試資料" : "沒有 Smoke 測試資料"}</strong>
        <span>${total} 筆</span>
        <small>正式清理前會自動建立 SQLite 備份，且只處理 save slot 或測試名稱含 Smoke/smoke 的資料。</small>
      </article>
      ${items
        .map(
          ([label, value]) => `
            <article>
              <strong>${escapeHtml(String(label))}</strong>
              <span>${value} 筆</span>
            </article>
          `
        )
        .join("")}
    `;
  };

  const renderOnlinePlayers = () => {
    onlineList.innerHTML =
      onlinePlayers
        .map(
          (player) => `
            <article>
              <strong>${escapeHtml(player.name)}</strong>
              <span>${classLabels[player.className]} Lv.${player.level} · HP ${player.hp}/${player.maxHp}</span>
              <small>${player.authenticated ? "Google 已登入" : "Guest"} · ${player.muted ? "已靜音" : "可聊天"} · ${escapeHtml(formatSaveSlot(player.saveSlot ?? ""))}</small>
              <div class="admin-actions">
                <button type="button" data-action="mute" data-player-id="${escapeHtml(player.playerId)}">${player.muted ? "解除靜音" : "靜音"}</button>
                <button type="button" data-action="kick" data-player-id="${escapeHtml(player.playerId)}">踢出</button>
              </div>
            </article>
          `
        )
        .join("") || `<p>目前沒有線上玩家。</p>`;
  };

  const renderChatLogs = () => {
    chatList.innerHTML =
      chatLogs
        .map(
          (log) => `
            <article>
              <strong>${escapeHtml(log.playerName)}</strong>
              <span>${escapeHtml(log.text)}</span>
              <small>${escapeHtml(log.accountEmail ?? formatSaveSlot(log.saveSlot))} · ${new Date(log.sentAt).toLocaleString("zh-TW")}</small>
            </article>
          `
        )
        .join("") || `<p>目前沒有聊天紀錄。</p>`;
  };

  const renderActionLogs = () => {
    actionList.innerHTML =
      actionLogs
        .map(
          (log) => `
            <article>
              <strong>${escapeHtml(formatAction(log.action))}</strong>
              <span>${escapeHtml(log.targetPlayerName ?? "系統")} ${log.details ? `· ${escapeHtml(formatDetails(log.details))}` : ""}</span>
              <small>${new Date(log.createdAt).toLocaleString("zh-TW")}</small>
            </article>
          `
        )
        .join("") || `<p>目前沒有操作紀錄。</p>`;
  };

  const renderAnnouncements = () => {
    announcementList.innerHTML =
      announcements
        .map(
          (announcement) => `
            <article>
              <strong>${escapeHtml(announcement.text)}</strong>
              <span>${escapeHtml(announcementCategoryLabels[announcement.category] ?? announcement.category)} · 對象：${escapeHtml(announcement.audience)} · 送達 ${announcement.deliveredCount} 位線上玩家</span>
              <small>${new Date(announcement.createdAt).toLocaleString("zh-TW")}${announcement.expiresAt ? ` · 到期 ${new Date(announcement.expiresAt).toLocaleString("zh-TW")}` : " · 永久"}</small>
            </article>
          `
        )
        .join("") || `<p>目前沒有公告紀錄。</p>`;
  };

  const renderFeedback = () => {
    feedbackList.innerHTML =
      feedbackEntries
        .map(
          (entry) => `
            <article>
              <strong>${escapeHtml(entry.testerName)} · ${escapeHtml(entry.schoolName || "未填學校")} · ${escapeHtml(entry.classGroup)} · 難度 ${entry.difficulty}/5 · ${feedbackStatusLabels[entry.status]}</strong>
              <span>${escapeHtml(feedbackCategoryLabels[entry.feedbackCategory] ?? entry.feedbackCategory)} · ${escapeHtml(feedbackDeviceLabels[entry.deviceType] ?? entry.deviceType)} · ${entry.contactAllowed ? "可追問" : "不追問"}</span>
              <span>卡關點：${escapeHtml(entry.stuckPoint)}</span>
              <span>建議：${escapeHtml(entry.suggestion)}</span>
              <div class="admin-feedback-actions" data-feedback-id="${entry.id}">
                <select data-feedback-status>
                  ${(["open", "reviewing", "fixed", "deferred"] as const)
                    .map((status) => `<option value="${status}"${entry.status === status ? " selected" : ""}>${feedbackStatusLabels[status]}</option>`)
                    .join("")}
                </select>
                <input data-feedback-note type="text" maxlength="240" value="${escapeHtml(entry.adminNote)}" placeholder="處理備註" />
                <button type="button" data-feedback-update>更新</button>
              </div>
              <small>${escapeHtml(entry.playerName)} · ${escapeHtml(entry.mapId)} / ${escapeHtml(entry.currentZone || "未記錄區域")} · ${escapeHtml(entry.activeQuest || entry.chapterProgress)} · ${escapeHtml(entry.accountEmail ?? formatSaveSlot(entry.saveSlot))} · ${new Date(entry.submittedAt).toLocaleString("zh-TW")}</small>
            </article>
          `
        )
        .join("") || `<p>目前沒有測試回饋。</p>`;
  };

  const renderRows = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    const className = classFilter.value;
    const visible = characters.filter((character) => {
      const matchesClass = !className || character.className === className;
      const haystack = [
        character.characterName,
        character.accountEmail ?? "",
        character.hostedDomain ?? "",
        character.saveSlot
      ]
        .join(" ")
        .toLowerCase();
      return matchesClass && (!keyword || haystack.includes(keyword));
    });

    rows.innerHTML =
      visible
        .map(
          (character) => `
            <tr>
              <td>${escapeHtml(character.characterName)}</td>
              <td>${classLabels[character.className]}</td>
              <td>${character.level}</td>
              <td>${character.gold}</td>
              <td>${escapeHtml(character.accountEmail ?? character.hostedDomain ?? "未綁定")}</td>
              <td><code>${escapeHtml(formatSaveSlot(character.saveSlot))}</code></td>
              <td>${new Date(character.updatedAt).toLocaleString("zh-TW")}</td>
            </tr>
          `
        )
        .join("") || `<tr><td colspan="7">沒有符合條件的角色。</td></tr>`;
  };

  const getToken = () => tokenInput.value.trim();

  const withToken = (path: string) => {
    const token = getToken();
    if (!token) {
      throw new Error("請先輸入 ADMIN_TOKEN。");
    }

    window.localStorage.setItem(adminTokenStorageKey, token);
    return `${getAdminApiBase()}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
  };

  const fetchJson = async <T>(path: string): Promise<T> => {
    const response = await fetch(withToken(path));
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return (await response.json()) as T;
  };

  const refresh = async () => {
    setStatus("重新整理中...");
    refreshButton.disabled = true;
    try {
      const [
        summary,
        characterPayload,
        onlinePayload,
        chatPayload,
        actionPayload,
        announcementPayload,
        feedbackPayload,
        classroomPayload,
        systemPayload,
        backupPayload,
        saveAuditPayload,
        testDataPayload
      ] = await Promise.all([
        fetchJson<AdminSummary>("/admin/summary"),
        fetchJson<{ characters: AdminCharacter[] }>("/admin/characters?limit=500"),
        fetchJson<{ onlinePlayers: OnlinePlayer[] }>("/admin/online"),
        fetchJson<{ chatLogs: ChatLog[] }>("/admin/chat-logs?limit=80"),
        fetchJson<{ actionLogs: AdminActionLog[] }>("/admin/action-logs?limit=80"),
        fetchJson<{ announcements: Announcement[] }>("/admin/announcements?limit=30"),
        fetchJson<{ feedback: TestFeedback[] }>("/admin/feedback?limit=80"),
        fetchJson<ClassroomState>("/admin/classroom"),
        fetchJson<SystemStatus>("/admin/system"),
        fetchJson<{ backups: BackupFile[] }>("/admin/backups"),
        fetchJson<AdminSaveAudit>("/admin/save-audit"),
        fetchJson<{ report: TestDataReport }>("/admin/test-data")
      ]);
      characters = characterPayload.characters;
      onlinePlayers = onlinePayload.onlinePlayers;
      chatLogs = chatPayload.chatLogs;
      actionLogs = actionPayload.actionLogs;
      announcements = announcementPayload.announcements;
      feedbackEntries = feedbackPayload.feedback;
      classroomState = classroomPayload;
      systemStatus = systemPayload;
      backups = backupPayload.backups;
      saveAudit = saveAuditPayload;
      testDataReport = testDataPayload.report;
      chatLockInput.value = classroomState.chatLockMessage;
      chatLockButton.textContent = classroomState.chatLocked ? "解除聊天鎖定" : "鎖定聊天";
      renderMetrics(summary);
      renderSystemStatus();
      renderBackups();
      renderTestDataReport();
      renderOnlinePlayers();
      renderChatLogs();
      renderActionLogs();
      renderAnnouncements();
      renderFeedback();
      renderRows();
      setStatus(`重新整理完成：${characters.length} 位角色，${onlinePlayers.length} 位玩家在線。`, "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : "重新整理失敗。";
      renderMetrics(undefined);
      characters = [];
      onlinePlayers = [];
      chatLogs = [];
      actionLogs = [];
      announcements = [];
      feedbackEntries = [];
      systemStatus = undefined;
      backups = [];
      saveAudit = undefined;
      testDataReport = undefined;
      renderSystemStatus();
      renderBackups();
      renderTestDataReport();
      renderOnlinePlayers();
      renderChatLogs();
      renderActionLogs();
      renderAnnouncements();
      renderFeedback();
      renderRows();
      setStatus(message, "error");
    } finally {
      refreshButton.disabled = false;
    }
  };

  const downloadCsv = (path: string) => {
    try {
      window.location.href = withToken(path);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "下載失敗。", "error");
    }
  };

  const sendBroadcast = async () => {
    const text = broadcastInput.value.trim();
    if (!text) {
      setStatus("請先輸入公告內容。", "error");
      return;
    }

    try {
      const response = await fetch(withToken("/admin/broadcast"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          category: broadcastCategory.value,
          ttlMinutes: Number.parseInt(broadcastTtl.value, 10)
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      broadcastInput.value = "";
      setStatus("公告已送出。", "ok");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "公告送出失敗。", "error");
    }
  };

  const updateClassroomChatLock = async () => {
    try {
      const response = await fetch(withToken("/admin/classroom"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatLocked: !classroomState.chatLocked,
          chatLockMessage: chatLockInput.value.trim() || classroomState.chatLockMessage
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      classroomState = (await response.json()) as ClassroomState;
      chatLockButton.textContent = classroomState.chatLocked ? "解除聊天鎖定" : "鎖定聊天";
      setStatus(classroomState.chatLocked ? "已鎖定全班聊天。" : "已解除全班聊天鎖定。", "ok");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "聊天控制失敗。", "error");
    }
  };

  const createBackup = async () => {
    backupButton.disabled = true;
    try {
      const response = await fetch(withToken("/admin/backups"), {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload = (await response.json()) as { backups: BackupFile[] };
      backups = payload.backups;
      renderBackups();
      setStatus("資料庫備份已建立。", "ok");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "建立備份失敗。", "error");
    } finally {
      backupButton.disabled = false;
    }
  };

  const cleanupTestData = async (dryRun: boolean) => {
    const confirmText = testDataConfirmInput.value.trim();
    if (!dryRun && confirmText !== "DELETE_SMOKE_TEST_DATA") {
      setStatus("請先輸入 DELETE_SMOKE_TEST_DATA 才能清理 Smoke 測試資料。", "error");
      return;
    }

    if (!dryRun && !window.confirm("確定要清理 Smoke 測試資料嗎？系統會先建立備份，但這個操作仍會刪除測試資料。")) {
      return;
    }

    testDataDryRunButton.disabled = true;
    testDataCleanupButton.disabled = true;
    try {
      const response = await fetch(withToken("/admin/test-data/cleanup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun,
          confirmText
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as TestDataCleanupResponse;
      testDataReport = payload.deleted ?? payload.report;
      if (payload.backup) {
        backups = [payload.backup, ...backups.filter((backup) => backup.fileName !== payload.backup?.fileName)];
      }
      renderTestDataReport();
      renderBackups();
      setStatus(dryRun ? "已完成 dry-run 預覽，尚未刪除任何資料。" : "Smoke 測試資料已清理，並已建立備份。", "ok");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "測試資料清理失敗。", "error");
    } finally {
      testDataDryRunButton.disabled = false;
      testDataCleanupButton.disabled = false;
    }
  };

  const moderatePlayer = async (playerId: string, action: string) => {
    try {
      const player = onlinePlayers.find((candidate) => candidate.playerId === playerId);
      const path = action === "kick" ? "/admin/kick" : "/admin/mute";
      const body =
        action === "kick"
          ? { playerId, reason: "教師將玩家請離線，請重新登入。" }
          : {
              playerId,
              muted: !player?.muted,
              reason: "教師暫停此玩家聊天。"
            };
      const response = await fetch(withToken(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setStatus(action === "kick" ? "已踢出玩家。" : "已更新靜音狀態。", "ok");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "玩家控管失敗。", "error");
    }
  };

  const updateFeedbackStatus = async (container: HTMLElement) => {
    const id = Number.parseInt(container.dataset.feedbackId ?? "", 10);
    const statusSelect = container.querySelector<HTMLSelectElement>("[data-feedback-status]");
    const noteInput = container.querySelector<HTMLInputElement>("[data-feedback-note]");
    if (!Number.isFinite(id) || !statusSelect || !noteInput) {
      setStatus("找不到要更新的回饋資料。", "error");
      return;
    }

    try {
      const response = await fetch(withToken("/admin/feedback/status"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: statusSelect.value,
          adminNote: noteInput.value.trim()
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setStatus("回饋狀態已更新。", "ok");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "回饋狀態更新失敗。", "error");
    }
  };

  refreshButton.addEventListener("click", () => void refresh());
  downloadButton.addEventListener("click", () => downloadCsv("/admin/characters.csv"));
  chatDownloadButton.addEventListener("click", () => downloadCsv("/admin/chat-logs.csv"));
  actionDownloadButton.addEventListener("click", () => downloadCsv("/admin/action-logs.csv"));
  announcementDownloadButton.addEventListener("click", () => downloadCsv("/admin/announcements.csv"));
  feedbackDownloadButton.addEventListener("click", () => downloadCsv("/admin/feedback.csv"));
  backupButton.addEventListener("click", () => void createBackup());
  testDataDryRunButton.addEventListener("click", () => void cleanupTestData(true));
  testDataCleanupButton.addEventListener("click", () => void cleanupTestData(false));
  broadcastButton.addEventListener("click", () => void sendBroadcast());
  chatLockButton.addEventListener("click", () => void updateClassroomChatLock());
  onlineList.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
    if (!button) {
      return;
    }

    void moderatePlayer(button.dataset.playerId ?? "", button.dataset.action ?? "");
  });
  feedbackList.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-feedback-update]");
    if (!button) {
      return;
    }

    const container = button.closest<HTMLElement>("[data-feedback-id]");
    if (container) {
      void updateFeedbackStatus(container);
    }
  });
  searchInput.addEventListener("input", renderRows);
  classFilter.addEventListener("change", renderRows);
  renderMetrics(undefined);
  renderSystemStatus();
  renderBackups();
  renderTestDataReport();
  renderOnlinePlayers();
  renderChatLogs();
  renderActionLogs();
  renderAnnouncements();
  renderFeedback();
  renderRows();
}

function getAdminApiBase() {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || window.location.port === "5173" || window.location.port === "5174") {
    return `http://${host}:8787`;
  }

  return window.location.origin;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char] ?? char;
  });
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    broadcast: "公告廣播",
    classroom_chat_lock: "鎖定全班聊天",
    classroom_chat_unlock: "解除全班聊天鎖定",
    mute_player: "靜音玩家",
    unmute_player: "解除靜音",
    kick_player: "踢出玩家",
    database_backup: "建立資料庫備份",
    cleanup_smoke_test_data: "清理 Smoke 測試資料"
  };
  return labels[action] ?? action;
}

function formatDetails(details: string) {
  try {
    const parsed = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" / ");
  } catch {
    return details;
  }
}

function formatDuration(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) {
    return `${days} 天 ${hours} 小時`;
  }
  if (hours > 0) {
    return `${hours} 小時 ${minutes} 分`;
  }
  return `${minutes} 分`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatSaveSlot(saveSlot: string) {
  if (!saveSlot) {
    return "未綁定";
  }

  return saveSlot.length <= 18 ? saveSlot : `${saveSlot.slice(0, 10)}...${saveSlot.slice(-6)}`;
}
