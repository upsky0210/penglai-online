# Day 36 教師管理儀表板入口（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：教師端管理工具

## 今日目標

把 Day32-33 的管理 API 做成可操作的前端頁面，不再只能用瀏覽器或 API 工具查資料。

## 完成內容

### 1. 新增管理儀表板頁

使用同一個 Vite app，以 URL 參數切換：

```text
http://127.0.0.1:5174/?admin=1
```

預設網址仍是遊戲本體。

### 2. 新增 adminDashboard 模組

新增：

```text
client/src/adminDashboard.ts
```

功能：

```text
輸入 ADMIN_TOKEN
查詢管理摘要
顯示帳號、角色、存檔槽、有效 session 數量
顯示角色清單
```

## Padlet AI 日誌簡記

Day36 把教師管理 API 接成前端儀表板。現在可以用 `?admin=1` 開啟教師頁面，輸入 ADMIN_TOKEN 後查看整體資料。
