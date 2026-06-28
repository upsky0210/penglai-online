# Day 4 工作紀錄

日期：2026-06-23  
專案名稱：蓬萊異聞錄 Online  
主題：Rat Tail 掉落與收集任務

## 今日目標

在 Day 2 的背包與掉落系統之上，加入第一個收集型任務，讓任務不只依賴擊殺數，也能檢查玩家背包裡的道具數量。

## 今日完成內容

### 1. 新增道具：Rat Tail

新增材料道具：

```text
Rat Tail
類型：material
用途：任務收集道具
```

目前 Field Rat 死亡後會掉落：

```text
Small HP Potion x1
Rat Tail x1
```

### 2. 新增 NPC：Herbalist Lin

新增第二個 NPC：

```text
Herbalist Lin
位置：安全區左側
功能：提供 Rat Tail 收集任務
```

玩家靠近後可以按 `E` 對話與接任務。

### 3. 新增任務：Rat Tail Salve

任務資料：

```text
任務名稱：Rat Tail Salve
NPC：Herbalist Lin
目標：收集 Rat Tail x2
獎勵：EXP +35 / Gold +20
完成時：消耗 Rat Tail x2
```

### 4. 任務系統泛化

Day 1 的任務只支援單一擊殺任務。今天改成每位玩家可同時持有多個任務。

新增任務 objective 類型：

```text
kill：擊殺指定怪物
collect：收集指定道具
```

目前支援兩個任務：

```text
Clear the Field Rats：擊殺 3 隻 Field Rat
Rat Tail Salve：收集 2 個 Rat Tail
```

### 5. Server 判定收集任務

收集任務由 server 判定：

- 玩家拾取 Rat Tail 後，server 更新 inventory
- server 檢查任務進度
- 收集足夠後任務變成 `ready`
- 回 NPC 領獎時 server 再確認背包數量
- 完成任務時扣除 Rat Tail
- 發放 EXP / Gold

### 6. Client 顯示更新

前端更新：

- 背包 HUD 顯示 `Rat Tail`
- 任務追蹤可同時顯示多個任務
- 收集任務顯示進度：`Rat Tail 0/2`
- 任務完成後顯示 `Done`

## 驗證紀錄

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

WebSocket 自動測試通過：

1. 與 `Herbalist Lin` 對話
2. 接取 `Rat Tail Salve`
3. 擊殺 `rat-1`
4. 拾取 `Rat Tail x1`
5. 擊殺 `rat-2`
6. 拾取 `Rat Tail x1`
7. 任務進度變成 `2/2`
8. 任務狀態變成 `ready`
9. 回 `Herbalist Lin` 領獎
10. Rat Tail 被扣除
11. 獲得 EXP 與 Gold

測試結果：

```text
任務完成後：LV 2 / EXP 11 / Gold 20
背包：Rat Tail x0
```

## 今日技術重點

### 任務 objective

任務不再只寫死成擊殺任務，而是改成 objective 結構：

```text
kill objective
collect objective
```

這讓之後可以繼續加入：

- 對話任務
- 探索任務
- 收集多種材料
- 擊敗 Boss

### Server authoritative

收集任務沒有讓 client 自己決定完成。client 只負責顯示與送互動請求，真正的背包數量、任務完成、物品消耗與獎勵都由 server 判定。

## 下一步建議

Day 5 可以做：

1. 商店 NPC：販售 Small HP Potion
2. Gold 消費
3. 正式背包面板
4. 拆分 `GameScene.ts` 裡的 HUD / WebSocket / renderers
5. SQLite 存檔 prototype

## 今日結論

Day 4 完成第一個材料收集任務，讓背包系統開始參與任務流程。現在遊戲已有兩種任務類型：擊殺任務與收集任務。

