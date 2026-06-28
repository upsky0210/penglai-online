# Day 24 開發紀錄
日期：2026-06-26  
專案：蓬萊異聞錄 Online  
主題：帳號與角色資料模型預備

## 今日目標

後續預計加入 Google 學校帳號登入。  
Day 24 的目標是先設計資料庫層，讓目前的 save slot 原型能逐步升級成正式帳號系統。

這一天不實作 Google 登入流程，只做資料模型預留，避免一次改動太大。

## 完成內容

### 1. 新增 accounts 表

新增 SQLite table：

```sql
accounts
```

欄位用途：

```text
account_id        遊戲內帳號 ID
provider          登入提供者，目前預留 google
provider_subject  Google ID token 裡的 sub
email             Google 帳號 email
hosted_domain     Google Workspace 網域 hd
display_name      顯示名稱
created_at
updated_at
```

設計重點：

```text
不使用 email 當主鍵
使用 provider + provider_subject 當唯一登入身份
```

原因是 Google 帳號的 `sub` 才是穩定唯一識別。

### 2. 新增 account_save_slots 表

新增 SQLite table：

```sql
account_save_slots
```

用途：

```text
把正式 account 綁定到現有 save_slot
保留目前 Day10-21 的 save slot 存檔系統
未來登入後可找到該學生的角色
```

這讓 migration 比較平滑，不需要立刻重寫所有存檔表。

### 3. 新增 auth_sessions 表

新增 SQLite table：

```sql
auth_sessions
```

用途：

```text
保存登入 session
讓 WebSocket 之後可以使用 session 驗證
支援過期時間與撤銷時間
```

目前尚未接入 server WebSocket 驗證流程。

### 4. 保持現有玩法不變

這次只是建立 table：

```text
現有角色存檔仍用 save_slot
現有 client 仍用 localStorage save slot
現有 WebSocket 連線方式不變
```

因此不影響 Day1-23 已完成的玩法。

## 修改檔案

```text
server/src/persistence.ts
docs/DAY24.md
```

## 測試結果

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

結果：

```text
shared typecheck 通過
server typecheck 通過
client typecheck 通過
client build 通過
```

## 下一步：Google 登入建議拆法

建議 Day25-27 再實作：

```text
Day25：Google Sign-In client 與 server token 驗證第一版
Day26：限制學校 Google Workspace 網域 hd
Day27：登入 session 串接 WebSocket，save slot 綁定 account
```

## Padlet AI 日誌簡要版

今天完成 Day 24：帳號與角色資料模型預備。因為之後想讓學生用學校 Google 帳號登入，所以今天先在 SQLite 裡新增 `accounts`、`account_save_slots`、`auth_sessions` 三張表。這次沒有直接做 Google 登入，而是先把資料庫地基鋪好，讓目前的 save slot 存檔系統未來可以平滑接到正式帳號。重點是未來不要用 email 當主鍵，而是使用 Google ID token 裡穩定的 `sub` 作為登入身份。
