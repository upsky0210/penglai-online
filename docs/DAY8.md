# Day 8 工作內容

日期：2026-06-23  
專案：蓬萊異聞錄 Online  
主題：裝備系統第一版、ATK / DEF、角色面板

## 今日目標

Day 8 的目標是把道具系統從消耗品、材料擴充到裝備。  
玩家現在可以擁有武器與防具，裝備後會改變角色 ATK / DEF，並實際影響打怪傷害與受傷傷害。

## 完成項目

### 1. 新增裝備資料結構

在 shared package 新增：

```text
EquipmentSlot
EquipmentSnapshot
equipment item definition
```

目前裝備欄位：

```text
weapon
armor
```

### 2. 新增兩件 starter equipment

新增兩件起始裝備：

```text
Training Sword
部位：weapon
效果：ATK +6

Cloth Vest
部位：armor
效果：DEF +4
```

玩家剛連線時，背包會自動擁有：

```text
Training Sword x1
Cloth Vest x1
```

但不會自動穿上，方便測試裝備前後差異。

### 3. Server 權威裝備流程

新增 client message：

```text
inventory:equip
```

新增 server message：

```text
equipment:update
```

server 會檢查：

- 玩家是否活著
- 背包裡是否有該道具
- 該道具是否為 equipment
- 該裝備屬於哪個 slot

裝備成功後：

- 更新 equipment slot
- 重新計算 ATK / DEF
- 發送 `equipment:update`
- 發送 `item:notice`
- 廣播 world snapshot

### 4. ATK 影響攻擊

普通攻擊現在改用角色 ATK。

目前設定：

```text
基礎 ATK：12
Training Sword：ATK +6
裝備後 ATK：18
```

所以裝備 Training Sword 後，`K` 普攻從 12 傷害變成 18 傷害。

技能 `Spirit Slash` 也會吃武器加成：

```text
Spirit Slash 基礎傷害：24
Training Sword 加成：+6
裝備後技能傷害：30
```

### 5. DEF 影響受傷

怪物碰撞傷害會被 DEF 減免。

目前設定：

```text
Field Rat 碰撞傷害：12
Cloth Vest：DEF +4
裝備後實際傷害：8
```

### 6. Client UI 更新

新增 Character 面板。

顯示：

```text
ATK
DEF
Weapon
Armor
```

新增快捷鍵：

```text
C：開關 Character 面板
2：裝備 Training Sword
3：裝備 Cloth Vest
```

Bag 面板也會顯示裝備，已裝備的項目會標記 `[E]`。

## 驗證結果

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

也完成 WebSocket 裝備流程測試：

1. 連線進入 server
2. 確認初始背包有 Training Sword 與 Cloth Vest
3. 確認初始 ATK / DEF 是 12 / 0
4. 裝備 Training Sword
5. 確認 ATK 變成 18
6. 使用 K 普攻 Field Rat
7. 確認傷害為 18
8. 裝備 Cloth Vest
9. 確認 DEF 變成 4
10. 接觸 Field Rat
11. 確認受傷從 12 降為 8

測試結果：

```text
Initial ATK / DEF：12 / 0
Equipped ATK / DEF：18 / 4
Normal attack damage：18
Contact damage：8
```

## 修改範圍

主要修改：

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY8.md
```

## 設計筆記

### 為什麼先做 starter equipment

目前還沒有完整掉寶表、商店選單或裝備任務。  
為了先驗證裝備系統本身，Day 8 讓玩家出生時直接拿到 starter equipment。

這樣可以先確認：

- 背包能裝 equipment
- server 能裝備 item
- ATK / DEF 能重新計算
- 裝備能影響戰鬥
- client 能顯示角色能力

### 為什麼裝備仍由 server 判定

裝備會影響傷害與受傷，屬於線上遊戲核心狀態。  
client 只能送出「我要裝備這個 item」，server 才能決定是否真的裝備成功。

## Padlet AI 日誌簡記

今天完成 Day 8：新增裝備系統第一版。玩家一開始會拿到 Training Sword 和 Cloth Vest，可以按 `2` 裝備劍、按 `3` 裝備背心，角色面板會顯示 ATK / DEF。裝備劍後普攻傷害從 12 變成 18；裝備背心後被 Field Rat 撞到的傷害從 12 降成 8。這一步讓角色開始有養成感，也讓裝備真正影響戰鬥，而不是只顯示在背包裡。

## 下一階段建議

Day 9 建議做 `掉寶與裝備取得流程`：

1. Field Rat 有機率掉 Cloth Vest 或 Training Sword
2. 商店可以購買裝備
3. 裝備道具不再只是出生贈送
4. Bag 面板支援更多裝備顯示
5. 裝備重複取得時可堆疊或轉成 Gold
