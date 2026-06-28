# Day 1 工作紀錄

日期：2026-06-22  
專案名稱：蓬萊異聞錄 Online  
類型：2D 像素橫向平台 MMORPG Prototype

## 今日目標

建立一個可以在本機跑起來的網頁遊戲骨架，並完成第一個可玩的核心循環：

玩家進入地圖 -> 移動跳躍 -> 打怪 -> 得到 EXP -> 升級 -> 接 NPC 任務 -> 完成任務領獎。

## 開發環境

- 主要工具：Codex Desktop
- 作業系統：Windows
- 執行方式：PowerShell 使用 `npm.cmd`
- 前端：Phaser 3 + TypeScript + Vite
- 後端：Node.js + WebSocket
- 共用資料：TypeScript shared package
- 專案路徑：`C:\AI\Codex\penglai-online`

## 專案架構

```text
penglai-online/
  client/   Phaser 前端遊戲
  server/   Node.js WebSocket 後端
  shared/   共用型別、地圖、怪物、NPC、任務資料
  docs/     規格書、工作流程、每日紀錄
```

## 今日完成內容

### 1. 專案初始化

- 建立 `penglai-online` 專案資料夾
- 建立 monorepo 結構：`client`、`server`、`shared`
- 加入 `README.md`
- 加入正式規格書：`docs/SPEC.md`
- 加入開發流程文件：`docs/WORKFLOW.md`
- 初始化 git repository
- 解決 Windows PowerShell 無法直接執行 `npm` 的問題，改用 `npm.cmd`

### 2. 前端遊戲骨架

- 建立 Phaser 遊戲場景
- 建立測試地圖 `Fog Harbor Test Field`
- 加入背景、平台、安全區
- 加入角色 placeholder 圖形
- 加入攝影機跟隨角色
- 加入基本 HUD
- 支援鍵盤操作：

```text
A / D：左右移動
W：跳躍
K：普通攻擊
J：技能攻擊
E：NPC 互動
```

### 3. 後端 WebSocket

- 建立 Node.js WebSocket server
- 玩家連線後取得 session id
- server 廣播 world snapshot
- 支援多玩家位置同步
- client 只送玩家輸入/狀態，核心判定放在 server

### 4. 打怪系統

- 新增怪物：`Field Rat`
- 怪物有 HP、死亡、重生
- 怪物會左右巡邏
- 玩家攻擊由 server 判定距離與面向
- 普攻與技能有不同傷害
- 怪物受擊會閃爍
- 擊殺會顯示傷害與 KO

### 5. 成長系統

- 新增 EXP
- 新增 Level
- 擊殺怪物取得 EXP
- EXP 達標會升級
- 升級時顯示 `LEVEL`
- 新增 Gold 欄位

### 6. 玩家生命與安全區

- 新增玩家 HP
- 碰到怪物會扣血
- HP 歸零會死亡
- 死亡後 1.5 秒回出生點重生
- 重生後短暫無敵
- 出生點附近新增 `Safe Zone`
- 安全區內不受怪物接觸傷害

### 7. 第一個 NPC 與任務

- 新增 NPC：`Harbor Guard`
- 玩家靠近 NPC 會顯示 `E Talk`
- 按 `E` 可接任務
- 任務名稱：`Clear the Field Rats`
- 任務目標：擊殺 3 隻 `Field Rat`
- 任務進度由 server 紀錄
- 完成後回 NPC 領獎
- 獎勵：

```text
EXP +45
Gold +25
```

## 驗證紀錄

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

另外用 WebSocket 腳本驗證：

- 玩家可連線
- 攻擊怪物會扣血
- 擊殺怪物會得到 EXP
- EXP 可以升級
- 觸碰怪物會扣 HP
- HP 歸零會重生
- 可接 NPC 任務
- 擊殺 3 隻怪後任務變成 ready
- 回 NPC 可領獎

任務測試結果：

```text
任務完成後角色狀態：LV 2 / EXP 43 / Gold 25
```

## 今日遇到的問題

### 1. PowerShell 執行 npm 被擋

Windows PowerShell 因執行原則無法直接使用 `npm`，改用：

```powershell
npm.cmd
```

### 2. `workspace:*` 安裝失敗

原本 package dependency 使用 `workspace:*`，npm 環境不接受，改為：

```json
"@penglai/shared": "file:../shared"
```

### 3. 角色跳不上平台

調整跳躍力道與平台高度後解決。

### 4. 中文字串在程式碼輸出時出現亂碼

暫時將程式碼內 UI 測試字串改成英文，中文世界觀保留在文件與後續素材規劃中。

## 目前可玩的內容

玩家可以：

- 開啟本機網頁
- 在地圖中移動與跳躍
- 攻擊 Field Rat
- 取得 EXP
- 升級
- 被怪物碰到會扣血
- 死亡後重生
- 找 Harbor Guard 接任務
- 打 3 隻 Field Rat
- 回 NPC 領 EXP 與 Gold

## 下一步建議

Day 2 可以優先做：

1. 拆分 `client/src/main.ts`，避免單檔越來越大
2. 加入簡單背包與道具掉落
3. 加入第二個 NPC：商人或藥師
4. 加入 HP 藥水
5. 增加第一張正式地圖美術方向
6. 建立第一個存檔方式：SQLite 或 local JSON prototype

## 今日結論

Day 1 已完成一個可操作、可戰鬥、可升級、可死亡重生、可接任務並領獎的 2D 橫向 MMORPG prototype。專案已經從概念進入可玩 demo 階段，接下來可以開始逐步整理架構、擴充內容與美術。

