# Day 37 CSV 下載與 Token 保存（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：教師端資料操作

## 今日目標

讓教師管理頁可以下載角色 CSV，並保存 ADMIN_TOKEN，降低每次重新整理都要重打 token 的摩擦。

## 完成內容

### 1. 管理頁下載 CSV

管理儀表板新增：

```text
下載 CSV
```

會呼叫：

```text
GET /admin/characters.csv?token=ADMIN_TOKEN
```

### 2. ADMIN_TOKEN 本機保存

前端保存位置：

```text
localStorage: penglai-admin-token
```

這只保存在教師使用的瀏覽器，不會寫入遊戲資料庫。

## Padlet AI 日誌簡記

Day37 讓教師管理頁可以直接下載 CSV，並在本機保存 ADMIN_TOKEN，讓管理頁更接近實際可用工具。
