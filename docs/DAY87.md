# Day 87 回安全區功能（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：新增玩家卡住時可自行回安全區的功能。

## 完成內容

新增操作：

```text
H 回安全區
```

新增 shared / server 訊息：

```text
player:return-safe
```

伺服器會將玩家移回目前地圖的出生點，給短暫無敵並保存位置。此功能有冷卻時間，避免玩家濫用。

## 驗證

```powershell
npm.cmd run typecheck
```

## Padlet AI 日誌簡述

Day87 新增 H 回安全區功能，學生如果卡地形或卡怪物區，可以自行回到安全區，降低老師現場排除問題的負擔。
