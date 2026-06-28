# Day 59 Smoke Test 擴充（2026-06-26）

專案：蓬萊異聞錄 Online  
主題：把新營運 API 納入自動檢查。

## 今日目標

Day59 擴充 smoke test，讓系統狀態與備份 API 不只存在，也能在每次基本驗證時被檢查。

## 完成內容

### 1. Smoke test 新增系統狀態檢查

新增檢查：

```text
GET /admin/system
```

### 2. Smoke test 新增備份 API 檢查

新增檢查：

```text
GET /admin/backups
POST /admin/backups
```

### 3. 保留既有檢查

原本的檢查仍保留：

```text
/health
/auth/session
/account/save-slots
/auth/logout
/admin/summary
/admin/characters
/admin/chat-logs
/admin/action-logs
/admin/classroom
/admin/broadcast
/admin/mute
/admin/kick
WebSocket session:welcome
```

## 執行方式

一般 smoke：

```powershell
npm.cmd run smoke
```

含管理 API：

```powershell
$env:SMOKE_ADMIN_TOKEN="你的_ADMIN_TOKEN"
npm.cmd run smoke
```

## Padlet AI 日誌簡述

Day59 把系統狀態與備份 API 加入 smoke test，讓每次測試不只確認遊戲能連線，也會確認教師管理與資料備份功能正常。
