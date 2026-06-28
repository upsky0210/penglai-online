# Day 92 備份與還原工具（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：補齊 SQLite 還原流程。

## 完成內容

新增：

```text
scripts/restore-sqlite.mjs
npm.cmd run restore:db
docs/BACKUP_RESTORE.md
```

還原腳本需要 `--confirm`，避免誤覆蓋資料庫。

## Padlet AI 日誌簡述

Day92 補上 SQLite 還原工具與文件。現在不只可以備份，也有明確的還原流程。
