# Day 75 第一章測試導覽整合（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：整理 Day71-Day75 的測試導覽功能。

## 完成內容

Day71-Day75 整合成果：

```text
地圖 / 流程面板
第一章五步任務進度
任務下一步提示
傳送門連按保護
傳送門與菁英平台視覺標記
```

目前第一章可測試流程：

```text
接任務
打田鼠
收集材料
前往燈塔與海霧堤道
打海霧凝膠
擊退潮眼守衛
看到第一章完成提示
```

## 驗證

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
```

## Padlet AI 日誌簡述

Day75 整合第一章測試導覽。這一階段重點是讓玩家更容易看懂路線、任務進度和傳送門位置，讓第一章更適合拿給學生實測。
