# Day 56 系統狀態 API（2026-06-26）

專案：蓬萊異聞錄 Online  
主題：讓教師或維護者可以從管理端查看伺服器健康狀態。

## 今日目標

Day56 補上第一版營運監控 API。這不是遊戲內容功能，而是日後 Beta 測試時很重要的維護工具。

## 完成內容

### 1. 新增管理端系統狀態 API

```text
GET /admin/system?token=ADMIN_TOKEN
```

回傳內容包含：

```text
伺服器運行時間
Node.js 記憶體使用量
SQLite 資料庫路徑
備份目錄
線上玩家數
聊天鎖定狀態
靜音玩家數
Admin API 是否設定
Google 登入是否設定
```

### 2. 沿用既有安全規則

此 API 與其他教師管理功能一樣，必須帶入 `ADMIN_TOKEN`。如果沒有設定或 token 不正確，會回傳管理端錯誤，不會暴露系統資訊。

## 技術紀錄

後端檔案：

```text
server/src/index.ts
```

新增函式：

```text
sendAdminSystem()
```

## Padlet AI 日誌簡述

Day56 補上系統狀態 API，讓管理者可以看到伺服器運行時間、記憶體、資料庫路徑、線上玩家與 Google 登入設定狀態，開始把遊戲從純玩法原型推向可維護的測試版本。
