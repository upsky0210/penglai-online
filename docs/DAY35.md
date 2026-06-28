# Day 35 Smoke Test 與驗證流程（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：開發品質與回歸檢查

## 今日目標

建立一個簡單的 smoke test 腳本，之後每天修改功能後可以快速確認後端基本功能沒有壞。

## 完成內容

### 1. 新增 smoke test 腳本

新增：

```text
scripts/smoke.mjs
```

檢查項目：

```text
GET /health
GET /auth/session 無效 session 應回 401
GET /account/save-slots 無效 session 應回 401
POST /auth/logout
GET /admin/summary 未設定 ADMIN_TOKEN 時應回 503
WebSocket session:welcome
```

### 2. 新增 npm script

```powershell
npm.cmd run smoke
```

可用環境變數切換測試目標：

```env
SMOKE_BASE_URL=http://localhost:8787
SMOKE_WS_URL=ws://localhost:8787
```

## 驗證

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
npm.cmd run smoke
```

結果：

```text
TypeScript typecheck 通過
Client production build 通過
Smoke checks passed
Admin summary 未設定 ADMIN_TOKEN 時正確回 503
Admin summary 設定 ADMIN_TOKEN 後可查詢
Admin characters.csv 設定 ADMIN_TOKEN 後可匯出 CSV 標頭
```

## Padlet AI 日誌簡記

Day35 建立 smoke test 腳本，把健康檢查、auth 防呆、admin 防護與 WebSocket welcome 串成一鍵檢查。之後每天改完功能可以先跑 smoke test，降低改壞核心流程的風險。
