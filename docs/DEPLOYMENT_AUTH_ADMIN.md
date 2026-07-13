# 部署、登入與教師管理

專案：蓬萊異聞錄 Online  
更新範圍：Day31-DAY60

## 後端環境變數

```env
PORT=8787
PENGLAI_DB_PATH=./server/data/penglai.sqlite
PENGLAI_BACKUP_DIR=./server/backups
GOOGLE_CLIENT_ID=你的 Google OAuth Client ID
GOOGLE_HOSTED_DOMAIN=school.edu.tw
AUTH_CORS_ORIGIN=http://localhost:5174
ADMIN_TOKEN=請設定一組教師管理密碼
```

說明：

```text
PENGLAI_DB_PATH：SQLite 資料庫位置
PENGLAI_BACKUP_DIR：SQLite 備份目錄
GOOGLE_CLIENT_ID：Google ID token 驗證用 client id
GOOGLE_HOSTED_DOMAIN：限制只能用學校 Google Workspace 網域登入，可留空
AUTH_CORS_ORIGIN：前端網址
ADMIN_TOKEN：教師管理 API 與管理面板密碼
```

## 前端環境變數

```env
VITE_GOOGLE_CLIENT_ID=你的 Google OAuth Client ID
```

前端與後端必須使用同一組 Google Web OAuth Client ID。

## Google OAuth Console 設定

Web OAuth Client 需要設定：

```text
Authorized JavaScript origins：前端網址，例如 http://localhost:5174
Authorized redirect URIs：目前使用 Google Identity Services ID token，不走 redirect flow，可先不填或依 Google Console 要求設定。
```

## 教師管理面板

網址：

```text
http://localhost:5174/?admin=1
```

部署後：

```text
https://你的網域/?admin=1
```

管理面板功能：

```text
角色列表
線上玩家
聊天紀錄
操作紀錄
公告廣播
全班聊天鎖定
玩家靜音
玩家踢出
系統狀態
資料庫備份
CSV 匯出
```

## 教師管理 API

所有管理 API 都需要：

```text
?token=ADMIN_TOKEN
```

統計：

```text
GET /admin/summary?token=ADMIN_TOKEN
```

系統狀態：

```text
GET /admin/system?token=ADMIN_TOKEN
```

角色資料：

```text
GET /admin/characters?token=ADMIN_TOKEN&limit=500
GET /admin/characters.csv?token=ADMIN_TOKEN
```

線上玩家：

```text
GET /admin/online?token=ADMIN_TOKEN
```

公告：

```text
POST /admin/broadcast?token=ADMIN_TOKEN
```

聊天紀錄：

```text
GET /admin/chat-logs?token=ADMIN_TOKEN&limit=80
GET /admin/chat-logs.csv?token=ADMIN_TOKEN
```

課堂聊天控管：

```text
GET /admin/classroom?token=ADMIN_TOKEN
POST /admin/classroom?token=ADMIN_TOKEN
```

玩家控管：

```text
POST /admin/mute?token=ADMIN_TOKEN
POST /admin/kick?token=ADMIN_TOKEN
```

課堂進度、個別提示與安全位置重置：

```text
GET /admin/classroom/progress?token=ADMIN_TOKEN
GET /admin/classroom/progress.csv?token=ADMIN_TOKEN
POST /admin/classroom/hint?token=ADMIN_TOKEN
POST /admin/classroom/reset-position?token=ADMIN_TOKEN
```

課堂成果 CSV 不輸出帳號 email、存檔碼或任何登入憑證。個別提示與安全位置重置都會寫入操作紀錄；位置重置只改目前關卡座標。

操作紀錄：

```text
GET /admin/action-logs?token=ADMIN_TOKEN&limit=80
GET /admin/action-logs.csv?token=ADMIN_TOKEN
```

資料庫備份：

```text
GET /admin/backups?token=ADMIN_TOKEN
POST /admin/backups?token=ADMIN_TOKEN
```

## SQLite 備份

手動指令備份：

```powershell
npm.cmd run backup:db
```

管理 API 備份：

```text
POST /admin/backups?token=ADMIN_TOKEN
```

備份檔名格式：

```text
penglai-YYYY-MM-DDTHH-MM-SS-msZ.sqlite
```

注意：目前已經有建立備份功能，正式 Beta 前仍建議補一份「如何還原」的操作文件。

## Smoke Test

一般 smoke：

```powershell
npm.cmd run smoke
```

含教師管理 API：

```powershell
$env:SMOKE_ADMIN_TOKEN="你的_ADMIN_TOKEN"
npm.cmd run smoke
```

目前檢查範圍：

```text
/health
/auth/session
/account/save-slots
/auth/logout
/admin/summary
/admin/system
/admin/characters
/admin/characters.csv
/admin/online
/admin/chat-logs
/admin/chat-logs.csv
/admin/action-logs
/admin/action-logs.csv
/admin/backups
/admin/classroom
/admin/broadcast
/admin/mute
/admin/kick
/admin/classroom/progress
/admin/classroom/progress.csv
/admin/classroom/hint（含未授權與空提示）
/admin/classroom/reset-position（驗證進度保留）
WebSocket session:welcome
```

## Google Sites 限制

Google Sites 不適合直接架設本專案，因為這個遊戲需要：

```text
Node.js 後端
WebSocket 多人連線
SQLite 資料庫
教師管理 API
Google 登入驗證
```

Google Sites 可以做入口頁、說明頁或公告頁，但遊戲主程式仍需要部署在 VM、Railway、Render、校內伺服器或其他可執行 Node.js 的主機。
