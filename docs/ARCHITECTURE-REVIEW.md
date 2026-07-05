# 架構深度審查報告(v0.1 → beta)

> 審查日期:2026-07-05。審查範圍:`shared/src/index.ts`(2262 行)、`server/src/index.ts`(3041 行)、`server/src/persistence.ts`(1321 行)、`client/src/scenes/GameScene.ts`(5291 行)、`server/src/googleAuth.ts`、`client/src/game/googleIdentity.ts`、`scripts/*.mjs`、`docs/SPEC.md`。
> 本文件是給後續執行模型(Opus/Sonnet)照做的耐久文件:每個結論標明「檔案:行號」證據或標註「推論」。行號以撰寫當下的 commit(`dc9e5c0`)為準,程式碼演進後請以符號名(函式名)重新定位。
>
> 邊界提醒:守 SPEC Non-Goals(不加金流/PvP/拍賣場);runtime SQLite DB 與備份不進版控。

## 總覽:風險排序(先看這張表)

| # | 問題 | 嚴重度 | 修的時機 | 詳見 |
|---|------|--------|----------|------|
| 1 | 全量快照 15Hz × 事件疊加廣播,O(N²) 序列化 | **高**(30 人可能撐住、50 人先爆這裡) | 現在 | §1 |
| 2 | 每次擊殺/拾取同步寫 SQLite(全刪全插 27 筆任務列) | **高**(與 #1 疊加造成 tick 卡頓) | 現在 | §3.1 |
| 3 | 存檔不含 mapId,重連永遠回預設圖但沿用他圖座標 | **高**(實際資料錯誤,玩家會卡出生點) | 現在 | §3.2 |
| 4 | WAL 模式下備份只 copy 主檔,可能缺最近交易 | 中高 | 現在(改法便宜) | §3.3 |
| 5 | client 完全權威移動、訊息無 runtime 驗證 | 中(課堂 LAN 可容忍,公開前必修) | beta 前 | §1.4 |
| 6 | 職業數值/名稱正規化在 client/server 各存一份 | 中(平衡調整時必漂移) | 現在(便宜) | §2 |
| 7 | GameScene 5291 行巨石 | 中(每加一章成本遞增) | 加第 6 章內容前 | §4 |
| 8 | smoke 完全沒覆蓋「存檔往返」與「廣播量」 | 中高(正是最容易默默壞的兩處) | 現在 | §6 |

---

## 1. 同步架構體檢

### 1.1 現況:15Hz 全量快照,無差量

- 世界 tick 以 15Hz 跑:`setInterval(tickWorld, 1000 / 15)`(server/src/index.ts:3024),`tickWorld` 每次收尾呼叫 `broadcastWorldSnapshots()`(server/src/index.ts:1632)。
- `sendWorldSnapshot`(server/src/index.ts:1569-1582)對**每個玩家**送出其所在地圖的**全部**玩家、怪物、掉落物陣列(`world:snapshot`,shared/src/index.ts:2137-2142)。沒有差量(delta)機制;`PlayerSnapshot.updatedAt` / `MonsterSnapshot.updatedAt`(shared/src/index.ts:38、88)存在但沒有任何地方拿來做增量過濾(推論:是預留欄位)。
- 每個接收者各自重算與重序列化:`getMapPlayers`/`getMapMonsters`/`getMapItemDrops`(server/src/index.ts:1557-1567)對每個接收者都 filter 一次整個 Map,`send()`(server/src/index.ts:1525-1527)對每個接收者各自 `JSON.stringify`。同地圖 N 人時,每 tick 是 **O(N²) 的過濾 + O(N²) 的序列化**。

### 1.2 事件疊加:全量廣播不只 15Hz

`snapshot()`(server/src/index.ts:1590-1593)= 重生檢查 + **再一次全服全量廣播**,被掛在幾乎每個遊戲事件上:

- 每次攻擊命中:server/src/index.ts:2776(命中後 `snapshot()`),技能落空也廣播(:2783)
- 拾取::2115;用藥::2160;換裝::2194;交任務::2572;買東西::2610
- 連線::2859;斷線::3020;傳送門與回城直接呼叫 `broadcastWorldSnapshots()`(:2267、:2312)

也就是說 30 人同時打怪時,實際全量廣播頻率是「15Hz + 每秒全服命中次數」。30 人每人每秒 1-2 次攻擊 ≈ 額外 30-60 次全量廣播/秒,每次都是 O(N²) 序列化。**這是最先爆的點**(CPU,單執行緒 Node),比頻寬更早。(推論,建議用 §6.3 的量測腳本驗證)

### 1.3 傳輸量估算(推論,附計算方式)

單個 `PlayerSnapshot` JSON 約 400 bytes(19 個欄位,shared/src/index.ts:19-39);每張圖 4-7 隻怪(shared/src/index.ts 各地圖 `monsterSpawns`)約 1KB。

| 同地圖人數 | 每 client 每 tick | 每 client 每秒(僅 15Hz,不含事件) | 全伺服器出口 |
|-----------|------------------|----------------------------------|--------------|
| 10 | ~5KB | ~75KB/s | ~0.75MB/s |
| 30 | ~13KB | ~195KB/s | ~5.9MB/s ≈ 47Mbps |
| 50 | ~21KB | ~315KB/s | ~15.8MB/s ≈ 126Mbps |

30 人已吃掉半條百兆校園 LAN;50 人超過。加上 1.2 的事件疊加,實際流量還要乘 2-4 倍。SPEC 的「50+ 需 profiling 與保守廣播頻率」(docs/SPEC.md:47)在目前架構下不成立——不是調頻率就好,是廣播模型要改。

另外三個小刀:

- `player:damaged`、`player:respawn`、`player:level-up`、`chat:message`、`player:left` 全用 `broadcast()` 送給**全服所有人**,不分地圖(server/src/index.ts:1814、1746、1855、2994、3019)。
- `tickPlayerHazards` 對每個玩家每 tick 做 `[...monsters.values()].find(...)`(server/src/index.ts:1766)——每 tick 每玩家配置一個新陣列;`tickMonsterPatrols` 每 tick 呼叫 `getAllMonsterSpawns()` 做 `flatMap`(:1678、:1545-1547)也是每 tick 重新配置。10 人無感,50 人 × 15Hz 就是 GC 壓力。
- 沒有心跳/逾時:斷線只靠 TCP 偵測,殭屍連線期間仍佔用廣播迴圈(`ws.readyState` 檢查只擋 OPEN,server/src/index.ts:1531、1539)。

### 1.4 client 權威移動,無驗證

`player:update` 處理(server/src/index.ts:2870-2907)直接接受 client 傳來的 `x`、`y`、`facing`、`animation`,沒有速度/邊界/型別檢查(`JSON.parse(...) as ClientMessage`,:2865,是型別斷言不是驗證)。後果:

- 瞬移/穿牆/飛天皆可(課堂環境可容忍,但學生會玩出來)。
- 惡意 payload 可寫入 `NaN` 座標,污染快照與存檔(characters 表的 x/y 是 REAL,persistence.ts:369-370,NaN 會存成 NULL 或壞值;推論,未實測)。
- 同一訊息還允許改 `className`(:2881-2886)——遊戲中免費轉職保留等級,是設計漏洞。

client 端 `sendPlayerUpdate` 以 20Hz 節流(client/src/scenes/GameScene.ts:3320-3322),高於 server tick 的 15Hz;上行約 20 msg/s × 200B = 4KB/s/人,30 人 120KB/s,上行不是瓶頸(推論)。

### 1.5 建議(給執行者)

**改動 A:事件不再觸發全量廣播(最便宜、收益最大,先做)**

1. 把 `handleAttack`/`handleItemPickup`/`handleUseItem`/`handleEquipItem`/`handleNpcInteract`/`handleShopBuy` 內的 `snapshot()` 呼叫全部移除(位置見 §1.2)。這些事件已各自有精準訊息(`combat:hit`、`inventory:update`、`quest:update`…),世界狀態變化(怪物 HP、掉落物)交給下一個 15Hz tick 送即可,最多晚 66ms,玩家無感。
2. `handlePortalEnter`/`handleReturnSafe`/連線/斷線保留即時廣播(玩家出現/消失需要立即),但可改成只廣播到**相關地圖**。
3. 驗收:`npm run typecheck && npm run smoke && npm run smoke:multi` 通過;實際 `npm run dev` 開兩個瀏覽器,打怪、拾取、買賣、傳圖,確認雙方畫面同步無倒退。

**改動 B:per-map 序列化一次(把 O(N²) 降到 O(N))**

1. 改寫 `broadcastWorldSnapshots`(server/src/index.ts:1584-1588):先按 `mapId` 分組玩家一次,對每張有人存在的地圖 `JSON.stringify` **一次**快照字串,再送給該圖所有 socket。注意 `world:snapshot` 對同圖玩家內容完全相同(訊息裡沒有 per-receiver 欄位,shared/src/index.ts:2137-2142),可以直接共用字串。
2. `player:damaged` 等 `broadcast()` 呼叫改成 map-scoped(新增 `broadcastToMap(mapId, message)`);`chat:message` 依產品決定全服或同圖(課堂用途建議保留全服)。
3. 驗收:同上,另加 §6.3 的廣播量煙霧測試,確認 bytes/client/s 在 10 人模擬下低於閾值。

**改動 C(可延後到 50 人目標前):差量快照**

利用既有 `updatedAt` 欄位,每 tick 只送上次 tick 之後有變動的實體 + 週期性(如每 2 秒)全量校正。這是大改,等 A/B 做完、量測仍不夠時再動。加欄位演進方式見 §2.3。

**改動 D:最低限度輸入驗證**

在 `ws.on("message")` 入口(server/src/index.ts:2861-3001)加一層輕量 guard:`Number.isFinite(x/y)`、座標 clamp 到 `getGameMap(current.mapId)` 的寬高、每 tick 最大位移(如 `moveSpeed * dt * 1.5`)、拒絕遊戲中 `className` 變更(只允許 hp 滿血且在出生點時換,或干脆只在連線時定案)。不需要引入 zod,手寫 guard 就夠(推論:訊息型別只有 11 種)。

---

## 2. shared 契約健康度

### 2.1 做得好的部分(據實陳述,不是稱讚)

- 訊息協定是唯一來源:`ClientMessage`/`ServerMessage` discriminated union(shared/src/index.ts:2079-2126、2128-2262),client/server 都從 `@penglai/shared` 匯入(server/src/index.ts:6-30;client/src/scenes/GameScene.ts:2-25),沒有重複定義訊息格式。
- 地圖、任務、物品、技能資料表全在 shared(shared/src/index.ts:174-2072),兩端讀同一份。

### 2.2 漂移風險點(按嚴重度)

1. **職業基礎數值只存在 server**:`classConfigs`(server/src/index.ts:142-193)定義 maxHp/maxMp/回魔/攻防加成/普攻距離,而 client 在 `characterClassOptions` 硬編碼描述文字「生命 115 / 法力 36」(client/src/scenes/GameScene.ts:110-125),另有 `fallbackPlayerMp`(client/src/game/clientConfig.ts,由 GameScene.ts:104 引用)。下次平衡調整幾乎必然只改 server,UI 文案默默說謊。**修法**:把 `classConfigs` 搬進 shared 匯出(命名如 `CLASS_CONFIGS`),client 描述文字改為由數值產生。改動小,現在做。
2. **名稱/存檔碼正規化兩份實作**:server `normalizePlayerName`(server/src/index.ts:218-220)vs client `normalizeCharacterName`(GameScene.ts:995-998);server `normalizeSaveSlot`(server/src/index.ts:307-310)vs client `normalizeSaveSlotCode`(GameScene.ts:2937-2941,註解自己承認「Match the server's rules」——這就是漂移警訊)。**修法**:兩個函式下沉 shared,兩端共用。
3. `SavedCharacter`/`SavedGame`(server/src/persistence.ts:17-50)目前是 server 內部型別,尚可接受;但若要做真正的存檔資料匯出(見 §3.4),這組型別就得進 shared 成為對外契約。

### 2.3 訊息演進性

- **加欄位不會破舊 client**:JSON 寬鬆解析 + client 的 message handler 是 if-chain,未知 `type` 直接落到函式尾安全忽略(GameScene.ts:2547-2708)。server 端同樣(server/src/index.ts:2870-3000)。加 optional 欄位、加新訊息型別都安全。
- **缺 protocolVersion**:`session:welcome`(shared/src/index.ts:2129-2135)沒有版本欄位。課堂場景 client 是老師發的 URL,版本偏差視窗小,但一旦改欄位語意(而非加欄位)就沒有任何偵測手段。**修法**:在 shared 定義 `export const PROTOCOL_VERSION = 1`,`session:welcome` 帶上,client 不符時顯示「請重新整理」。五行改動,現在做。
- **無 runtime 驗證**:見 §1.4 改動 D,shared 可以放手寫的 `isClientMessage()` guard 供 server 用。

---

## 3. 存檔與資料完整性

### 3.1 寫入放大:每個遊戲事件一次全量存檔

`savePlayerGame`(server/src/index.ts:1510-1523)→ `saveGame`(server/src/persistence.ts:605-696)做的是:upsert 角色 + **DELETE 全部 inventory 再全插** + DELETE 裝備再插 2 筆 + **DELETE 全部任務再插 27 筆**(`QUEST_DEFINITIONS` 共 27 個,shared/src/index.ts:929-957;`createInitialQuests` 把全部任務塞進每個玩家的 Map,server/src/index.ts:246-258,所以每次存檔都寫 27 列)。

呼叫點:每次擊殺(server/src/index.ts:2762)、每次拾取(:2114)、每次用藥(:2159)、每個任務進度 tick(:2637、:2665)、換圖(:2266)……而 `DatabaseSync`(node:sqlite,server/src/persistence.ts:354)是**同步 API,在主執行緒上執行**,存檔期間整個 world tick 和所有 WebSocket 處理都停住。

30 人打怪,每秒約 10-30 次 saveGame,每次 30+ 條 SQL。單次很快(WAL + 本機 SSD,推論 <2ms),但它和 §1.2 的事件廣播疊在同一個事件迴圈裡,是 tick 抖動的第二來源。

**修法(給執行者)**:

1. 改成 dirty-flag + 週期 flush:事件只標記 `dirtyPlayers.add(playerId)`,每 5 秒(或每 75 個 tick)flush 一次;`ws.on("close")`(server/src/index.ts:3003-3004)與 process 收到 SIGINT 時強制 flush 全部。最壞情況掉 5 秒進度,課堂可接受(若不可接受,交任務/升級/購買這三種「玩家有感」事件保留立即存)。
2. 任務只存非 available 狀態的列(loadGame 端 `createQuestsFromSave` 本來就以 available 為底再覆蓋,server/src/index.ts:260-276,少存的列不影響正確性)。27 列 → 通常 <8 列。
3. 驗收:`npm run smoke:quest-lock`、`npm run smoke:multi` 通過;手動兩瀏覽器打怪後斷線重連,等級/金幣/背包/任務進度不倒退。

### 3.2 實際 bug:mapId 不入檔,座標卻入檔

- `characters` 表沒有 `map_id` 欄位(server/src/persistence.ts:359-373),`SavedCharacter` 也沒有(:17-29)。
- 連線時 `mapId` 硬設為 `DEFAULT_GAME_MAP.id`,但 `x`/`y` 用存檔值(server/src/index.ts:2823-2825)。

後果:玩家在星砂觀測台(寬 2800,shared/src/index.ts:1893)x=2700 處下線,重連會出現在霧港試煉場(寬 2400)的 x=2700——**超出地圖邊界**。就算沒超界,也會落在非出生點的怪區。這是「看起來對其實沒對」的典型:單人測試都在第一張圖,永遠遇不到。

**修法**:`addColumnIfMissing("characters", "map_id", "TEXT NOT NULL DEFAULT 'fog-harbor-test'")`(遷移機制已存在,server/src/persistence.ts:483-489);`saveGame` 寫入 `data.player.mapId`;連線時 `mapId: savedCharacter?.mapId ?? DEFAULT_GAME_MAP.id`,並用 `getGameMap()` 驗證後 clamp 座標到該圖範圍。驗收:見 §6.2 的存檔往返煙霧測試(此測試會先抓到現在的 bug)。

### 3.3 備份在 WAL 模式下不完整

- DB 開啟即 `PRAGMA journal_mode = WAL`(server/src/persistence.ts:357)。
- 線上備份 `createSqliteBackup` 用 `copyFileSync` 只複製主檔(server/src/index.ts:830-848);`scripts/backup-sqlite.mjs:17` 同樣只 `copyFile` 主檔。

WAL 模式下,已 COMMIT 但尚未 checkpoint 的交易存在 `-wal` 檔裡;只複製主檔的備份會**缺少最近的寫入**,且在複製瞬間與 checkpoint 併發時有拿到不一致頁面的風險(推論:node:sqlite 的 copyFileSync 不持有 DB 鎖)。

**修法**:改用 `db.exec("VACUUM INTO '<target>'")` 產生備份(原子、含 WAL 內容、單檔),`createSqliteBackup` 與 `scripts/backup-sqlite.mjs` 都改(後者需自行開 DB 或改為呼叫 admin API)。驗收:備份後用 `node -e` 開備份檔跑 `PRAGMA integrity_check` 並比對 `SELECT COUNT(*) FROM characters` 與現庫一致(在無寫入視窗下)。

### 3.4 「export/import」的實際語義要說清楚

client 的 Y 複製 / X 匯入(GameScene.ts:2922-2968)複製的是**存檔槽代碼**,不是存檔資料。資料仍只存在 server 的 SQLite。這代表:

- 跨瀏覽器/裝置還原:✅(只要連同一台 server)
- server DB 損毀/重灌後還原:❌(代碼無用)——CLAUDE.md 所稱「離線韌性」目前只有前者。

不算 bug,但文件與 UI 文案(「複製存檔碼備份」,GameScene.ts:1127)容易讓人誤以為資料有備份。若要真的資料級匯出,做法是新增 `/save/export?slot=` 回傳 JSON(型別放 shared,見 §2.2 第 3 點)+ import 端點做 schema 驗證——這是 beta 後的選配,不急。

### 3.5 併發與其他

- **同 slot 雙連線**:兩個瀏覽器用同一存檔碼同時連線,會產生兩個 playerId 各自 `savePlayerGame` 同一 slot,last-writer-wins 互相覆寫(推論自 server/src/index.ts:2796-2859 無任何 slot 佔用檢查)。學生分享存檔碼時**必然發生**。修法:連線時檢查 `playerSaveSlots` 值集合,若 slot 已在線,踢掉舊連線或拒絕新連線(建議前者,並發 `chat:notice` 說明)。
- 單筆 `saveGame` 有交易包覆與 ROLLBACK(persistence.ts:606-695),崩潰時單筆原子性 OK。
- `chat_logs`、`admin_action_logs` 無限成長,無 TTL 清理(persistence.ts:1035-1042、1074-1087);`auth_sessions` 過期列也不清(只在讀取時過濾,:873)。低優先,放技術債清單。

---

## 4. GameScene.ts 巨石拆解

### 4.1 現況

5291 行、~150 個方法,混了至少 9 種職責:標題畫面與角色創建(GameScene.ts:315-1136)、Google 登入與 session 管理(:505-556、745-914、2747-2811)、DOM 回饋表單(:561-743)、存檔槽管理(:2813-3013)、WebSocket 連線與訊息分派(:2534-2745)、地圖渲染與地標(:1626-2242)、HUD 與 8 個面板(:2243-2493、3817-4337、4719 起)、遠端實體同步(:3015-3319)、戰鬥特效(:3572-3815)、任務導引/章節邏輯(:4227-4954)。

`update()` 一個方法 220 行,平鋪 30 個按鍵判斷(:1138-1361)。標題/遊戲兩個狀態靠 `gameStarted` 布林手動閘門(:240、:1143),而不是 Phaser 的多 Scene。

### 4.2 拆法:按職責拆模組,不是按場景拆

建議目標結構(client/src/ 下;`game/` 裡已有 audioManager、uiPanel、uiTheme、assetManifest、viewTypes 等先例,沿用同模式):

| 新模組 | 搬入內容(現行行號) | 依賴方向 |
|--------|--------------------|----------|
| `net/GameSocket.ts` | connect/getWsUrl/訊息分派(2534-2745),對外暴露 typed callbacks(`onSnapshot`、`onQuestUpdate`…) | 只依賴 shared |
| `auth/AuthService.ts` | Google 登入、session localStorage、refreshAuthSession(505-556、745-914、2747-2811)+ googleIdentity.ts | 純 DOM/fetch,零 Phaser |
| `save/SaveSlotStore.ts` | 槽位 get/set/import/copy/previous(2813-3013)與 characterDrafts(1033-1077) | 純 localStorage,零 Phaser |
| `world/MapRenderer.ts` | rebuildMap/背景/地標/平台/章節世界狀態(1626-2242) | Phaser + shared |
| `world/RemoteEntityLayer.ts` | applySnapshot 與 monster/drop view 生命週期(3015-3319) | Phaser + shared |
| `combat/CombatVfx.ts` | flashHitbox/showDamage/showMiss 等(3572-3815) | Phaser |
| `ui/HudLayer.ts` + `ui/panels/*` | addHud 與各 update*Panel(2243-2493、3817-4337、4719-5291) | Phaser |
| `scenes/TitleScene.ts` | 標題畫面獨立成 Phaser Scene(315-1136),`gameStarted` 閘門刪除 | — |
| **shared 下沉** | 任務導引的純函式:getQuestTargetMapId(4827)、getChapterQuestIds(4386)、任務狀態優先序(4526)、isQuestUnlocked(4541,對應 server 的 areQuestPrerequisitesMet,server/src/index.ts:2365-2367——**這對已經重複實作了**) | 零依賴 |

拆完 GameScene 剩:輸入處理、模組編排、本地玩家物理。估 800-1200 行(推論)。

### 4.3 現在拆 vs 之後拆

- **現在拆的成本**:機械性搬移為主,風險在 Phaser 生命週期(scene restart 時的清理,現在靠 `restartForSaveSlot` 的 `scene.restart()`,GameScene.ts:2901-2911,拆錯會留下殭屍 DOM/監聽器)。有 typecheck + smoke 護欄,但**沒有 client 端的自動化測試**,拆完要人工過一輪全流程。
- **之後拆的成本**:章節內容是「每加一章,改 5+ 個 switch/if 站點」的複製模式——`getChapterQuestIds`(4386)、`getInteractableDoneLabel`(4073)、`getInteractablePendingLabel`(4093)、`getQuestTargetMapId`(4827)、`getItemSourceMonsterKind`(4895)、`getMonsterTargetX`(4891)每個都按章節/怪種手寫分支。第 6 章、第 7 章加進來,巨石只會更難拆,且每章都在加重「client 章節邏輯 vs server 任務邏輯」的重複面(前置任務檢查已經重複,見 4.2 表末)。
- **判斷**:不必立刻全拆。**最小必拆三件**(在加新章節之前做):① `net/GameSocket.ts`(它是 §1 廣播改動的 client 對口,拆了才好演進協定);② 任務導引純函式下沉 shared(消掉已存在的重複);③ TitleScene 分離(消掉 gameStarted 閘門)。其餘 UI/VFX 拆分可以隨後續改動順手做。
- 驗收:每拆一個模組跑 `npm run typecheck && npm --workspace client run build && npm run smoke:multi`,然後 `npm run dev` 人工走:標題→登入→進遊戲→打怪→傳圖→斷線重連→回標題。

---

## 5. 技術債清單(v0.1 → beta,「現在修便宜、拖了變貴」排序)

1. **事件觸發的全量廣播移除**(§1.5 改動 A)——半天工作量,直接把可支撐人數翻倍(推論);拖越久,越多新事件 handler 有樣學樣呼叫 `snapshot()`。
2. **mapId 入檔 + 座標 clamp**(§3.2)——一小時工作量;拖到玩家資料變多後,壞存檔清理成本遠高於現在。
3. **存檔 debounce**(§3.1)——半天;與 #1 疊加解掉 tick 抖動。
4. **備份改 VACUUM INTO**(§3.3)——一小時;等到真的需要從備份還原那天才發現缺資料,就太遲了。
5. **classConfigs / 名稱正規化下沉 shared + PROTOCOL_VERSION**(§2.2、§2.3)——半天;每多一次平衡調整,漂移機率累積一次。
6. **per-map 廣播 + 序列化共用**(§1.5 改動 B)——一天;在 30 人實測前完成。
7. **輸入驗證 guard + 禁止遊戲中轉職**(§1.4 改動 D)——半天;公開測試(非課堂)前必做。
8. **同 slot 雙連線互踢**(§3.5)——半天;學生分享存檔碼前做。
9. **GameScene 最小三拆**(§4.3)——2-3 天;加第 6 章內容前做。
10. 低優先:chat_logs/action_logs TTL 清理、auth_sessions 過期清除、心跳/殭屍連線回收、差量快照(§1.5 改動 C)。

不建議現在做的:換 binary 協定(msgpack 等)、換 PostgreSQL、伺服器端完整物理模擬——都是 50+ 人或公開部署才需要,SPEC 也明說 SQLite first(docs/SPEC.md:32)。

## 6. 驗收缺口與建議補檢

### 6.1 現況盤點

現有 smoke(scripts/)覆蓋:HTTP/admin 端點狀態碼(smoke.mjs:48-153)、WS welcome、多人快照有收到 + 聊天廣播(multiplayer-smoke.mjs:91-99)、各章節任務流程(warehouse/cavern/archive/observatory/quest-lock/interactable smoke)、UI 文案侵權(audit-ui-text.mjs)、必要檔案存在(beta-v02-check.mjs:4-17)。注意:所有 smoke 都假設 server 已在 localhost:8787 跑著(smoke.mjs:3-4),`check:beta` 不會自己起 server。

**沒有覆蓋、但最容易默默壞的**:存檔往返、廣播量、備份完整性——正是 CLAUDE.md 點名的「看起來對其實沒對」區。

### 6.2 建議新增:`smoke:save-roundtrip`(最高優先)

新檔 `scripts/save-roundtrip-smoke.mjs`,流程:

1. 用唯一 slot 連線(`?slot=save-smoke-<timestamp>`),收 welcome。
2. 送 `player:update` 移動到怪區,送 `combat:attack` 直到收到 `combat:hit` 且 `defeated: true`,記下 exp/gold/背包(從 `inventory:update` 與 `world:snapshot` 讀)。
3. 送 `portal:enter` 換圖,收 `map:change`,記下 mapId 與座標。
4. 斷線,重連同 slot。
5. 斷言:等級/exp/gold/背包/任務進度與斷線前一致;**mapId 與座標為斷線前所在圖**(此斷言目前會失敗,見 §3.2——先修 bug 再上測試,或先以 `KNOWN_FAIL` 註記)。
6. 加入 `check:beta` 鏈。

### 6.3 建議新增:`smoke:broadcast-budget`

新檔 `scripts/broadcast-budget-smoke.mjs`:起 10 個 WS client 於同地圖,持續送 20Hz `player:update` 並每秒 1 次 `combat:attack`,量測 30 秒內每 client 收到的 bytes 與訊息數,斷言 `bytes/client/s` 低於閾值(初值建議取當前實測 × 1.3,之後隨 §1.5 改動收緊)。這是防止「隨手加一個 snapshot() 呼叫」的迴歸護欄——目前這種迴歸完全不可見。

### 6.4 建議新增:備份完整性檢查

`scripts/backup-sqlite.mjs` 改完 VACUUM INTO 後,尾端加:開備份檔 → `PRAGMA integrity_check` → `SELECT COUNT(*) FROM characters` 非負且與來源一致。順手在 `smoke.mjs` 的 `/admin/backups` POST 後(smoke.mjs:106-108)驗證回傳的備份檔案 sizeBytes > 0。

### 6.5 建議新增:惡意輸入 fuzz(做完 §1.4 改動 D 後)

在 `smoke.mjs` 加一段:送 `player:update` 帶 `x: NaN`、`x: 1e9`、`name: <4KB 字串>`、未知 `type`,斷言 server 不 crash(後續 `/health` 仍 200)且下一個 `world:snapshot` 的座標是有限數。

### 6.6 建議新增:同 slot 雙連線測試(做完 §3.5 互踢後)

兩個 client 同 slot 連線,斷言舊連線被關閉、且最終存檔內容來自存活連線。

---

## 附錄:本次審查未動手的理由與後續入口

依指示本輪只出報告。執行順序建議照 §5 編號;每一項的「給執行者的具體步驟 + 驗收指令」已內嵌在對應章節。動手前先讀 CLAUDE.md 的完成定義:typecheck + 對應 smoke 實跑通過 + 玩法改動需 `npm run dev` 實際觀察,缺一不可。
