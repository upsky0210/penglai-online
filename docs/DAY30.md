# Day 30 帳號存檔槽清單第一版（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：帳號存檔管理

## 今日目標

讓 Google 帳號可以看到自己綁定過的 save slot 摘要，為後續多角色選單與教師後台做準備。

## 完成內容

### 1. 新增帳號存檔槽查詢

新增：

```text
GET /account/save-slots?session=sess_xxx
```

回應：

```json
{
  "saveSlots": [
    {
      "saveSlot": "slot-id",
      "characterName": "角色名稱",
      "level": 3,
      "updatedAt": 1234567890
    }
  ]
}
```

### 2. 後端 join 角色資料

帳號存檔槽清單會從兩個表整合：

```text
account_save_slots
characters
```

可顯示：

```text
save slot
角色名稱
等級
最後更新時間
```

### 3. 前端存檔面板顯示帳號摘要

存檔面板現在顯示：

```text
目前 save slot
上一個 save slot
Google 帳號
最近三個帳號存檔槽
```

這一版先做唯讀摘要，不做完整切換 UI。完整多角色選單可排到下一階段。

## 驗證

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

結果：

```text
TypeScript typecheck 通過
Client production build 通過
GET /health 通過
GET /auth/session 無效 session 正確回 401
POST /auth/logout 通過
GET /account/save-slots 無效 session 正確回 401
WebSocket session:welcome smoke test 通過
```

## Padlet AI 日誌簡記

Day30 做出帳號存檔槽清單第一版。登入後可以在存檔面板看到帳號綁定過的角色與存檔摘要，之後可以延伸成多角色選單或教師端查詢。
