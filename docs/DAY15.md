# Day 15 開發紀錄
日期：2026-06-24  
專案：蓬萊異聞錄 Online  
主題：職業技能第一版

## 今日目標

Day 14 已經完成三個職業的基本數值差異。  
Day 15 的目標是讓三個職業各自擁有不同技能，並把技能判定放在 server 端，避免 client 端送錯技能 ID 造成資料不同步。

## 完成內容

### 1. 新增三職業技能表

在 `shared/src/index.ts` 新增三個技能：

```text
劍士      斬擊      MP 9   冷卻 1.4 秒  基礎傷害 22  距離 82
符咒師    靈符彈    MP 14  冷卻 1.7 秒  基礎傷害 20  距離 118
獵人      遠射      MP 10  冷卻 1.3 秒  基礎傷害 19  距離 130
```

同時保留舊的 `spirit-slash`，避免舊資料或測試訊息突然失效。

### 2. Server 端改成依職業決定技能

新增 `CLASS_SKILL_IDS`：

```text
swordsman -> sword-cleave
talisman  -> spirit-talisman
hunter    -> hunter-shot
```

client 仍然會在按下 `J` 時送出技能攻擊，但實際使用哪一個技能由 server 依照玩家職業決定。  
這樣可以避免玩家端亂送 `skillId`，也比較符合多人遊戲的 server authoritative 架構。

### 3. Client HUD 顯示目前職業技能

client 不再固定顯示舊技能。  
現在 HUD 會依照目前職業顯示：

```text
J 斬擊 | 9 法力 | 可施放
J 靈符彈 | 14 法力 | 可施放
J 遠射 | 10 法力 | 可施放
```

技能冷卻、法力不足提示、攻擊範圍閃光，也會跟著目前職業技能變化。

### 4. 角色選擇畫面更新

職業說明改為明確標示技能：

```text
劍士：生命 115 / 法力 36，技能：斬擊。
符咒師：生命 90 / 法力 60，技能：靈符彈。
獵人：生命 100 / 法力 42，技能：遠射。
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

另外用 WebSocket 測試三個職業。測試時故意送舊技能 `spirit-slash`，確認 server 仍會依照職業改成正確技能：

```text
swordsman -> sword-cleave       通過
talisman  -> spirit-talisman    通過
hunter    -> hunter-shot        通過
```

## 修改檔案

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY15.md
```

## Padlet AI 日誌簡要版

今天完成 Day 15：職業技能第一版。原本遊戲只有一個共用技能，今天把技能拆成劍士「斬擊」、符咒師「靈符彈」、獵人「遠射」。比較重要的是，技能不只是在前端顯示不同，而是由 server 依照角色職業決定實際技能，這樣比較接近真正線上遊戲的設計，也能避免 client 亂送技能資料。HUD、冷卻提示、法力不足提示也一起改成依職業顯示。最後有跑 typecheck、build，並用 WebSocket 驗證三職業技能對應都正確。

## 下一階段建議

Day 16 可以做技能特效第一版：

```text
劍士：近距離弧形斬光
符咒師：向前飛出的符咒彈
獵人：水平箭矢或彈道線
```

目前 Day 15 只先完成技能資料、判定與 HUD。下一階段再把視覺表現做出職業差異。
