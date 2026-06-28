# Day 10 開發紀錄

日期：2026-06-23  
專案：蓬萊異聞錄 Online  
主題：存檔系統第一版

## 今日目標

Day 10 的重點是讓遊戲從「每次重開都歸零」進入「可以留下角色進度」的階段。  
這一版先不做帳號登入，也不做角色選單，而是用瀏覽器本機產生的 save slot 連到 server，server 再用 SQLite 儲存玩家資料。

```text
同一台電腦
同一個瀏覽器
同一個 save slot
重新連線後可以讀回角色進度
```

## 實作內容

### 1. Server SQLite 存檔

新增 server 端 SQLite 存檔模組：

```text
server/src/persistence.ts
```

預設資料庫位置：

```text
server/data/penglai.sqlite
```

也可以用環境變數改資料庫位置：

```text
PENGLAI_DB_PATH
```

目前建立四張資料表：

```text
characters
inventory_items
equipment_items
quest_states
```

### 2. 存檔欄位

目前第一版會儲存：

```text
角色名稱
職業
等級
經驗值
下一級所需經驗
金幣
HP
MP
位置 x / y
面向
背包物品
裝備 weapon / armor
任務狀態
任務進度
```

### 3. Client Save Slot

client 端新增 save slot 機制。  
遊戲第一次開啟時，瀏覽器會把一組 save slot 存進 localStorage。

```text
localStorage key: penglai-save-slot
```

之後 WebSocket 連線會帶上：

```text
?slot=<save-slot>
```

server 會依照這個 slot 讀取或建立角色資料。

### 4. 自動儲存時機

目前會在下列事件後寫入存檔：

```text
第一次連線建立角色
撿物品
使用藥水
裝備物品
接受任務
任務進度更新
完成任務
商店購買
擊敗怪物並獲得經驗
WebSocket 關閉連線
```

這樣可以先支援「打怪、升級、撿裝、解任務、買東西、重開後還在」的核心流程。

## 測試紀錄

執行檢查：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

測試結果：

```text
shared typecheck 通過
server typecheck 通過
client typecheck 通過
client build 通過
```

另外做了一次 WebSocket + SQLite 重新連線測試：

```text
1. 用指定 save slot 連線
2. 接 Harbor Guard 任務
3. 打倒 3 隻 Field Rat
4. 撿 Training Sword
5. 裝備 Training Sword
6. 回任務並領取獎勵
7. 關閉連線
8. 用同一個 save slot 重新連線
```

重新連線前：

```text
Level: 2
EXP: 43
EXP To Next: 105
Gold: 25
Inventory: Training Sword x1
Weapon: Training Sword
Armor: none
ATK: 18
Quest field-rat-cleanup: completed, progress 3
```

重新連線後：

```text
Level: 2
EXP: 43
EXP To Next: 105
Gold: 25
Inventory: Training Sword x1
Weapon: Training Sword
Armor: none
ATK: 18
Quest field-rat-cleanup: completed, progress 3
```

測試結論：同一個 save slot 可以正確讀回角色、背包、裝備、金幣、經驗值與任務進度。

## 修改檔案

```text
.gitignore
shared/src/index.ts
server/src/persistence.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY10.md
```

## Padlet AI 日誌簡記

今天完成 Day 10：存檔系統第一版。這次讓遊戲開始有「角色進度會留下來」的能力，server 使用 SQLite 儲存角色等級、經驗值、金幣、HP/MP、位置、背包、裝備與任務進度；client 則用 localStorage 產生 save slot，之後同一個瀏覽器重新連線就會讀回同一份存檔。測試時先接 Harbor Guard 的打 3 隻 Field Rat 任務，打怪升到 Level 2，撿到並裝備 Training Sword，再完成任務取得金幣；關掉連線後重新進入，角色等級、經驗、金幣、裝備與任務完成狀態都有成功保留下來。

## 下一步建議

Day 11 可以做「存檔管理介面」：

```text
顯示目前 save slot
新增重開角色按鈕
簡單角色選單
匯出 / 匯入存檔
測試用清除存檔功能
```

這樣之後測試多角色、不同任務進度或課堂展示會比較方便。
