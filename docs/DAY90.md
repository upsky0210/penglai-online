# Day 90 Beta 測試檢查表（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：整理 Beta 測試流程與通過標準。

## 完成內容

新增文件：

```text
docs/BETA_TEST_CHECKLIST.md
```

內容包含：

```text
老師測試流程
學生測試流程
多人測試流程
回饋收集流程
已知風險
通過標準
```

## 驗證

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
npm.cmd run smoke:multi
```

## Padlet AI 日誌簡述

Day90 整理 Beta 測試檢查表，讓接下來不只是繼續加功能，而是能用固定流程驗收遊戲、管理面板與學生回饋。
