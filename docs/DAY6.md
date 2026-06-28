# Day 6 工作內容

日期：2026-06-23  
專案：蓬萊異聞錄 Online  
主題：UI 視窗化、背包面板、任務面板、商店面板

## 今日目標

Day 6 的目標是把 Day 1 到 Day 5 累積出來的功能整理成比較像 MMORPG 的操作介面。  
前幾天的背包、任務、商店資訊都還是直接堆在 HUD 文字上，功能繼續增加後會不好閱讀，所以今天先做第一版 UI 視窗。

## 完成項目

### 1. 新增固定尺寸 UI 面板

在 Phaser `GameScene` 中新增共用面板建立方法：

```text
addUiPanel()
syncPanelVisibility()
```

目前建立三個面板：

```text
Bag
Quest
Shop
```

每個面板都有固定寬高、標題列、內容區，並固定在畫面上，不會跟著角色移動。

### 2. 背包面板

原本背包是左側一段文字，現在改成 `Bag` 面板。

目前顯示：

```text
Small HP Potion 數量
Rat Tail 數量
使用藥水提示
```

背包資料仍然來自 server 的 `inventory:update`，client 只負責顯示。

### 3. 任務面板

原本任務追蹤器是右上角文字，現在改成 `Quest` 面板。

目前會顯示：

```text
可接任務
進行中任務
可回報任務
已完成任務
```

任務進度仍然由 server 控制，client 收到 `quest:update` 後刷新面板。

### 4. 商店面板

新增 `Shop` 面板。

玩家必須先靠近 Merchant Chen 並按 `E` 互動，商店面板才會開啟。

目前商店顯示：

```text
Fog Harbor Goods
Small HP Potion x1
15 Gold
B Buy first item
```

離開商人附近後，商店面板會自動收起。

### 5. 新增 UI 快捷鍵

新增三個面板快捷鍵：

```text
I：開關 Bag
Q：開關 Quest
O：開關 Shop
```

商店面板只有在已經跟商人互動過、目前仍在商人附近時才會顯示。

## 驗證結果

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

也完成 WebSocket 商店流程測試：

1. 連線進入 server
2. 移動到 Merchant Chen 附近
3. 發送 NPC 互動
4. 收到 `shop:open`
5. 在 Gold 不足時嘗試購買
6. 收到正確的 Gold 不足提示

測試結果：

```text
openedShop: fog-harbor-goods
notice: Need 15 Gold for Small HP Potion x1.
```

## 修改範圍

主要修改：

```text
client/src/scenes/GameScene.ts
docs/DAY6.md
```

## 設計筆記

### 為什麼先做 UI 視窗化

目前已經有：

- 玩家狀態
- HP / EXP / Gold
- 背包
- 任務
- NPC
- 商店
- 掉落物
- 藥水

如果繼續把所有資訊塞在 HUD 文字，後面加裝備、技能、角色面板時會很難維護。  
因此 Day 6 先把 UI 整理成面板，讓後續功能有地方放。

### 為什麼沒有立刻做滑鼠點擊商店

今天先做鍵盤版商店，因為目前遊戲的主要操作仍然是鍵盤。  
滑鼠點擊、商品選取、購買數量，適合等商店商品變多後再做。

## Padlet AI 日誌簡記

今天完成 Day 6：把背包、任務、商店整理成正式 UI 面板，新增 `I` 開關背包、`Q` 開關任務、`O` 開關商店。商店面板會在跟 Merchant Chen 互動後開啟，離開商人附近會自動收起。這一步讓原本堆在 HUD 上的資訊變得比較像 MMORPG 介面，也為之後加入裝備、技能、角色面板做準備。

## 下一階段建議

Day 7 建議做 `技能系統第一版`：

1. 技能冷卻時間
2. MP 消耗
3. 技能傷害與普通攻擊分離
4. 技能快捷列
5. UI 顯示冷卻狀態

這會讓目前的 `J skill` 從單純強攻擊，變成真正的角色技能系統。
