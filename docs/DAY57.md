# Day 57 資料庫備份 API（2026-06-26）

專案：蓬萊異聞錄 Online  
主題：建立第一版遠端資料庫備份能力。

## 今日目標

Day57 讓教師管理端可以透過 API 建立 SQLite 備份，避免學生測試資料只存在單一資料庫檔案中。

## 完成內容

### 1. 新增備份列表 API

```text
GET /admin/backups?token=ADMIN_TOKEN
```

回傳最近 20 筆 `.sqlite` 備份檔：

```text
檔名
檔案大小
建立時間
備份目錄
```

### 2. 新增建立備份 API

```text
POST /admin/backups?token=ADMIN_TOKEN
```

執行後會把目前 SQLite 資料庫複製到備份目錄，檔名格式：

```text
penglai-YYYY-MM-DDTHH-MM-SS-msZ.sqlite
```

### 3. 新增操作紀錄

建立備份後會寫入 admin action log：

```text
database_backup
```

這樣之後可以追蹤何時建立過資料庫備份。

## 環境變數

可選設定：

```env
PENGLAI_BACKUP_DIR=server/backups
```

如果沒有設定，系統會使用預設備份目錄。

## Padlet AI 日誌簡述

Day57 做出第一版資料庫備份 API，管理者可以列出備份，也可以遠端建立 SQLite 備份，並把備份行為記錄到操作紀錄中。
