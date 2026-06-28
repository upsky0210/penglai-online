# Day 26 Google ID Token 後端驗證（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：帳號安全與學校網域限制

## 今日目標

讓後端負責驗證 Google credential，避免只相信前端傳來的 email 或暱稱。

## 完成內容

### 1. 新增後端 Google 驗證模組

新增：

```text
server/src/googleAuth.ts
```

功能：

```text
使用 google-auth-library 驗證 ID token
檢查 audience 是否符合 GOOGLE_CLIENT_ID
讀取 Google sub 作為穩定帳號識別
讀取 email、name、hd 等 profile 欄位
支援 Google Workspace hosted domain 限制
```

### 2. 新增 HTTP auth endpoint

後端由單純 WebSocket server 改成 HTTP server + WebSocket server 共用同一個 port。

新增 endpoint：

```text
POST /auth/google
GET /health
```

`POST /auth/google` 請求內容：

```json
{
  "credential": "Google ID token",
  "saveSlot": "目前存檔槽",
  "characterName": "角色名稱"
}
```

成功回應：

```json
{
  "sessionId": "sess_xxx",
  "expiresAt": 1234567890,
  "saveSlot": "綁定後的存檔槽",
  "account": {
    "email": "student@example.edu",
    "hostedDomain": "example.edu",
    "displayName": "Student"
  }
}
```

### 3. 學校網域限制

後端可用環境變數限制只允許特定 Google Workspace 網域：

```env
GOOGLE_HOSTED_DOMAIN=school.edu.tw
```

注意：這裡使用 Google ID token 的 `hd` claim，不只看 email 字尾。

## 需要設定

後端 `.env` 範例：

```env
GOOGLE_CLIENT_ID=你的 Google OAuth Client ID
GOOGLE_HOSTED_DOMAIN=school.edu.tw
AUTH_CORS_ORIGIN=http://localhost:5174
```

`GOOGLE_HOSTED_DOMAIN` 可以先留空，等真的接學校網域時再限制。

## 驗證

已執行：

```powershell
npm.cmd run typecheck
```

結果：通過。

## Padlet AI 日誌簡記

Day26 把 Google 登入的安全檢查放到後端處理，包含 token 驗證、Client ID 檢查與學校網域限制。這樣學生登入時，不是前端自己說是誰，而是由 Google token 驗證後建立帳號。
