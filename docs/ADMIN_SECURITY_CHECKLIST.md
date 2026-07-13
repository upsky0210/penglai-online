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
查看線上學生任務進度與保守卡關警示
發送個別提示、送回目前關卡安全區
匯出不含登入資料的課堂成果 CSV
```

## 風險

```text
dev server 不適合直接公開到 Internet
目前管理權限只有 token，尚未做分級帳號
學生若知道 ADMIN_TOKEN 就能進管理面板
```

## P9-D 敏感操作檢查

```text
/admin/classroom/progress、hint、reset-position 與 progress.csv 必須驗證 ADMIN_TOKEN
個別提示與位置重置只接受目前在線的 playerId
位置重置不得變更地圖、任務、等級、經驗、道具、裝備或存檔識別
全班提示、個別提示、位置重置都必須出現在 action log
課堂成果 CSV 不得包含 email、save slot、password、token 或 session
卡關警示只供教師判讀，不得自動操作學生角色
後台列表不得用高頻廣播推送；建議更新間隔不得短於 15 秒
```

## P10-A 小規模試教隔離

```text
每梯使用新的 tmp/p10-a/<session-id>/data/penglai.sqlite，不沿用一般資料庫
Session ID、觀察表與匯出檔只用 S01-S10 代號，不記姓名、學號或 token
真人模式必須關閉 AUTH_ALLOW_MOCK 與 VITE_AUTH_ALLOW_MOCK
ADMIN_TOKEN 只在老師啟動程序記憶體中，不得寫入 session.json、log 或 CSV
重置前停止 server，且必須輸入完整 --confirm-reset=<session-id>
重置已有資料時必須先留下 pre-reset SQLite 備份
緊急還原後必須確認 PRAGMA integrity_check 為 ok 才重新開放學生連線
模擬彩排與真人試教結果必須分開標示
```
