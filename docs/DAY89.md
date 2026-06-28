# Day 89 多人 Smoke 測試腳本（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：新增多人連線自動檢查。

## 完成內容

新增腳本：

```text
scripts/multiplayer-smoke.mjs
```

新增 npm 指令：

```powershell
npm.cmd run smoke:multi
```

測試內容：

```text
同時建立 3 個 WebSocket 玩家
確認每個玩家收到 welcome 與 world snapshot
送出 player:update
送出聊天訊息
測試 player:return-safe
檢查聊天廣播有被觀察到
```

## 驗證

```powershell
npm.cmd run smoke:multi
```

## Padlet AI 日誌簡述

Day89 新增多人 Smoke 測試腳本，可以快速檢查多人 WebSocket、玩家更新、聊天廣播與回安全區功能是否正常。
