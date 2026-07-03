# Penglai Online Day1-Day500 交接文件

交接日期：2026-07-03  
接手對象：Claude Code / Claude Cowork / Claude Design  
專案位置：`C:\AI\Codex\penglai-online`

## 先讀這段

這是一個用 AI 協作逐步做出的 2D 像素橫向 MMORPG 原型，暫名 `蓬萊 Online / Penglai Online`。玩法方向接近「類楓之谷橫向卷軸」，但世界觀與美術必須是原創，避免使用 MapleStory、金庸、哈利波特等受版權保護的角色、名稱、設定、音樂、素材與 UI。

目前已完成 Day1-Day500 的 prototype 到 beta 前準備：

- Phaser 3 + Vite + TypeScript 前端。
- Node.js + TypeScript + WebSocket 後端。
- shared TypeScript package 統一 client/server 型別與遊戲資料。
- SQLite 存檔。
- 多地圖、多怪物、NPC、任務、背包、裝備、商店、技能、掉落、等級。
- 後台管理：角色、線上玩家、公告、聊天、操作紀錄、回饋、備份、測試資料清理。
- Google 帳號登入的基礎結構與前置檢查，但尚未正式校園上線。
- Claude Design 美術 brief 已整理。

接手時請先不要重構整個專案。這是一個逐日堆疊的 prototype，很多功能集中在少數檔案，先以「穩定、可玩、可測」為優先。

## 一鍵啟動與常用網址

Windows 可用：

```powershell
START_PENGLAI.bat
```

手動啟動：

```powershell
npm.cmd install
set ADMIN_TOKEN=smoke-admin
set AUTH_CORS_ORIGIN=http://localhost:5174
npm.cmd --workspace server run start
npm.cmd --workspace client run dev -- --host 0.0.0.0 --port 5174
```

網址：

```text
遊戲：http://localhost:5174
後台：http://localhost:5174/?admin=1
後端：http://localhost:8787
Admin Token：smoke-admin
```

PowerShell 注意：在 Windows 環境請優先使用 `npm.cmd`，不要用 `npm` 或 `npm.ps1`。

## 驗證指令

接手修改後至少跑：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
npm.cmd run audit:ui-text
```

若有啟動 server，可跑：

```powershell
set SMOKE_BASE_URL=http://localhost:8787
set SMOKE_WS_URL=ws://localhost:8787
set SMOKE_ADMIN_TOKEN=smoke-admin
npm.cmd run smoke
npm.cmd run smoke:interactable
npm.cmd run smoke:observatory-balance
```

`vite build` 目前會有 bundle 超過 500 kB 的警告，這是既有狀態，不代表 build 失敗。

## 技術架構

```text
penglai-online/
  client/
    src/main.ts
    src/scenes/GameScene.ts
    src/adminDashboard.ts
    src/game/
      assetManifest.ts
      audioManager.ts
      clientConfig.ts
      constants.ts
      googleIdentity.ts
      uiPanel.ts
      uiTheme.ts
      viewTypes.ts
    public/assets/

  server/
    src/index.ts
    src/persistence.ts
    src/googleAuth.ts
    data/penglai.sqlite
    backups/

  shared/
    src/index.ts

  docs/
  scripts/
