# Day 13 開發紀錄

日期：2026-06-24  
專案：蓬萊異聞錄 Online  
主題：角色名稱與職業選擇第一版

## 今日目標

Day 12 完成開始畫面後，Day 13 接著把「角色資料」放進進入流程。  
這一版先做最基本的角色名稱與職業選擇，讓玩家在進入遊戲前設定角色，進場後由 server 保存到 SQLite。

## 實作內容

### 1. 開始畫面新增角色資訊

開始畫面現在會顯示：

```text
目前存檔
上一個存檔
角色名稱
職業
職業說明
```

### 2. 角色名稱第一版

目前支援：

```text
N             切換預設名稱
Backspace     刪除一個字
直接輸入英文 / 數字 / 底線 / 連字號
```

暫時先不做完整中文輸入法支援，因為 Phaser canvas 直接處理 IME 會比較複雜。  
如果要正式支援中文命名，後續可以做 HTML input overlay。

### 3. 職業選擇第一版

目前三個職業：

```text
劍士
符咒師
獵人
```

開始畫面按：

```text
← / →
```

可以切換職業。

目前職業還沒有改變技能或數值，只先存進角色資料。  
後續可以依照職業分出武器、技能、初始數值與任務台詞。

### 4. 角色草稿保存

client 端會把每個 save slot 對應的角色草稿存在 localStorage：

```text
penglai-character-drafts
```

這樣切換 save slot 時，可以先看到該 slot 對應的角色名稱與職業。

### 5. Server 保存角色名稱與職業

進入遊戲後，client 會在 `player:update` 裡送出：

```text
name
className
```

server 會：

```text
整理角色名稱長度
檢查職業只能是 swordsman / talisman / hunter
如果名稱或職業變更，就立即寫入 SQLite
```

SQLite schema 沒有改，沿用 Day 10 的 `characters` 欄位。

### 6. HUD 與角色面板更新

HUD 等級列現在會顯示：

```text
角色名稱 | 等級
```

角色面板會顯示：

```text
名稱
職業
攻擊
防禦
武器
防具
```

## 操作整理

```text
Enter       進入遊戲
← / →       切換職業
N           切換預設名稱
Backspace   刪除名稱
R           新存檔
L           上一個存檔
Y           複製存檔代碼
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
WebSocket 角色存檔重連測試通過
同一個 save slot 可讀回 name=Day13Test / className=hunter
```

## 修改檔案

```text
client/src/scenes/GameScene.ts
server/src/index.ts
docs/DAY13.md
```

## Padlet AI 日誌簡記

今天完成 Day 13：角色名稱與職業選擇第一版。開始畫面現在不只顯示存檔，也會顯示角色名稱與職業。玩家可以按 N 切換預設名稱，按左右方向鍵切換劍士、符咒師、獵人，進入遊戲後 HUD 會顯示角色名稱與等級，角色面板也會列出名稱與職業。server 端會檢查職業是否合法，並在名稱或職業變更時立即寫入 SQLite。這一步讓存檔開始更像真正的角色資料，而不只是單純的 save slot。

## 下一步建議

Day 14 可以做「職業差異第一版」：

```text
劍士：近戰攻擊較高
符咒師：法力較高，靈斬傷害較高
獵人：攻擊距離較長
開始畫面顯示職業初始特色
server 依照職業套用初始數值
```

這樣職業選擇才會開始影響玩法。
