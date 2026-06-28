# Day 65 菁英怪與第一關目標（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：加入第一關的菁英怪目標，讓關卡有明確收束點。

## 完成內容

新增怪物：

```text
潮眼守衛
```

設定：

```text
地圖：海霧堤道
血量：150
經驗：95
重生：12 秒
掉落：潮眼甲片
```

新增任務：

```text
擊退潮眼守衛
```

這是第一關目前的結尾目標。玩家完成前置打怪與收集後，可以到海霧堤道挑戰菁英怪。

## 驗證

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
```

## Padlet AI 日誌簡述

Day65 新增第一關菁英怪「潮眼守衛」與結尾任務，讓霧港試煉場不只是練功測試，而是開始有第一關的完成目標。
