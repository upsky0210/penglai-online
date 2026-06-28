# Day 2 工作紀錄

日期：2026-06-23  
專案名稱：蓬萊異聞錄 Online  
主題：道具掉落、背包、補血藥水

## 今日目標

在 Day 1 的打怪、升級、NPC 任務基礎上，加入第一個道具系統：

玩家擊殺怪物 -> 怪物掉落物品 -> 玩家拾取 -> 背包更新 -> 使用道具補血。

## 今日完成內容

### 1. Shared 型別擴充

新增道具與背包相關資料：

- `ItemId`
- `ItemDefinition`
- `InventorySlot`
- `ItemDropSnapshot`
- `ITEM_DEFINITIONS`

目前第一個道具：

```text
Small HP Potion
效果：恢復 35 HP
堆疊上限：20
```

### 2. Server 道具流程

新增 server authoritative 的道具系統：

- 怪物死亡時產生掉落物
- 掉落物存在於 server world state
- 掉落物會出現在 `world:snapshot`
- 玩家靠近掉落物才能拾取
- 拾取後 server 更新 inventory
- 使用道具時由 server 判定是否可用
- HP 滿時不消耗藥水
- 使用藥水後 server 更新玩家 HP

新增訊息：

```text
item:pickup
inventory:use
inventory:update
item:notice
```

### 3. Client 顯示與操作

新增前端功能：

- 地圖上顯示掉落物
- 掉落物有簡單浮動效果
- 靠近掉落物顯示 `F Pick up`
- 按 `F` 拾取
- 背包 HUD 顯示 `Small HP Potion`
- 按 `1` 使用藥水
- 使用藥水後顯示補血浮字

新增操作：

```text
F：拾取地上物品
1：使用 Small HP Potion
```

### 4. 驗證紀錄

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

WebSocket 自動測試通過：

1. 擊殺 `rat-1`
2. server 產生 `Small HP Potion`
3. 玩家移動到掉落物旁
4. 送出 `item:pickup`
5. inventory 變成 `Small HP Potion x1`
6. 玩家碰怪扣血
7. 送出 `inventory:use`
8. HP 回到 100
9. inventory 變回空

測試結果：

```text
Picked up Small HP Potion x1
Used Small HP Potion
Healed 12 HP
HP returned to 100
```

## 今日技術重點

### Server authoritative

道具流程沒有讓 client 直接改背包或 HP。client 只送出請求：

- 我要撿這個掉落物
- 我要使用這個道具

真正的判定由 server 負責：

- 是否距離足夠
- 掉落物是否存在
- 背包是否有道具
- HP 是否需要恢復
- 使用後扣除道具數量

### 道具資料共用

道具定義放在 `shared`，讓 client 和 server 使用同一份資料，避免前後端道具名稱或效果不同步。

## 目前可玩的內容

玩家現在可以：

- 移動、跳躍
- 打怪
- 取得 EXP
- 升級
- 被怪物碰到扣血
- 死亡後重生
- 找 NPC 接任務
- 完成擊殺任務領獎
- 擊殺怪物取得掉落物
- 拾取 Small HP Potion
- 使用藥水補血

## 下一步建議

Day 3 可以優先做：

1. 拆分 `client/src/main.ts`
2. 建立正式 inventory panel
3. 加入第二種掉落物：Rat Tail
4. 讓 NPC 任務需要收集 Rat Tail
5. 加入商店 NPC
6. 建立 SQLite 存檔 prototype

## 今日結論

Day 2 完成了第一個道具與背包雛形。遊戲目前已經具備基本 MMORPG loop：

打怪 -> 掉落 -> 拾取 -> 背包 -> 使用道具 -> 繼續戰鬥。

