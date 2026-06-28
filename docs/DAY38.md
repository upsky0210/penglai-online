# Day 38 角色清單搜尋與篩選（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：教師端角色查詢

## 今日目標

讓教師可以更快找到學生角色，而不是只看最近資料。

## 完成內容

### 1. 新增角色 JSON API

新增：

```text
GET /admin/characters?token=ADMIN_TOKEN&limit=500
```

回傳：

```json
{
  "characters": []
}
```

### 2. 管理頁搜尋

可搜尋：

```text
角色名稱
帳號 email
hosted domain
save slot
```

### 3. 職業篩選

可依職業篩選：

```text
劍士
符術師
獵人
```

## Padlet AI 日誌簡記

Day38 補上角色清單搜尋與職業篩選，也新增 `/admin/characters` JSON API，讓教師管理頁可以查更多角色資料。
