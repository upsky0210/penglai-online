# Day 62 多地圖資料結構（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：把世界從單一測試場改成可擴充多地圖資料結構。

## 完成內容

新增地圖 ID 與地圖集合：

```text
MapId
GAME_MAPS
DEFAULT_GAME_MAP
getGameMap()
```

玩家、怪物、掉落物新增 `mapId`，讓後端可以區分不同地圖中的玩家、怪物與掉落。

## 新增地圖

```text
霧港試煉場：原本測試地圖
海霧堤道：第一張延伸關卡地圖
```

## 修改檔案

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
```

## Padlet AI 日誌簡述

Day62 建立多地圖資料結構，新增 `mapId` 與 `GAME_MAPS`，讓玩家、怪物與掉落物可以依地圖分流，開始從單一測試場走向真正關卡。