```

主要責任：

- `shared/src/index.ts`：遊戲資料與型別核心。地圖、NPC、怪物、道具、任務、技能大多在這裡。
- `client/src/scenes/GameScene.ts`：主要遊戲場景。HUD、移動、互動、背包、任務、地圖渲染很多仍集中在此。
- `client/src/adminDashboard.ts`：老師/管理者後台。
- `client/src/game/assetManifest.ts`：外部圖片、spritesheet、背景分層資產路徑。
- `server/src/index.ts`：HTTP API、WebSocket、遊戲同步、管理 API、戰鬥流程。
- `server/src/persistence.ts`：SQLite schema、存檔、後台查詢、回饋、Google account/session、備份/測試資料查詢。
- `scripts/*.mjs`：smoke tests、備份還原、檢查腳本。

## 目前內容概況

### 玩家職業

- `swordsman` 劍士：技能 `斬擊 / sword-cleave`
- `talisman` 符師：技能 `靈符 / spirit-talisman`
- `hunter` 獵人：技能 `狙擊 / hunter-shot`
- 額外技能資料：`靈斬 / spirit-slash`

### 地圖

- `fog-harbor-test`：霧港試煉場，新手港口。
- `mist-breakwater`：海霧堤道，燈籠與潮位尺。
- `old-harbor-warehouse`：舊港倉庫。
- `coral-tide-cavern`：珊瑚潮洞。
- `sunken-archive`：沉船書庫。
- `starlit-observatory`：星砂觀測台。

### NPC

- 港口守衛
- 藥師阿霖
- 陳老闆
- 燈塔學徒阿澄
- 巡堤守衛阿岳
- 測潮學徒阿澄
- 倉庫管理員阿桂
- 潮洞學者阿璇
- 書庫管理員阿澈
- 觀測員阿曜

### 怪物與 Boss

- 田鼠
- 海霧凝膠
- 潮眼守衛
- 倉鼠
- 霧化木偶
- 倉庫巡弋者
- 潮洞蟹
- 礁光幽影
- 珊瑚守望者
- 沉船漂書
- 墨潮精靈
- 書庫守衛
- 星砂蛾
- 星鏡哨兵
- 星穹守望者

### 道具與裝備

消耗品：

- 小型補血藥水
- 中型補血藥水
- 霧港便當

材料：

- 田鼠尾巴
- 海霧凝膠
- 潮眼甲片
- 舊倉破布
- 潮濕木片
- 潮洞蟹殼
- 礁光碎晶
- 珊瑚潮鑰
- 鹽漬書頁
- 墨潮核心
- 書庫封印
- 星砂粉塵
- 星鏡核心
- 星穹封印

裝備：

- 練習木劍
- 粗布背心
- 舊港短刀
- 補丁布衣
- 倉庫護符
- 礁光短刃
- 珊瑚護衣
- 潮墨法杖
- 書庫學袍
- 星砂彎刀
- 觀測者斗篷

### 互動物件

- 海霧堤道：西側霧堤燈、中央霧堤燈、東側霧堤燈、霧堤潮位尺。
- 珊瑚潮洞：西側潮封印、中央潮封印、深處潮封印。
- 沉船書庫：西側書庫碑、中央書庫碑、深處書庫碑。
- 星砂觀測台：西側觀測鏡、中央觀測鏡、深處觀測鏡。

### 商店

目前主要商店：

- `陳老闆雜貨 / fog-harbor-goods`
- 販售：小型補血藥水、中型補血藥水、霧港便當、練習木劍、粗布背心。

## Day1-Day500 階段摘要

### Day1-Day21：Playable Prototype

完成最早期可玩骨架：

- Phaser/Vite client。
- Node WebSocket server。
- shared TypeScript package。
- 玩家移動、跳躍、攻擊。
- 田鼠、掉落、經驗值、升級。
- 第一個 NPC 與任務：打 3 隻 Field Rat。
- 背包、道具、碰撞扣血。
- Day10 做 SQLite 存檔第一版。
- Day11 左右開始整理中文化與美編方向。
- 產出 `docs/DAY1-21_WORK_PLAN_PROGRESS.md`。

### Day22-Day60：任務、存檔、基礎系統擴張

主要補上 prototype 必要系統：

- 多任務流程。
- 背包與裝備操作。
- 角色資料、存檔欄位、回到安全區。
- 商店、購買、補血道具。
- HUD 與操作提示。
- Windows/Ubuntu 啟動檔。
- Beta 前規格、部署筆記、測試文件逐步建立。

### Day61-Day100：測試與回饋系統

主要方向：

- Beta 測試表單與回饋流程。
- 章節、任務、UI、平衡逐步擴充。
- 測試清單與 smoke test。
- Day81-Day85 做「測試與回饋系統」。
- Day91-Day100 做較大的 beta 前整理。

### Day101-Day150：後台、公告、Beta 操作

主要成果：

- 後台 dashboard 初步建立。
- 管理公告/廣播。
- Beta operations 文件。
- 章節 1 內容整理。
- Beta v0.2 wrap-up。
- UI 文字品質與正體中文檢查。
- Quest UI、Map polish。

重要文件：

- `docs/DAY101-DAY110_ADMIN_ANNOUNCEMENTS.md`
- `docs/DAY111-DAY120_BETA_OPERATIONS.md`
- `docs/DAY121-DAY123_CHAPTER1_CONTENT.md`
- `docs/DAY124-DAY135_BETA_V02_WRAPUP.md`
- `docs/DAY136-DAY140_UI_TEXT_QUALITY.md`
- `docs/DAY141-DAY150_QUEST_UI_MAP_POLISH.md`

### Day151-Day200：互動物件、Boss、資產規格、Claude Design 交接

主要成果：

- 任務指引強化。
- 互動物件狀態。
- Boss 與章節完成判定。
- 世界狀態與資產規格。
- 美術資產 pipeline。
- 背景與 Claude Design handoff。

重要文件：

- `docs/DAY151-DAY160_QUEST_GUIDANCE_INTERACTABLES.md`
- `docs/DAY161-DAY165_INTERACTABLE_STATES.md`
- `docs/DAY166-DAY170_BOSS_AND_CHAPTER_CLEAR.md`
- `docs/DAY171-DAY180_WORLD_STATE_ASSET_SPEC.md`
- `docs/DAY181-DAY190_ASSET_PIPELINE.md`
- `docs/DAY191-DAY200_BACKGROUND_CLAUDE_HANDOFF.md`
- `CLAUDE_DESIGN_DESKTOP_HANDOFF_DAY200.md`
- `CLAUDE_DESIGN_BRIEF.md`
- `CLAUDE_DESIGN_SECOND_PASS_PROMPT.md`

### Day201-Day250：操作體驗、內容擴張、舊港倉庫

主要成果：

- 對話框移到畫面上方，避免遮擋角色與怪物。
- 斬擊冷卻提示縮小。
- 自動拾取：碰到掉落物自動取得，不再需要按 F。
- 左上/右上操作提示更清楚。
- 新內容擴張與舊港倉庫 polish。
- Quest prerequisites 與章節鎖定改善。

重要文件：

- `docs/DAY201-DAY210_UI_OPERATION_POLISH.md`
- `docs/DAY211-DAY220_CONTENT_EXPANSION.md`
- `docs/DAY221-DAY240_WAREHOUSE_POLISH.md`
- `docs/DAY241-DAY250_QUEST_PREREQUISITES.md`

### Day251-Day350：珊瑚潮洞與沉船書庫

主要成果：

- 第三章 `coral-tide-cavern`。
- 潮洞怪物、材料、互動封印、Boss。
- 第四章 `sunken-archive`。
- 沉船書庫怪物、書庫碑、Boss 與掉落。
- 對應 smoke tests 與平衡檢查。

重要文件：

- `docs/DAY251-DAY300_CORAL_CAVERN.md`
- `docs/DAY301-DAY350_SUNKEN_ARCHIVE.md`

### Day350-Day400：星砂觀測台

主要成果：

- 第五章 `starlit-observatory`。
- 新怪物：星砂蛾、星鏡哨兵、星穹守望者。
- 新道具：星砂粉塵、星鏡核心、星穹封印、星砂彎刀、觀測者斗篷。
- 新任務鏈：驅散星砂蛾群、收集星鏡核心、校準三座觀測鏡、擊退星穹守望者、回收星穹封印。
- 新 smoke/balance 文件。

重要文件：

- `docs/DAY350-DAY400_STARLIT_OBSERVATORY.md`

### Day401-Day430：觀測台平衡與 polish

主要成果：

- 第五章任務數量、怪物 HP、掉落率、獎勵平衡。
- UI 提示與章節流程改善。
- 新增/維護 `smoke:observatory-balance`。

重要文件：

- `docs/DAY401-DAY430_OBSERVATORY_POLISH.md`

### Day431-Day460：Beta 回饋系統

主要成果：

- 回饋表單增加更多欄位：
  - schoolName
  - currentZone
  - activeQuest
  - feedbackCategory
  - deviceType
  - contactAllowed
- 後台 summary 增加 betaFeedback metrics。
- 回饋 CSV 擴充。
- 後台可看回饋狀態與處理備註。

重要文件：

- `docs/DAY431-DAY460_BETA_FEEDBACK_SYSTEM.md`

### Day461-Day480：帳號存檔銜接準備

主要成果：

- 後台新增存檔稽核 API：
  - `/admin/save-audit`
  - 可看總角色、帳號綁定角色、匿名角色、帳號 save slots、Smoke 測試角色。
- 後台新增測試資料報表：
  - `/admin/test-data`
- 後台新增測試資料 cleanup API：
  - `/admin/test-data/cleanup`
  - 預設 dry-run。
  - 真刪除必須 `DELETE_SMOKE_TEST_DATA`。
- 學生端標題畫面與 P 面板明確顯示：
  - 匿名測試存檔
  - 學校 Google 帳號存檔

重要文件：

- `docs/DAY461-DAY480_ACCOUNT_SAVE_PREP.md`

### Day481-Day500：後台清理操作台與 Google 前置檢查

主要成果：

- 後台新增 `Smoke 測試資料清理` 面板。
- 可 dry-run 預覽清理範圍。
- 真正清理前需要輸入 `DELETE_SMOKE_TEST_DATA` 並通過瀏覽器確認。
- 清理前自動建立 SQLite 備份。
- 後台 `/admin/system` 增加：
  - googleClientConfigured
  - googleHostedDomain
  - authCorsOrigin
- smoke test 補上新欄位與 dry-run payload 檢查。

重要文件：

- `docs/DAY481-DAY500_ADMIN_CLEANUP_CONSOLE.md`

## Google 登入狀態

目前已具備 Google 登入基礎，但尚未建議直接開給正式學生使用。

已存在：

- `server/src/googleAuth.ts`
- `/auth/google`
- `/auth/session`
- `/auth/logout`
- `/account/save-slots`
- account save slot binding
- 後台 Google 前置檢查

環境變數：

```env
GOOGLE_CLIENT_ID=
GOOGLE_HOSTED_DOMAIN=
AUTH_CORS_ORIGIN=http://localhost:5174
ADMIN_TOKEN=change-this-admin-token
```

下一步要做：

1. 決定是否限制學校網域，例如教育局或學校 Google Workspace 網域。
2. 建立 Google Cloud OAuth Client ID。
3. 測試本機、LAN、正式網址三種 origin。
4. 做匿名角色轉移到 Google 帳號的流程。
5. 加強帳號資料與學生隱私說明。

## 後台管理狀態

後台網址：

```text
http://localhost:5174/?admin=1
```

目前功能：

- Admin Token 登入。
- 角色列表與 CSV。
- 線上玩家。
- 靜音/踢出。
- 聊天紀錄與 CSV。
- 操作紀錄與 CSV。
- 公告廣播。
- 公告歷史與 CSV。
- Beta 回饋與 CSV。
- 回饋狀態與管理備註。
- 系統狀態。
- 資料庫備份。
- Save audit。
- Smoke 測試資料報表。
- Smoke 測試資料 dry-run 與清理。

安全提醒：

- `ADMIN_TOKEN` 不要使用 `smoke-admin` 上正式環境。
- Google 認證前，不要把學生個資存在不受控的公開服務。
- 後台目前適合校內測試，不是完整 production admin security。

## SQLite 與備份

預設資料庫：

```text
server/data/penglai.sqlite
```

備份資料夾：

```text
server/backups/
```

手動備份：

```powershell
npm.cmd run backup:db
```

還原：

```powershell
npm.cmd run restore:db -- server/backups/your-backup.sqlite --confirm
```

Smoke 測試會改動 SQLite，也可能產生備份檔。接手時不要把 `server/data/*.sqlite*` 或 `server/backups/*.sqlite` 當成程式碼錯誤直接刪掉；如果要清理，先確認用途並備份。

## 美術交接

Claude Design / OpenDesign 請優先讀：

- `docs/CLAUDE_DESIGN_ASSET_BRIEF.md`
- `CLAUDE_DESIGN_BRIEF.md`
- `CLAUDE_DESIGN_SECOND_PASS_PROMPT.md`
- `CLAUDE_DESIGN_DESKTOP_HANDOFF_DAY200.md`

目前實際資產資料夾：

```text
client/public/assets/
```

已存在資產大致包含：

- 玩家 spritesheet：idle/run/jump/attack/skill_slash。
- 怪物 spritesheet：田鼠、海霧凝膠、潮眼守衛。
- 霧港與海霧堤道背景分層。
- 霧氣 overlay。
- 港口平台 tiles。

很多後期怪物、NPC、道具 icon、後期地圖背景仍未真正補齊。接手美術時請先補 `client/public/assets/`，不要先改核心遊戲邏輯。

## 已知技術債

### 1. `GameScene.ts` 太大

`client/src/scenes/GameScene.ts` 集中太多內容：

- HUD
- 背包
- 任務
- 對話
- 面板
- 地圖渲染
- 輸入處理
- 回饋表單

未來可拆：

- `HudManager`
- `QuestPanel`
- `InventoryPanel`
- `MapRenderer`
- `CombatEffects`
- `SavePanel`
- `FeedbackForm`

拆分時要小步做，每次都跑 typecheck/build/smoke。

### 2. Server 邏輯集中在 `server/src/index.ts`

目前 WebSocket、HTTP API、管理 API、戰鬥、掉落、任務流程都在 `index.ts`。未來可拆：

- `adminRoutes.ts`
- `authRoutes.ts`
- `gameLoop.ts`
- `combat.ts`
- `questService.ts`
- `shopService.ts`
- `websocketHandlers.ts`

### 3. shared 遊戲資料集中在單檔

`shared/src/index.ts` 很大。未來可拆：

- `types.ts`
- `items.ts`
- `quests.ts`
- `maps.ts`
- `monsters.ts`
- `skills.ts`

拆分時要維持 exports 相容。

### 4. 字元編碼與舊文件亂碼

部分早期文件或 bat echo 在 Windows 終端可能顯示亂碼。程式內主要 UI 文字已經過 `audit:ui-text` 檢查，但早期 docs 可能仍有 mojibake。若要正式交給學生或老師，請重寫對外文件。

### 5. 目前還不是 production MMORPG

目前適合：

- 單機測試。
- 校內 LAN 小規模測試。
- 老師展示。
- Beta 收集回饋。

尚不適合：

- 大量公開玩家。
- 付費服務。
- 長期保存正式學生資料。
- 無監控的公開網路部署。

## 部署建議

### 校內 LAN

可用老師手上的 Dell 3060 SFF / i5-8500 / 8GB 或 16GB RAM。伺服器不需要 GPU。

建議：

- Server 跑在固定 IP 電腦。
- Client 用 `--host 0.0.0.0`。
- Windows 防火牆開 5174 / 8787。
- 學校防火牆與 PA 設備換新前，不建議急著對外公開。

### 公開部署

Google Sites 不能承擔 authoritative game server。Google Sites 可放介紹頁或連結入口，但 WebSocket/SQLite/Node server 要跑在：

- Ubuntu Server + Nginx + PM2 + HTTPS/WSS
- Railway / Fly.io / Render
- Cloudflare Tunnel
- 學校 VM 或實體機搭配反向代理

正式公開前需處理：

- HTTPS/WSS
- domain
- reverse proxy
- PM2/systemd
- backups
- logs
- rate limits
- admin security
- privacy policy

## 接手開發守則

1. 先跑 `git status --short` 看目前 dirty files，不要隨便 revert。
2. 修改 shared 型別後，同時檢查 client/server。
3. 不要直接刪 SQLite 或 backups。
4. 不要把美術檔名改掉，除非同步改 `assetManifest.ts`。
5. 不要把 copyrighted IP 加進世界觀。
6. 大修改後跑：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
npm.cmd run audit:ui-text
```

7. 有 server 行為修改時跑 smoke。
8. UI 新字串要用台灣正體中文。
9. 優先保持遊戲可玩，再追求架構漂亮。

## 建議 Day501-Day700 路線

### Day501-Day530：Google 登入正式測試

- Google Cloud OAuth Client ID。
- 校園網域限制。
- localhost / LAN / 正式網址 origin 測試。
- 登入錯誤提示。
- 後台帳號查詢。
- 匿名存檔轉移到 Google 帳號。

### Day531-Day560：美術資產接入

- 接 Claude Design 圖檔。
- 補齊所有怪物 spritesheet。
- 補齊 NPC sprites。
- 補道具 icon。
- 後期地圖專屬背景。
- 檢查畫面不要遮擋主角、怪物、任務提示。

### Day561-Day600：遊戲內容 polish

- 重新平衡五章怪物 HP/傷害/掉落/經驗。
- 增加每章商店或補給點。
- 增加裝備更換提示。
- 增加章節完成提示。
- 新手教學更完整。

### Day601-Day650：Beta v0.4 / 校內測試

- 老師測試手冊。
- 學生測試任務單。
- 回饋統計。
- 後台下載報表。
- 測試資料清理流程。
- LAN 部署 SOP。

### Day651-Day700：正式化準備

- server 拆分。
- GameScene 拆分。
- migration system。
- admin security。
- logs/monitoring。
- deployment scripts。
- privacy / account policy。

## 給 Claude Code 的接手指令

可以直接把這段貼給 Claude Code / Claude Cowork：

```text
你正在接手 C:\AI\Codex\penglai-online。請先閱讀 HANDOFF_DAY1_DAY500_FOR_CLAUDE.md、docs/CLAUDE_DESIGN_ASSET_BRIEF.md、docs/DAY481-DAY500_ADMIN_CLEANUP_CONSOLE.md。

這是一個 Phaser 3 + Vite + TypeScript 前端、Node.js + WebSocket + SQLite 後端、shared TypeScript package 的 2D 像素橫向 MMORPG prototype。請不要重構整個專案；先遵守現有架構，小步修改，每次修改後跑 npm.cmd run typecheck、npm.cmd --workspace client run build、npm.cmd run audit:ui-text。涉及 server 行為時，啟動 server 後跑 smoke。

注意：
- Windows 請用 npm.cmd。
- 不要刪 server/data SQLite 或 server/backups，除非使用者明確要求。
- 不要 revert 使用者或前面 AI 留下的 unrelated changes。
- 不要加入 MapleStory、金庸、哈利波特等版權內容。
- UI 文字使用台灣正體中文。
- 美術圖檔優先放 client/public/assets/，不要改遊戲邏輯。

下一階段建議從 Day501-Day530 開始：Google 學校帳號正式測試、匿名存檔轉移到 Google 帳號、登入錯誤提示與後台帳號查詢。
```

## 給 Claude Design 的接手指令

完整美術 brief 在：

```text
docs/CLAUDE_DESIGN_ASSET_BRIEF.md
```

最短指令：

```text
請先閱讀 docs/CLAUDE_DESIGN_ASSET_BRIEF.md，依照裡面的完整角色、NPC、怪物、道具、地圖與資產規格，重製並補齊 client/public/assets/ 內的像素美術資產。不要刪除現有檔案，不要改壞遊戲邏輯，完成後列出所有新增或修改的檔案。
```

## 最後狀態

Day1-Day500 的核心目標已完成：目前是一個可啟動、可測、可擴充、具備多章節內容與後台管理的校內 Beta prototype。

下一位接手者最重要的任務不是「從頭做」，而是：

1. 保持可玩。
2. 補美術。
3. 完成 Google 登入正式測試。
4. 整理架構。
5. 準備校內小規模 Beta。
