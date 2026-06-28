# Day 48 全班聊天鎖（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：課堂控場第二階段

## 今日目標

讓教師可以暫停全班聊天，適合講解規則、收束活動或避免聊天干擾。

## 完成內容

### 1. 新增 classroom API

查詢：

```text
GET /admin/classroom?token=ADMIN_TOKEN
```

更新：

```text
POST /admin/classroom?token=ADMIN_TOKEN
```

請求：

```json
{
  "chatLocked": true,
  "chatLockMessage": "課堂聊天已暫停，請聽老師說明。"
}
```

### 2. 聊天鎖行為

聊天鎖啟用時，所有玩家的聊天不會廣播，只會收到教師設定的提示。

### 3. 管理頁操作

教師管理頁新增：

```text
聊天鎖提示
鎖定聊天 / 解除聊天鎖
```

## Padlet AI 日誌簡記

Day48 新增全班聊天鎖。老師可以一鍵暫停全班聊天，並自訂提示文字，適合課堂講解或活動收尾。
