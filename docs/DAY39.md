# Day 39 SQLite 備份腳本（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：資料維護

## 今日目標

建立最基本的 SQLite 備份流程，避免原型測試時學生資料只存在單一檔案。

## 完成內容

### 1. 新增備份腳本

新增：

```text
scripts/backup-sqlite.mjs
```

預設來源：

```text
server/data/penglai.sqlite
```

預設輸出：

```text
server/backups/penglai-日期時間.sqlite
```

### 2. 新增 npm script

```powershell
npm.cmd run backup:db
```

可用環境變數：

```env
PENGLAI_DB_PATH=server/data/penglai.sqlite
PENGLAI_BACKUP_DIR=server/backups
```

## Padlet AI 日誌簡記

Day39 新增 SQLite 備份腳本。之後校內測試前後可以執行 `npm.cmd run backup:db` 備份資料庫，降低學生資料遺失風險。
