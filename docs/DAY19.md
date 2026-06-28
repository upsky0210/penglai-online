# Day 19 開發紀錄
日期：2026-06-25  
專案：蓬萊異聞錄 Online  
主題：新 NPC、新材料與新任務

## 今日目標

Day 18 已加入右側新區域與海霧史萊姆。  
Day 19 的目標是讓新區域有任務用途，而不是只有多幾隻怪。

## 完成內容

### 1. 新 NPC

新增 NPC：

```text
燈塔學徒阿澄
位置：燈塔營地
互動半徑：76
```

玩家靠近後可按 `E` 互動。

### 2. 新材料

新增材料：

```text
mist-gel -> 海霧凝膠
```

海霧史萊姆死亡後會掉落海霧凝膠。

### 3. 新任務

新增任務：

```text
霧燈補給
NPC：燈塔學徒阿澄
目標：收集 2 個海霧凝膠
獎勵：52 經驗、30 金幣
```

這條任務沿用 Day10 之後的任務與 SQLite 存檔系統。  
新舊存檔進入遊戲時，也會自動合併目前任務表。

### 4. 任務文字泛用化

任務追蹤與 server 任務提示不再固定寫田鼠。  
現在會依照任務目標顯示：

```text
收集任務：顯示物品名稱
擊殺任務：顯示怪物名稱
```

這讓後續新增怪物與任務比較容易。

### 5. 背包顯示新材料

背包面板新增：

```text
海霧凝膠 xN
```

玩家拾取後可以直接看到數量。

## 修改檔案

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY19.md
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

WebSocket 驗證：

```text
靠近 lighthouse-apprentice 後送 npc:interact
mist-gel-lantern 任務狀態變成 active
擊倒 slime-1 後產生 itemId = mist-gel 的掉落物
```

## Padlet AI 日誌簡要版

今天完成 Day 19：新增燈塔學徒阿澄、新材料海霧凝膠，以及新任務「霧燈補給」。玩家可以到右側燈塔營地找阿澄接任務，打海霧史萊姆取得海霧凝膠後回報領取經驗與金幣。這次也順手把任務文字改得更泛用，之後新增更多怪物或收集任務時，不會再被原本田鼠任務的文字綁住。
