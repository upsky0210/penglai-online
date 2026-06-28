# Day 52 操作紀錄 API 與 CSV（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：教師控場稽核

## 今日目標

提供教師端查詢與匯出控場操作紀錄的 API。

## 完成內容

### 1. JSON API

```text
GET /admin/action-logs?token=ADMIN_TOKEN&limit=80
```

### 2. CSV 匯出

```text
GET /admin/action-logs.csv?token=ADMIN_TOKEN
```

匯出欄位：

```text
id
action
target_player_id
target_player_name
details
created_at
```

## Padlet AI 日誌簡記

Day52 新增控場操作紀錄 API 與 CSV 匯出。教師可以查詢或下載管理操作紀錄，提升課堂測試的可追溯性。
