# Day 41 線上玩家清單（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：課堂控場工具

## 今日目標

讓教師管理端可以看到目前有哪些玩家在線上，作為課堂活動管理的基礎。

## 完成內容

### 1. 新增線上玩家 API

```text
GET /admin/online?token=ADMIN_TOKEN
```

回傳：

```text
playerId
name
className
level
hp / maxHp
saveSlot
authenticated
updatedAt
```

### 2. 管理頁新增線上玩家區

教師管理頁現在顯示線上玩家清單，包含角色名稱、職業、等級、血量、登入狀態與存檔槽。

## Padlet AI 日誌簡記

Day41 新增線上玩家清單。教師可以在管理頁看到目前有哪些玩家在線上，開始具備課堂控場能力。
