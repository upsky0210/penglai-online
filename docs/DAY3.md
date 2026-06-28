# Day 3 工作紀錄

日期：2026-06-23  
專案名稱：蓬萊異聞錄 Online  
主題：前端架構整理

## 今日目標

Day 1 和 Day 2 已經快速加入很多玩法：

- 角色移動
- 打怪
- EXP / Level
- HP / 死亡重生
- NPC 任務
- 掉落物
- 背包
- HP 藥水

因此 Day 3 先不新增大型玩法，而是整理前端檔案結構，避免 `client/src/main.ts` 持續膨脹。

## 今日完成內容

### 1. 拆分前端入口

原本 `client/src/main.ts` 同時負責：

- 匯入樣式
- 定義 Phaser 遊戲設定
- 定義整個遊戲場景
- 處理玩家控制
- 處理 WebSocket
- 處理 UI
- 處理怪物、道具、任務

今天將它整理成：

```text
client/src/main.ts
```

只保留 Phaser 遊戲啟動入口。

### 2. 新增 GameScene

新增：

```text
client/src/scenes/GameScene.ts
```

目前所有遊戲場景邏輯移到這裡：

- 建立地圖
- 建立角色
- 建立平台
- 建立 NPC
- 建立 HUD
- 處理鍵盤操作
- 處理 WebSocket 訊息
- 顯示怪物
- 顯示掉落物
- 顯示任務和背包狀態

### 3. 新增遊戲常數

新增：

```text
client/src/game/constants.ts
```

目前放：

```text
gameWidth
gameHeight
moveSpeed
jumpSpeed
```

### 4. 新增 view 型別

新增：

```text
client/src/game/viewTypes.ts
```

目前放：

```text
MonsterView
ItemDropView
```

這樣掉落物和怪物的畫面物件型別不再塞在入口檔案中。

## 驗證紀錄

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

這代表拆檔後 TypeScript 與 Vite build 都正常。

## 今日沒有新增的內容

今天刻意沒有新增：

- 新怪物
- 新任務
- 新 NPC
- 新地圖
- 存檔系統

原因是目前前端主檔案已經太大，如果繼續加功能，後面會越來越難維護。

## 目前前端結構

```text
client/src/
  main.ts
  styles.css
  game/
    constants.ts
    viewTypes.ts
  scenes/
    GameScene.ts
```

## 下一步建議

Day 4 可以繼續拆：

1. 把 HUD 建立與更新拆到 `ui/`
2. 把 WebSocket send / receive 拆到 `net/`
3. 把怪物與掉落物繪製拆到 `renderers/`
4. 或改做新功能：Rat Tail 掉落與收集任務

## 今日結論

Day 3 完成第一階段前端整理。遊戲功能沒有改變，但專案結構比 Day 2 更清楚，後續要加商店、背包面板、第二任務或存檔會比較容易。

