# Day 5 工作內容

日期：2026-06-23  
專案：蓬萊異聞錄 Online  
主題：商人 NPC、商店購買、Gold 消費

## 今日目標

Day 5 的目標是讓 Day 3、Day 4 建立起來的經驗值、任務獎勵、背包與藥水系統形成第一個完整循環：

```text
打怪 -> 撿道具 -> 完成任務 -> 獲得 Gold -> 找商人購買藥水 -> 背包更新
```

這代表 Gold 不再只是 HUD 上的數字，而是可以被實際消費的遊戲資源。

## 完成項目

### 1. 新增 Merchant Chen

在 Fog Harbor Test Field 新增第三位 NPC：

```text
Merchant Chen
位置：安全區附近
功能：販售 Small HP Potion
```

玩家靠近後可以按 `E` 互動開啟商店提示。

### 2. 新增商店資料結構

在 shared package 新增商店共用資料：

```text
ShopDefinition
ShopItem
SHOP_DEFINITIONS
FOG_HARBOR_SHOP
```

目前第一間商店販售：

```text
Small HP Potion x1
價格：15 Gold
```

### 3. Server 權威交易流程

商店交易由 server 判定，不由 client 自行扣錢或加道具。

server 會檢查：

- 玩家是否活著
- 玩家是否靠近 Merchant Chen
- 商品是否存在於該商店
- 玩家 Gold 是否足夠
- 購買數量是否合理

交易成功後：

- 扣除 Gold
- 增加背包內的 Small HP Potion
- 發送 inventory update
- 發送 shop notice
- 廣播 world snapshot 更新 HUD

### 4. Client 操作更新

新增操作：

```text
E：跟 NPC 互動
B：在商店開啟後購買第一個商品
1：使用 Small HP Potion
```

玩家與 Merchant Chen 對話後，畫面會提示：

```text
Small HP Potion x1 costs 15 Gold. Press B to buy.
```

購買成功後會顯示：

```text
Bought Small HP Potion x1 for 15 Gold.
```

## 驗證結果

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

也完成 WebSocket 端到端測試：

1. 連線進入遊戲
2. 找 Herbalist Lin 接 `Rat Tail Salve`
3. 擊倒兩隻 Field Rat
4. 撿取 Rat Tail x2
5. 回 Herbalist Lin 交任務
6. 獲得 20 Gold
7. 找 Merchant Chen 開商店
8. 花費 15 Gold 購買 Small HP Potion x1

測試結果：

```text
Rat Tail Salve：completed
Gold：20 -> 5
Small HP Potion：x1
商店：fog-harbor-goods
```

## 今日新增檔案與修改範圍

主要修改：

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY5.md
```

## 設計筆記

### 為什麼先做商店

商店是 MMORPG 經濟系統的最小可行版本。  
只要有商店，就能測試：

- 任務獎勵是否有用途
- 背包能不能增加商品
- 消耗品是否能進入戰鬥循環
- server 是否能管理玩家資產

### 為什麼交易放在 server

線上遊戲中，Gold、道具、任務獎勵都不能由 client 自己決定。  
client 只送出「我要買」的請求，server 才決定能不能買、扣多少錢、給什麼道具。

這個做法可以避免之後出現：

- 偽造金錢
- 偽造道具
- 遠距離購買
- 購買不存在的商品

## Padlet AI 日誌簡記

今天完成 Day 5：新增商人 NPC 與商店購買系統。玩家可以先打怪、撿 Rat Tail、完成任務取得 Gold，再找 Merchant Chen 花 15 Gold 購買 Small HP Potion。這讓遊戲第一次形成「任務獎勵 -> 金錢 -> 消費 -> 背包」的完整循環，也確認交易邏輯必須由 server 判定，不能只靠 client 畫面操作。

## 下一階段建議

Day 6 可以進入下列其中一個方向：

1. 做裝備系統：武器、防具、攻擊力、防禦力
2. 做技能系統：冷卻時間、MP 消耗、技能傷害
3. 做 UI 美化：背包視窗、任務視窗、商店視窗
4. 做帳號與存檔：SQLite 保存角色、Gold、Inventory、Quest

建議下一步先做 `UI 視窗化`，因為現在功能已經開始變多，HUD 文字很快會不夠用。
