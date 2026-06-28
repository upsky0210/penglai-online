# Day 32 教師管理摘要 API（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：教師端與營運觀察

## 今日目標

新增一個只讀管理摘要 API，讓之後教師可以查看帳號、角色、存檔與 session 的整體狀態。

## 完成內容

### 1. 新增管理摘要資料查詢

後端新增統計：

```text
accounts
characters
saveSlots
activeSessions
recentCharacters
```

### 2. 新增管理 API

```text
GET /admin/summary?token=ADMIN_TOKEN
```

未設定 `ADMIN_TOKEN` 時，管理 API 會關閉並回：

```json
{ "error": "admin_api_not_configured" }
```

token 錯誤時會回：

```json
{ "error": "admin_token_required" }
```

## 修改檔案

```text
server/src/index.ts
server/src/persistence.ts
```

## Padlet AI 日誌簡記

Day32 新增教師管理摘要 API，可以查整體帳號、角色、存檔與有效 session 數量。這個 API 預設需要 ADMIN_TOKEN，避免學生資料被直接公開。
