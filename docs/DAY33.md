# Day 33 角色 CSV 匯出（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：教師端資料匯出

## 今日目標

讓教師可以匯出角色資料，方便放到試算表做課堂紀錄、觀察測試或除錯。

## 完成內容

### 1. 新增 CSV 匯出 API

```text
GET /admin/characters.csv?token=ADMIN_TOKEN
```

匯出欄位：

```text
save_slot
character_name
class_name
level
gold
account_email
hosted_domain
updated_at
```

### 2. CSV 格式處理

匯出時會處理：

```text
逗號
雙引號
換行
空值
```

避免角色名稱或帳號資料造成 CSV 欄位錯位。

## 修改檔案

```text
server/src/index.ts
server/src/persistence.ts
```

## Padlet AI 日誌簡記

Day33 做了角色 CSV 匯出。之後老師可以把角色等級、金幣、帳號 email、更新時間匯出到試算表，方便記錄學生測試狀況。
