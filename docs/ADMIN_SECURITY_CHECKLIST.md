# 教師管理安全檢查

## 必做

```text
ADMIN_TOKEN 不可使用 smoke-admin 作為正式值
管理面板網址不要公開貼給學生
正式測試前先建立 SQLite 備份
Google Client ID 若未設定，先使用訪客存檔測試
```

## 建議 ADMIN_TOKEN

```text
長度至少 20 字元
混合英文、數字
不要使用學校名稱、班級、生日
每次正式測試可更換
```

## 教師管理面板功能

```text
查看線上玩家
查看聊天紀錄
公告廣播
鎖定聊天
靜音玩家
踢出玩家
建立備份
查看與匯出測試回饋
```

## 風險

```text
dev server 不適合直接公開到 Internet
目前管理權限只有 token，尚未做分級帳號
學生若知道 ADMIN_TOKEN 就能進管理面板
```
