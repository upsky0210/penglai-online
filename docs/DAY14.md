# Day 14 開發紀錄

日期：2026-06-24  
專案：蓬萊異聞錄 Online  
主題：職業差異第一版

## 今日目標

Day 13 已經可以在開始畫面選擇職業，但職業還只是存檔資料。  
Day 14 的目標是讓職業開始影響實際玩法，先從 server authoritative 的戰鬥數值開始。

## 實作內容

### 1. 新增職業數值設定

server 新增職業設定表：

```text
swordsman  劍士
talisman   符咒師
hunter     獵人
```

目前差異：

```text
劍士
生命 115
法力 36
攻擊 +3
防禦 +2
近戰穩定

符咒師
生命 90
法力 60
攻擊 -1
防禦 +0
法力回復較快
靈斬傷害 +10
靈斬範圍略大

獵人
生命 100
法力 42
攻擊 +1
防禦 +0
普攻距離較長
靈斬範圍略大
```

### 2. Snapshot 新增最大生命與最大法力

shared 的 `PlayerSnapshot` 新增：

```text
maxHp
maxMp
```

client 不再固定用 100 生命 / 40 法力顯示血條，而是依照 server snapshot 顯示。

### 3. Server 改為依職業計算

server 端現在會依照職業計算：

```text
最大生命
最大法力
法力回復速度
攻擊
防禦
普攻距離
普攻垂直判定
技能傷害
技能範圍
```

這些都由 server 決定，client 只送出選擇的職業，不負責決定傷害。

### 4. 切換職業時重算狀態

玩家進場後，client 會送出角色名稱與職業。  
server 如果發現職業和原本不同，就會：

```text
重算 maxHp / maxMp
重算攻擊 / 防禦
如果原本滿血滿法，切換後補到新職業上限
立即送出 equipment:update
立即寫入 SQLite
```

這解決了「新角色選符咒師，但初始法力還停在劍士 36」的問題。

### 5. 開始畫面職業說明更新

開始畫面的職業說明更新為實際數值：

```text
劍士：生命 115 / 法力 36，攻擊與防禦較高。
符咒師：生命 90 / 法力 60，靈斬傷害與回法較強。
獵人：生命 100 / 法力 42，普攻距離較長。
```

## 測試紀錄

執行檢查：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

測試結果：

```text
shared typecheck 通過
server typecheck 通過
client typecheck 通過
client build 通過
```

WebSocket 三職業 snapshot 測試：

```text
劍士
maxHp 115
maxMp 36
attack 15
defense 2
hp 115
mp 36

符咒師
maxHp 90
maxMp 60
attack 11
defense 0
hp 90
mp 60

獵人
maxHp 100
maxMp 42
attack 13
defense 0
hp 100
mp 42
```

## 修改檔案

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY14.md
```

## Padlet AI 日誌簡記

今天完成 Day 14：職業差異第一版。昨天角色已經可以選擇劍士、符咒師、獵人，今天讓職業開始真的影響玩法。server 現在會依照職業計算最大生命、最大法力、法力回復、攻擊、防禦、普攻距離和技能傷害。劍士比較硬，攻防較高；符咒師生命較低但法力最高，靈斬更強；獵人生命與法力居中，普攻距離較長。client 也改成從 server snapshot 讀取 maxHp / maxMp 顯示生命與法力條。測試時用三個 save slot 分別建立三種職業，重新讀取 snapshot 後都能得到正確數值。

## 下一步建議

Day 15 可以做「職業技能第一版」：

```text
劍士：斬擊
符咒師：靈符彈
獵人：遠射
開始畫面顯示技能名稱
client 根據職業顯示不同技能文字
server 根據職業套用不同 skill range / damage / cost
```

這樣三個職業的手感會更明顯。
