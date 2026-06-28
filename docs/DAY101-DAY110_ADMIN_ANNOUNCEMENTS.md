# Day101-Day110 管理公告系統

專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 目標

建立適合學校 Beta 測試的公告系統，讓老師可以在後台發送公告、保存公告紀錄、匯出 CSV，並讓晚登入的學生收到最新公告。

## 完成項目

- `server/src/persistence.ts`
  - 新增 `admin_announcements` 資料表。
  - 新增公告保存與查詢函式。

- `server/src/index.ts`
  - `/admin/broadcast` 發送後同步保存公告。
  - 新增 `/admin/announcements`。
  - 新增 `/admin/announcements.csv`。
  - 玩家登入時收到最新公告。

- `client/src/adminDashboard.ts`
  - 新增公告 CSV 按鈕。
  - 新增公告歷史區塊。
  - 發送公告後自動刷新。

- `scripts/smoke.mjs`
  - 加入公告 API smoke test。

## 驗證

```bash
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin SMOKE_BASE_URL=http://localhost:8788 SMOKE_WS_URL=ws://localhost:8788 npm.cmd run smoke
```

## 後續建議

- Day111-Day115 可以做「公告分類與有效期限」。
- Day116-Day120 可以做「後台 Beta 問題追蹤狀態：未處理 / 處理中 / 已修正」。
- Day121-Day125 可以做「玩家端公告面板」，讓學生可回看歷史公告。
