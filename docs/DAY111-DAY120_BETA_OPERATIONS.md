# Day111-Day120 Beta 營運功能升級

專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 本階段目標

把 Day101-Day110 的公告系統延伸成更完整的 Beta 營運工具，並把學生回饋從單純收集升級成可追蹤、可處理的管理流程。

## 完成內容

- 公告分類：系統、課堂、維護、活動。
- 公告有效期限：1 小時、3 小時、1 天、永久。
- 玩家端公告面板：按 `U` 可查看最近公告。
- 新登入玩家只收到未過期公告。
- 回饋狀態：未處理、處理中、已修正、暫不處理。
- 回饋處理備註與更新時間。
- 後台可直接更新回饋狀態。
- CSV 匯出補上公告分類/期限與回饋狀態/備註。
- smoke test 補強公告與回饋狀態 API。

## 影響檔案

- `server/src/persistence.ts`
- `server/src/index.ts`
- `shared/src/index.ts`
- `client/src/adminDashboard.ts`
- `client/src/scenes/GameScene.ts`
- `client/src/styles.css`
- `scripts/smoke.mjs`

## 下一階段建議

- Day121-Day125：第一章內容補強，新增任務、NPC、怪物用途。
- Day126-Day130：玩家 UI 整理，處理任務/背包/公告/地圖面板的版面一致性。
- Day131-Day135：Beta v0.2 測試包與教師操作手冊。
