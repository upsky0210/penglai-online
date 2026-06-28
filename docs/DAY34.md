# Day 34 部署與環境變數文件（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：部署準備

## 今日目標

整理 Google 登入、管理 API、CORS、SQLite 與校內部署需要的環境變數，避免後續搬到 VM 或校內主機時設定混亂。

## 完成內容

### 1. 新增部署文件

新增：

```text
docs/DEPLOYMENT_AUTH_ADMIN.md
```

內容包含：

```text
後端環境變數
前端環境變數
Google OAuth Console 注意事項
管理 API 使用方式
校內主機部署建議
Ubuntu VM 部署建議
Google Sites 限制說明
Smoke test 使用方式
```

### 2. 新增 .env.example

新增：

```text
.env.example
```

提供：

```text
PORT
PENGLAI_DB_PATH
GOOGLE_CLIENT_ID
GOOGLE_HOSTED_DOMAIN
AUTH_CORS_ORIGIN
ADMIN_TOKEN
```

## Padlet AI 日誌簡記

Day34 整理部署與環境變數文件，包含 Google 登入、ADMIN_TOKEN、CORS、SQLite 備份與 VM/校內主機部署注意事項。這讓專案開始具備搬到正式測試環境的準備。
