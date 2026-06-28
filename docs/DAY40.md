# Day 40 管理端整合驗證（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：教師端與維運工具整合

## 今日目標

把 Day36-39 的管理頁、API、CSV、備份、smoke test 做一次整合驗證。

## 完成內容

### 1. Smoke test 擴充

`npm.cmd run smoke` 現在支援：

```text
SMOKE_ADMIN_TOKEN
```

有 token 時會測：

```text
/admin/summary
/admin/characters
/admin/characters.csv
```

沒有 token 時會確認管理 API 受到保護。

### 2. 管理頁入口

教師管理頁：

```text
http://127.0.0.1:5174/?admin=1
```

遊戲入口不變：

```text
http://127.0.0.1:5174/
```

### 3. 驗證項目

本日驗證會包含：

```text
TypeScript typecheck
Client production build
Smoke test
SQLite backup script
Admin dashboard build
```

## 驗證結果

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
npm.cmd run backup:db
npm.cmd run smoke
```

另外用臨時 `ADMIN_TOKEN` 測試：

```powershell
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
```

結果：

```text
TypeScript typecheck 通過
Client production build 通過
SQLite backup 建立成功
Smoke checks passed
/admin/characters JSON 成功回應
含 ADMIN_TOKEN 的管理端 smoke test 通過
```

## Padlet AI 日誌簡記

Day40 整合教師管理端與維運工具。現在有教師管理頁、角色查詢、CSV 匯出、SQLite 備份與 smoke test，專案開始具備小規模校內測試所需的管理基礎。
