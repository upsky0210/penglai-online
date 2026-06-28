# 蓬萊異聞錄 Online

2D 像素橫向 MMORPG 教學原型。Beta v0.1 目標是讓第一章「霧港試煉」可以給學生試玩，老師可以控場、備份與收集測試回饋。

## 目前功能

- Phaser 橫向動作遊戲：移動、跳躍、攻擊、技能、死亡與復活。
- 第一章任務線：田鼠、材料收集、海霧堤道、潮眼守衛。
- 多人 WebSocket 同步。
- 背包、裝備、商店、金幣、經驗與升級。
- Google 登入雛形、訪客存檔與帳號存檔槽。
- SQLite 持久化、備份與還原工具。
- 教師管理面板：線上玩家、聊天紀錄、公告、靜音、踢出、備份、測試回饋。
- 遊戲內測試回饋表單，CSV 匯出。

## Windows 一鍵啟動

```powershell
START_PENGLAI.bat
```

預設網址：

```text
遊戲：http://localhost:5174
管理：http://localhost:5174/?admin=1
後端：http://localhost:8787
```

## 手動啟動

PowerShell 可能封鎖 `npm.ps1`，建議使用 `npm.cmd`。

```powershell
npm.cmd install
set ADMIN_TOKEN=change-this-token
npm.cmd --workspace server run start
npm.cmd --workspace client run dev -- --host 0.0.0.0 --port 5174
```

Ubuntu / VM：

```bash
npm install
chmod +x START_PENGLAI_UBUNTU.sh
ADMIN_TOKEN=change-this-token ./START_PENGLAI_UBUNTU.sh
```

## 測試

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
npm.cmd run smoke:multi
```

如果已用 `ADMIN_TOKEN=smoke-admin` 啟動後端，也可以執行：

```powershell
npm.cmd run check:beta
```

## 備份與還原

建立備份：

```powershell
npm.cmd run backup:db
```

還原備份前請先停止 server：

```powershell
npm.cmd run restore:db -- server/backups/your-backup.sqlite --confirm
```

## 重要文件

- [Beta 測試檢查表](docs/BETA_TEST_CHECKLIST.md)
- [Beta 測試計畫](docs/BETA_TEST_PLAN.md)
- [部署與防火牆](docs/DEPLOYMENT_LAN_FIREWALL.md)
- [備份與還原](docs/BACKUP_RESTORE.md)
- [管理安全檢查](docs/ADMIN_SECURITY_CHECKLIST.md)
- [Beta v0.1 封版紀錄](docs/BETA_RELEASE_V0.1.md)

## 工具協作

- Codex Desktop：主要規劃、整合、驗證。
- Codex CLI / Antigravity CLI：可在有 git commit 後處理局部任務。
- Open Design / Claude Design：適合在玩法穩定後做美術與 UI 二次設計。

避免多個工具同時改同一個檔案。交接前先提交或至少整理清楚變更範圍。
