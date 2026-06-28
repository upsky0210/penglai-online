# Day 9 工作內容

日期：2026-06-23  
專案：蓬萊異聞錄 Online  
主題：裝備取得流程、怪物掉落、商店多商品選取

## 今日目標

Day 9 的目標是讓 Day 8 的裝備系統進入正式遊戲循環。  
前一天玩家出生時會直接拿到 Training Sword 和 Cloth Vest，這比較像測試資料。今天改成：

```text
打怪掉裝備
任務賺 Gold
商店購買裝備
再裝備提升 ATK / DEF
```

## 完成項目

### 1. 移除出生贈送裝備

玩家剛進遊戲時，背包不再自動擁有：

```text
Training Sword
Cloth Vest
```

初始狀態改為：

```text
Bag：空
ATK：12
DEF：0
Weapon：None
Armor：None
```

這讓裝備取得變成實際遊戲流程，而不是測試用內建資料。

### 2. Field Rat 會掉裝備

Field Rat 被擊倒後，除了原本的：

```text
Small HP Potion
Rat Tail
```

現在也有機率掉落：

```text
Training Sword
Cloth Vest
```

目前掉落率：

```text
Training Sword：18%
Cloth Vest：24%
```

### 3. Merchant Chen 販售裝備

Fog Harbor Goods 新增商品：

```text
Small HP Potion：15 Gold
Training Sword：25 Gold
Cloth Vest：20 Gold
```

這樣玩家可以用任務獎勵購買裝備。

### 4. 商店支援多商品選取

原本 Day 5 商店只能用 `B` 購買第一個商品。  
Day 9 改成：

```text
N：切換商品
B：購買目前選取商品
```

商店面板會用 `>` 標記目前選取的商品。

### 5. 裝備流程更清楚

如果玩家按 `2` 或 `3` 但背包沒有裝備，server 會回覆：

```text
You do not have Training Sword.
You do not have Cloth Vest.
```

避免玩家以為快捷鍵沒有作用。

## 驗證結果

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

也完成 WebSocket 端到端測試：

1. 連線進入遊戲
2. 確認初始背包為空
3. 確認初始 ATK / DEF 為 12 / 0
4. 接 Harbor Guard 的 Field Rat 任務
5. 打倒 Field Rat
6. 撿取掉落的 Training Sword
7. 裝備 Training Sword
8. 確認 ATK 變成 18
9. 完成 Field Rat 任務取得 25 Gold
10. 找 Merchant Chen 開商店
11. 購買 Cloth Vest
12. 裝備 Cloth Vest
13. 確認 DEF 變成 4

測試結果：

```text
Initial inventory：空
Initial ATK / DEF：12 / 0
Training Sword：由 Field Rat 掉落取得
Cloth Vest：由 Merchant Chen 購買取得
Final ATK / DEF：18 / 4
Final Gold：5
```

## 修改範圍

主要修改：

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY9.md
```

## 設計筆記

### 為什麼裝備不再出生贈送

出生直接送裝備雖然方便測試，但不像正式 RPG 流程。  
Day 9 改成玩家必須透過打怪或商店取得裝備，才會有「變強」的過程。

### 為什麼商店要支援選取

商店開始販售多個商品後，只靠 `B` 買第一個商品不夠用。  
因此新增 `N` 切換商品，保留 `B` 作為購買鍵，操作仍然簡單。

### 為什麼測試有掉落倍率

正常遊戲使用真實掉落率。  
測試時為了避免隨機掉落造成測試不穩，server 支援 `EQUIPMENT_DROP_CHANCE_MULTIPLIER` 環境變數，測試可把倍率調高。

## Padlet AI 日誌簡記

今天完成 Day 9：裝備不再是出生贈送，而是可以從 Field Rat 掉落或從 Merchant Chen 商店購買。Field Rat 現在有機率掉 Training Sword 和 Cloth Vest，商店也新增裝備商品，並加入 `N` 切換商品、`B` 購買目前商品。測試結果確認：初始背包為空，打怪取得 Training Sword 後 ATK 從 12 變 18，完成任務取得 Gold 後購買 Cloth Vest，DEF 從 0 變 4。這讓裝備真正進入「打怪、賺錢、購買、變強」的遊戲循環。

## 下一階段建議

Day 10 建議做 `存檔系統第一版`：

1. 使用 SQLite 儲存角色資料
2. 保存 level / exp / gold
3. 保存 inventory
4. 保存 equipment
5. 保存 quest progress
6. 重新連線後恢復角色狀態
