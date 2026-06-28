# Day 11 開發紀錄

日期：2026-06-23  
專案：蓬萊異聞錄 Online  
主題：存檔管理介面第一版

## 今日目標

Day 10 已經完成 SQLite 存檔，但玩家還看不到自己目前使用哪一個存檔。  
Day 11 的目標是先做一個簡單的「存檔管理面板」，讓測試時可以看見目前 save slot，並能快速切換到新角色或上一個角色。

## 實作內容

### 1. 新增 Save 面板

前端新增一個 Save UI panel。  
按下：

```text
P
```

可以開關 Save 面板。

面板目前會顯示：

```text
Current save slot
Previous save slot
操作提示
```

### 2. 建立新角色 Slot

當 Save 面板開啟時，按下：

```text
R
```

會產生新的 save slot，並重新啟動場景。  
server 會把這個 slot 視為新的角色存檔，所以角色會從初始狀態開始。

### 3. 回到上一個 Slot

當 Save 面板開啟時，按下：

```text
L
```

會切回上一個 save slot。  
這樣測試時可以在「目前角色」和「上一個角色」之間來回切換。

### 4. 複製 Slot

當 Save 面板開啟時，按下：

```text
Y
```

會把目前 save slot 複製到剪貼簿。  
這個功能之後可以用在匯出、分享、除錯或指定讀取某個存檔。

### 5. 降低誤觸風險

`R / L / Y` 只有在 Save 面板開啟時才會生效。  
平常遊玩時按到 `R` 不會直接重開角色，避免測試中誤觸。

## 操作整理

```text
P  開關 Save 面板
R  建立新角色 save slot
L  載入上一個 save slot
Y  複製目前 save slot
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

## 修改檔案

```text
client/src/scenes/GameScene.ts
client/src/styles.css
shared/src/index.ts
server/src/index.ts
docs/DAY11.md
```

## Day 11 收尾：美編與台灣正體中文化

今天另外做了 Day 11 的收尾調整：

```text
物品名稱改成台灣正體中文
NPC 名稱改成台灣正體中文
任務名稱與任務提示改成台灣正體中文
商店、背包、角色、存檔面板改成台灣正體中文
戰鬥浮字與升級提示改成台灣正體中文
HUD 的 HP/MP/EXP/Gold 改成生命/法力/經驗/金幣
背景從測試用色塊調整為霧港、石階、燈火風格
面板配色改成深色底、青藍標題列、金色邊線
玩家角色小圖重新配色
```

這次只改顯示文字和美術表現，沒有更動 protocol ID、物品 ID、任務 ID 或存檔結構，所以 Day 10 的 SQLite 存檔仍可沿用。

## Padlet AI 日誌簡記

今天完成 Day 11：存檔管理介面第一版。昨天已經讓 server 可以用 SQLite 保存角色資料，今天則在遊戲畫面加入 Save 面板，按 `P` 可以查看目前的 save slot 和上一個 save slot。面板開啟時可以按 `R` 產生新角色存檔，按 `L` 回到上一個存檔，按 `Y` 複製目前 slot。為了避免誤觸，這些管理鍵只有在 Save 面板打開時才會作用。這讓後續測試多角色、重開進度、展示存檔讀取流程都更方便。

## 下一步建議

Day 12 可以做「角色選單 / 開始畫面」：

```text
進入遊戲前先看到角色存檔
可以選擇繼續遊戲
可以建立新角色
可以刪除或重置測試角色
可以輸入角色名稱
```

這會讓目前的 prototype 更接近真正線上遊戲的登入流程。
