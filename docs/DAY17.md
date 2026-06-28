# Day 17 開發紀錄
日期：2026-06-25  
專案：蓬萊異聞錄 Online  
主題：技能音效與打擊回饋第一版

## 今日目標

Day 16 已完成三職業技能特效。  
Day 17 的目標是補上技能手感：施放聲、命中聲、打空回饋，讓玩家能分辨「有出招」、「有命中」、「沒有打中」。

## 完成內容

### 1. 新增 combat:miss 訊息

在 shared server 訊息型別新增：

```text
combat:miss
playerId
isSkill
skillId
```

server 現在會在合法攻擊但沒有命中怪物時，回傳 `combat:miss` 給攻擊者。

### 2. Server 端打空判定

攻擊流程維持 server authoritative：

```text
client 送出攻擊
server 檢查玩家狀態、MP、冷卻、距離、方向
有命中 -> broadcast combat:hit
沒有命中 -> sendToPlayer combat:miss
```

技能打空仍會扣 MP 並進入冷卻，因為 server 已經認定技能成功施放，只是沒有打到目標。

### 3. Client 端音效

新增 Web Audio 合成短音，不需要外部音效檔。

目前音效：

```text
普通攻擊施放聲
劍士斬擊施放聲
符咒師靈符彈施放聲
獵人遠射施放聲
命中聲
擊破聲
打空聲
冷卻中 / 法力不足提示聲
```

音效會在玩家按鍵互動後建立，符合瀏覽器播放音效限制。

### 4. Client 端打空回饋

收到 `combat:miss` 後，角色前方會顯示：

```text
普攻打空：落空
技能打空：未命中
```

同時播放打空音效，讓玩家知道剛剛不是 bug，而是攻擊距離、方向或高度沒有對到。

### 5. 技能命中手感

技能命中時：

```text
播放命中聲
顯示 Day 16 的技能衝擊光圈
本機玩家技能命中時加入輕微鏡頭震動
```

## 修改檔案

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY17.md
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

WebSocket 測試：

```text
普攻打空 -> combat:miss，通過
技能打空 -> combat:miss，skillId = hunter-shot，通過
```

## Padlet AI 日誌簡要版

今天完成 Day 17：技能音效與打擊回饋第一版。前一天已經做出劍士、符咒師、獵人的技能特效，今天補上更像遊戲的手感。新增 server 回傳 `combat:miss`，所以攻擊沒有打中時，畫面會顯示「落空」或「未命中」，玩家可以知道不是程式沒反應，而是方向或距離沒有對到。client 也加入 Web Audio 合成音效，包含普攻、三職業技能、命中、擊破、打空、冷卻中或法力不足提示聲。最後有跑 typecheck、build，也用 WebSocket 驗證打空訊息正確。

## 下一階段建議

Day 18 可以開始做第一張正式小地圖與新怪物：

```text
擴大霧港郊外地圖
加入第二種怪物
加入掉落或任務分支
讓地圖不只是測試場景
```

也可以選擇先做設定選單，加入音量開關與音量大小調整。
