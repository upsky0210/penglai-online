# CLAUDE.md — 蓬萊異聞錄 Online (v1.1)

瀏覽器 2D 像素橫向捲軸 MMORPG 原型。詳規見 [docs/SPEC.md](docs/SPEC.md)。
v1.1 依 Fable 5 紅隊審查修正了三處「規則與事實脫節」(侵權檢查、smoke 驗收、存檔驗收)。

## 專案結構

- npm workspaces：`client/`(Phaser 3 + Vite + TS)、`server/`(Node + WebSocket + TS)、`shared/`(共用型別契約)。
- 跨端訊息/資料型別放 `shared/`，client 與 server 都從那裡取，不要各自重複定義。
- 資料庫：SQLite(runtime DB 與備份**不進版控**;`.gitignore` 註明可能含學生資料);存檔有 export/import(離線韌性)。
- Session 連續性/交接:先看 [docs/WORKFLOW.md](docs/WORKFLOW.md) 與最新的 `docs/DAYn.md` 工作日誌,別重造已有脈絡。

## 常用指令

- `npm run dev` — 同時起 server + client。**smoke 不會自己起 server(見下),改了 server/shared 要先重啟這個。**
- `npm run typecheck` — 三個 workspace 全檢。
- `npm run check:beta` — typecheck + client build + smoke + smoke:multi + smoke:save-roundtrip(提交前主閘)。**不含 audit:ui-text。**
- `npm run check:beta:v02` — v0.2 發佈檢查(檔案清單 + audit:ui-text + typecheck + build,**不含 smoke**);不要拿它當提交閘。
- `npm run smoke:*` — 各系統煙霧測試(multi/interactable/warehouse/cavern/archive/observatory/quest-lock/save-roundtrip…)。
- `npm run backup:db` / `npm run restore:db` — 備份 / 還原 runtime DB(restore 是破壞性,見下)。
- `npm run audit:ui-text` — **只查 UI 文案編碼亂碼**(replacement char / private-use / Big5 mojibake),掃固定 8 檔;**非 `--strict` 有問題也 exit 0**。**注意:此腳本不查侵權名稱**,避免 MapleStory/金庸/Harry Potter 目前只能人工對照 SPEC 自查。

## 工作準則(來自 claude-project-ops,精簡綁定本專案)

**完成的定義(最重要)**
改了程式碼 ≠ 修好問題。宣稱「完成」前必須:
1. 相關 `typecheck` 通過;動到的系統跑對應驗收:
   - 動 `server/src` 或 `shared/src` → 至少 `smoke` + `smoke:multi`;動特定系統(倉庫/洞窟/書庫/觀星台/任務鎖)→ 加跑對應 `smoke:*`;不確定就 `check:beta`。
   - **smoke 腳本只連 `localhost:8787`,不會自己起/編譯 server。改了 server/shared 後必須先重啟 dev server 再跑 smoke,否則測到的是舊進程、等於沒驗。**
   - 動 `persistence.ts` 或存檔格式:跑 `smoke:save-roundtrip`(驗重連後 mapId/座標/等級等關鍵欄位存活、save code import 等值,已併入 `check:beta`)。它涵蓋不到的新格式/新欄位,仍要手動做一輪存檔往返(舊 slot 能載入、export 的 save code 能 import 回等值),並把新欄位加進 `smoke:save-roundtrip`。
2. 玩法/畫面/多人同步改動:能驗就實際起 `npm run dev` 驗,回報時寫明**具體做了什麼、看到什麼**(例:「開兩 client,A 移動,B 畫面上 A 位置同步更新」)。做不到視覺驗證就直說並附一份 30 秒手動確認清單,不要寫「已觀察運作正常」這種空句。
3. 據實回報:測試沒跑就說沒跑,失敗就貼輸出,不編造結果。

**什麼時候問使用者(而不是自己決定)**
- 不可逆/破壞性操作且未獲授權。具體到本專案:`npm run restore:db`、刪除/覆寫既有玩家 save slot、手動改 DB 內容——先問。跑 smoke(只寫入 smoke 專用測試 slot)與 `npm run backup:db` 視為已授權;動任何有風險的 DB 操作前先 `backup:db`。
- 價值抉擇(效能 vs 成本、簡潔 vs 相容、玩法平衡取捨)——這類問你。
- 指令與觀察到的事實矛盾。
- 純技術選擇(用哪個 API、怎麼寫)自己決定,不用問。

**什麼時候換方法(別硬修)**
- 同一個 bug 修兩次都是同類錯誤 → 停手,重新理解問題。
- 每修一個問題冒出兩個新問題,或第三次加特例 → 抽象壞了,重構而非再打補丁。
- 一直撞同一道環境牆 → 換路徑或回報。

**做事節奏**
- 動手前先把「怎樣算驗收」講清楚(可機器檢驗優先:哪個指令 exit 0、哪個 smoke 通過)。
- 只動 `docs/` 或註解:不需跑任何閘。
- 避免重複造機制:改東西前先看 `shared/`、既有 script、既有系統有沒有現成的。
- 不侵權:新增地名/角色/招式/UI 文案,守 SPEC「避免 MapleStory、金庸、Harry Potter」;`audit:ui-text` 幫不上這塊,靠人工對照 SPEC。

## 底線

- 不把 runtime SQLite DB 或備份加回版控。
- 不引入 SPEC Non-Goals 範圍的東西(金流、PvP、拍賣場等),除非使用者明確要求。
