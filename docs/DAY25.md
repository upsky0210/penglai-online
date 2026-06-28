# Day 25 Google 登入前端第一版（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：帳號系統原型

## 今日目標

把 Google Sign-In 放進標題畫面，讓學生未來可以用學校 Google 帳號登入，不再只依賴瀏覽器本機 save slot。

## 完成內容

### 1. Google Identity Services 前端載入器

新增：

```text
client/src/game/googleIdentity.ts
```

功能：

```text
載入 Google Identity Services script
渲染 Google 登入按鈕
取得 Google credential 後回傳給遊戲場景
```

### 2. 標題畫面登入入口

在 `GameScene` 標題畫面加入：

```text
Google 登入狀態文字
Google 登入按鈕
登入成功提示
```

未設定 `VITE_GOOGLE_CLIENT_ID` 時，畫面會顯示 Google 登入尚未設定，原本本機存檔玩法仍可繼續使用。

### 3. 前端登入狀態保存

新增 localStorage key：

```text
penglai-auth-session
```

保存內容：

```text
sessionId
expiresAt
```

後續重新整理頁面時，前端可以自動把 session 帶到 WebSocket 連線。

## 需要設定

前端 `.env` 範例：

```env
VITE_GOOGLE_CLIENT_ID=你的 Google OAuth Client ID
```

## 驗證

已執行：

```powershell
npm.cmd run typecheck
```

結果：

```text
shared typecheck 通過
server typecheck 通過
client typecheck 通過
```

## Padlet AI 日誌簡記

Day25 開始把帳號系統接到前端，新增 Google 登入按鈕與登入狀態顯示。這一版先不強迫登入，保留原本本機存檔流程，讓遊戲仍可直接測試。
