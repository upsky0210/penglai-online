# CLAUDE.md — 蓬萊異聞錄 Online

瀏覽器 2D 像素橫向捲軸 MMORPG 原型。詳規見 [docs/SPEC.md](docs/SPEC.md)。

## 專案結構

- npm workspaces：`client/`(Phaser 3 + Vite + TS)、`server/`(Node + WebSocket + TS)、`shared/`(共用型別契約)。
- 跨端訊息/資料型別放 `shared/`，client 與 server 都從那裡取，不要各自重複定義。
- 資料庫：SQLite(runtime DB 與備份**不進版控**);存檔有 export/import(離線韌性)。

## 常用指令

- `npm run dev` — 同時起 server + client。
- `npm run typecheck` — 三個 workspace 全檢。
- `npm run check:beta` — typecheck + client build + smoke + smoke:multi(提交前主閘)。
- `npm run smoke:*` — 各系統煙霧測試(multi/interactable/warehouse/cavern/archive/observatory/quest-lock…)。
- `npm run audit:ui-text` — UI 文案檢查(避免侵權名稱:MapleStory / 金庸 / Harry Potter)。

## 工作準則(來自 claude-project-ops，精簡綁定本專案)

**完成的定義(最重要)**
改了程式碼 ≠ 修好問題。宣稱「完成」前必須:
1. 相關 `typecheck` 通過;動到的系統對應的 `smoke:*` 或 `check:beta` 實際跑過並看到通過。
2. 若是玩法/畫面/多人同步改動,實際 `npm run dev` 起來觀察機制運作(尤其存檔、狀態廣播這種「看起來對其實沒對」的地方)。
3. 據實回報:測試沒跑就說沒跑,失敗就貼輸出,不編造結果。

**什麼時候問使用者(而不是自己決定)**
- 不可逆/破壞性操作(刪檔、改動 runtime DB、覆寫存檔)且未獲授權。
- 價值抉擇(效能 vs 成本、簡潔 vs 相容、玩法平衡取捨)——這類問你。
- 指令與觀察到的事實矛盾。
- 純技術選擇(用哪個 API、怎麼寫)自己決定,不用問。

**什麼時候換方法(別硬修)**
- 同一個 bug 修兩次都是同類錯誤 → 停手,重新理解問題。
- 每修一個問題冒出兩個新問題,或第三次加特例 → 抽象壞了,重構而非再打補丁。
- 一直撞同一道環境牆 → 換路徑或回報。

**做事節奏**
- 動手前先把「怎樣算驗收」講清楚(可機器檢驗優先:哪個指令 exit 0、哪個 smoke 通過)。
- 避免重複造機制:改東西前先看 `shared/`、既有 script、既有系統有沒有現成的。
- 不侵權:新增地名/角色/招式/UI 文案,守 SPEC「避免 MapleStory、金庸、Harry Potter」,必要時跑 `audit:ui-text`。

## 底線

- 不把 runtime SQLite DB 或備份加回版控。
- 不引入 SPEC Non-Goals 範圍的東西(金流、PvP、拍賣場等),除非使用者明確要求。
