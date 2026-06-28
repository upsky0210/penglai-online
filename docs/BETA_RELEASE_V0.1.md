# Beta v0.1 封版紀錄

版本：0.1.0  
封版範圍：Day1-Day100  
主題：第一章可測試版

## 功能範圍

```text
2D 橫向動作玩法
第一章任務線
多人同步
聊天與教師控場
SQLite 存檔
Google 登入雛形
備份與還原
遊戲內測試回饋
管理面板與 CSV 匯出
```

## 封版檢查

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
npm.cmd run smoke:multi
```

## 已知問題

```text
美術仍是原型級，需要正式美術 pass
Vite build 有 chunk size 警告
Google 登入需學校 Workspace Client ID 實測
管理權限目前只有 ADMIN_TOKEN
壓力測試仍屬輕量 smoke
```

## 下一階段

```text
第二章內容
正式美術與角色 sprite
更完整的壓力測試
正式校內部署
Google Workspace 登入實測
```
