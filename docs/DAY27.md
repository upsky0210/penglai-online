# Day 27 帳號 Session 與 WebSocket 存檔綁定（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：登入帳號接上遊戲連線

## 今日目標

讓 Google 登入後產生的 session 可以帶進 WebSocket 連線，並把帳號與 save slot 綁定。

## 完成內容

### 1. session 建立

登入成功後，後端會建立：

```text
auth_sessions.session_id
auth_sessions.account_id
auth_sessions.expires_at
```

預設 session 有效時間為 7 天。

### 2. 帳號與存檔槽綁定

登入成功時會寫入：

```text
account_save_slots
```

綁定內容：

```text
Google account -> save_slot
```

玩家之後用同一個 Google 帳號登入，就能回到同一個角色存檔。

### 3. WebSocket 帶 session

前端連線時會把 session 加到 URL：

```text
ws://localhost:8787?slot=目前存檔&session=sess_xxx
```

後端收到後會：

```text
驗證 session 是否存在且未過期
如果有效，使用帳號綁定的 save slot
如果無效，退回原本 guest save slot 流程
```

### 4. session welcome 擴充

`session:welcome` 訊息新增：

```ts
authenticated?: boolean;
```

之後可以用來在 HUD 顯示「已登入」或管理學生帳號狀態。

## 驗證

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

結果：

```text
TypeScript typecheck 通過
Client production build 通過
GET /health 通過
WebSocket session:welcome smoke test 通過
未設定 GOOGLE_CLIENT_ID 時，/auth/google 正確回 503 not_configured
```

## 後續建議

下一階段可以做：

```text
登出按鈕
帳號頁面
教師後台查詢學生角色
多角色 slot 選擇
正式部署環境變數整理
```

## Padlet AI 日誌簡記

Day27 把 Google 登入和遊戲連線接起來。登入後會建立 session，WebSocket 連線時帶著 session，後端會把帳號和存檔槽綁定。這代表遊戲開始從「本機存檔」走向「學生帳號存檔」。
