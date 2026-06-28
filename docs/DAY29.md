# Day 29 Session API 與登入狀態驗證（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：帳號 session 管理

## 今日目標

讓前端不只相信本機 localStorage，而是可以向後端確認 session 是否還有效。

## 完成內容

### 1. 新增 session 查詢 API

新增：

```text
GET /auth/session?session=sess_xxx
```

有效 session 回應：

```json
{
  "active": true,
  "sessionId": "sess_xxx",
  "expiresAt": 1234567890,
  "account": {
    "email": "student@example.edu",
    "hostedDomain": "example.edu",
    "displayName": "Student"
  },
  "saveSlots": []
}
```

無效 session 回應：

```json
{
  "active": false,
  "error": "invalid_session"
}
```

### 2. 新增登出 API

新增：

```text
POST /auth/logout
```

用途：

```text
撤銷 auth_sessions 裡的 session
讓前端清掉 localStorage
支援共用電腦切換學生帳號
```

### 3. 前端自動驗證 session

標題畫面載入時，如果 localStorage 有 session，會呼叫 `/auth/session`。

行為：

```text
有效：更新帳號摘要與存檔槽摘要
無效或過期：清除本機 session，顯示需重新登入
```

## 修改檔案

```text
server/src/index.ts
server/src/persistence.ts
client/src/scenes/GameScene.ts
```

## Padlet AI 日誌簡記

Day29 補上 session 查詢與登出 API。前端現在會問後端 session 是否仍有效，避免 localStorage 過期或被撤銷後還顯示已登入。
