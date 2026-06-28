# Day 12 開發紀錄

日期：2026-06-24  
專案：蓬萊異聞錄 Online  
主題：開始畫面與角色進入流程第一版

## 今日目標

Day 11 已經完成存檔面板與台灣正體中文化。  
Day 12 的目標是讓遊戲不要一開網頁就直接連線進場，而是先出現一個開始畫面，讓玩家知道目前使用哪個存檔，再決定要進入遊戲或切換存檔。

## 實作內容

### 1. 新增開始畫面

遊戲啟動後會先顯示：

```text
蓬萊異聞錄 Online
霧港試煉場
目前存檔
上一個存檔
操作提示
```

按下 `Enter` 後才會：

```text
建立 HUD
建立角色
建立 NPC
建立平台碰撞
連線到 server
讀取 SQLite 存檔
```

這讓遊戲流程比較接近正式線上遊戲，而不是一打開就直接進測試場。

### 2. 開始畫面存檔操作

開始畫面支援：

```text
Enter  進入遊戲
R      建立新角色存檔
L      切換上一個存檔
Y      複製目前存檔代碼
```

這些操作和 Day 11 的 Save 面板一致，但現在玩家在進場前就可以先處理存檔。

### 3. 不更動存檔結構

Day 12 沒有改 SQLite schema，也沒有改 server 存檔格式。  
目前仍然使用 Day 10 的 SQLite 存檔與 Day 11 的 save slot 流程。

```text
client localStorage save slot
server SQLite character save
```

### 4. 連線時機延後

原本流程：

```text
開網頁 -> 直接建立角色 -> 直接連線 server
```

現在流程：

```text
開網頁 -> 開始畫面 -> Enter -> 建立角色 -> 連線 server
```

這樣之後要加入角色命名、職業選擇、角色列表或刪除存檔，都會比較容易接上。

## 測試紀錄

執行檢查：

```powershell
npm.cmd run typecheck
```

測試結果：

```text
shared typecheck 通過
server typecheck 通過
client typecheck 通過
```

## 修改檔案

```text
client/src/scenes/GameScene.ts
docs/DAY12.md
```

## Padlet AI 日誌簡記

今天完成 Day 12：開始畫面與角色進入流程第一版。之前遊戲一打開網頁就會直接連線並進入地圖，今天改成先顯示「蓬萊異聞錄 Online」開始畫面，玩家可以看到目前存檔與上一個存檔，按 Enter 才正式進入遊戲。開始畫面也支援按 R 建立新角色存檔、按 L 切換上一個存檔、按 Y 複製目前存檔代碼。這一步讓 prototype 從單純測試場更接近正式遊戲流程，也為之後的角色命名、職業選擇與角色列表打基礎。

## 下一步建議

Day 13 可以做「角色命名 / 職業選擇第一版」：

```text
開始畫面加入角色名稱
可以輸入或切換預設名稱
選擇劍士 / 符咒師 / 獵人
server 存檔記錄角色名稱與職業
HUD 顯示角色名稱
```

這會讓目前的存檔更像真正的角色資料，而不只是 save slot。
