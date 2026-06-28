# Day 85 回饋 CSV 匯出（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：讓測試回饋可以匯出到 Google Sheet 或 Padlet 整理。

## 完成內容

新增管理 API：

```text
GET /admin/feedback.csv
```

教師管理面板新增按鈕：

```text
下載回饋 CSV
```

Smoke test 新增檢查：

```text
POST /feedback
GET /admin/feedback
GET /admin/feedback.csv
```

## 驗證

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
```

## Padlet AI 日誌簡述

Day85 完成回饋 CSV 匯出，老師可以把學生測試資料下載後放到 Google Sheet 或 Padlet 分析。
