# SQLite 備份與還原

## 建立備份

```powershell
npm.cmd run backup:db
```

預設備份位置：

```text
server/backups/
```

## 還原備份

還原前必須先停止 server，避免 SQLite WAL 檔仍在寫入。

```powershell
npm.cmd run restore:db -- server/backups/penglai-xxxx.sqlite --confirm
```

## 還原檢查

```powershell
npm.cmd run typecheck
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
```

## 注意事項

```text
不要在學生正在遊玩時還原
還原前先複製目前 server/data/penglai.sqlite
正式部署時建議每天至少備份一次
```
