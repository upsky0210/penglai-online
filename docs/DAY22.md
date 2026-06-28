# Day 22 開發紀錄
日期：2026-06-26  
專案：蓬萊異聞錄 Online  
主題：設定與常用資料集中化第一版

## 今日目標

Day 1 到 Day 21 已完成可玩的 MMORPG prototype。  
Day 22 開始進入整理期，先把容易散落的 client 設定集中，為後續 Google 登入、UI 整理與 LAN 測試鋪路。

## 完成內容

### 1. 新增 clientConfig

新增：

```text
client/src/game/clientConfig.ts
```

集中管理：

```text
save slot localStorage key
previous save slot localStorage key
character draft localStorage key
角色名稱預設值
fallback MP
```

### 2. GameScene 改用集中設定

`GameScene.ts` 不再直接宣告這些 localStorage key。  
後續如果要改 key 名稱或加上版本前綴，只需要改 `clientConfig.ts`。

### 3. 整理目的

這次整理不是大重構，而是先把「未來會常改的設定」集中。

後續適合繼續集中：

```text
UI 顯示文字
快捷鍵設定
地圖區域提示
新手教學文字
Google 登入設定
```

## 修改檔案

```text
client/src/game/clientConfig.ts
client/src/scenes/GameScene.ts
docs/DAY22.md
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

## Padlet AI 日誌簡要版

今天完成 Day 22：設定與常用資料集中化第一版。前 21 天已經做出可玩的原型，但一些設定還散在主場景裡。今天先新增 `clientConfig.ts`，把 save slot、上一個 save slot、角色草稿等 localStorage key，以及角色預設名稱集中管理。這是整理期的第一步，目標是讓後續要做 Google 登入、UI 整理或設定調整時，不用到大檔案裡到處找設定。
