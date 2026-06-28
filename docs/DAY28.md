# Day 28 Google 帳號狀態與登出（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：帳號系統可用性

## 今日目標

把 Day25-27 的 Google 登入流程補上基本帳號狀態與登出操作，避免登入後只能留在 localStorage 裡，無法切換帳號。

## 完成內容

### 1. 標題畫面顯示帳號狀態

標題畫面現在會顯示：

```text
未設定 Google Client ID
可使用學校 Google 帳號登入
Google 帳號已登入
```

登入後會優先顯示 email，沒有 email 時顯示 display name 或 hosted domain。

### 2. 新增 G 登出

標題畫面快捷鍵：

```text
G 登出 Google 帳號
```

遊戲內可在存檔面板使用：

```text
P 開啟存檔面板
G 登出 Google 帳號
```

遊戲內登出後會重啟場景，避免 WebSocket 繼續使用舊 session。

### 3. localStorage session 格式升級

`penglai-auth-session` 現在保存：

```text
sessionId
expiresAt
account
saveSlots
```

仍相容 Day27 只有 `sessionId` 與 `expiresAt` 的資料。

## 修改檔案

```text
client/src/scenes/GameScene.ts
```

## Padlet AI 日誌簡記

Day28 把 Google 登入補上帳號狀態與登出。現在玩家可以看到目前是否已登入，也能用 G 登出，避免共用電腦上帳號混用。
