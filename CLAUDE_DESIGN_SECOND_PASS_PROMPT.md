# Claude Design 第二輪美化要求

目前第一輪修改後，遊戲畫面幾乎看不出美化差異。請不要只改文字、任務內容或資料，而是要做「玩家一眼看得出來」的視覺重製。

## 目前問題

截圖中仍然可以看到：

```text
1. 場景背景仍是大片矩形色塊。
2. NPC、玩家、怪物仍是簡單矩形組合。
3. HUD 血條、魔力條、經驗條仍像 debug prototype。
4. 任務、背包、角色面板仍是單調深色框。
5. 沒有新增像素風素材、圖示、九宮格面板、地圖裝飾或角色輪廓。
6. 整體不像完成度較高的像素橫向 RPG。
```

請本輪以「明顯視覺差異」為目標。

## 必須完成的可見成果

請至少完成以下 8 項，缺一不可：

```text
1. 重做 HUD：血量、魔力、經驗、金幣、技能列要變成遊戲化介面，不要只是文字加長條。
2. 重做 UI 面板：任務、背包、角色、商店都要有像素邊框、標題列、內距、色彩層次與更好的文字排版。
3. 重做世界背景：加入遠山、霧、港口、燈籠、屋頂、石階、木平台、樹、廟埕或台灣港町元素。
4. 重做玩家外觀：至少讓三種職業在顏色或剪影上有明顯差異。
5. 重做 NPC 外觀：不要只用矩形人偶，至少有頭、身體、衣服、招牌或角色辨識物。
6. 重做怪物外觀：田鼠、海霧凝膠要有不同剪影，不要只像方塊。
7. 重做互動提示與對話框：要像 RPG 對話框，有名稱欄、半透明背景、按鍵提示。
8. 加入細節動態：例如霧氣緩慢漂移、燈籠微光、任務提示閃爍、怪物受擊效果。
```

## 技術方向

可以不用外部圖片，請優先用 Phaser Graphics 產生像素風 texture，並集中管理。

建議新增：

```text
client/src/game/theme.ts
client/src/game/pixelTextures.ts
client/src/game/uiTheme.ts
```

請把顏色、字體、面板樣式集中，不要散落在整個 `GameScene.ts`。

## 優先修改區域

請優先修改：

```text
client/src/scenes/GameScene.ts
client/src/game/uiPanel.ts
client/src/styles.css
```

可以新增：

```text
client/src/game/theme.ts
client/src/game/pixelTextures.ts
client/src/game/uiTheme.ts
```

## 不要做的事

```text
1. 不要改後端 API。
2. 不要改 WebSocket 協定。
3. 不要改 SQLite schema。
4. 不要移除任務、背包、商店、職業、技能、教師管理功能。
5. 不要只改任務文字或資料，這次重點是可見美術。
6. 不要只改 CSS，因為 Phaser canvas 裡的遊戲畫面主要不吃 CSS。
```

## 驗收標準

完成後請提供：

```text
1. 修改前後截圖。
2. 說明每一項可見美化改在哪個檔案。
3. 列出新增的 texture、UI 元件或動畫。
4. 執行 npm.cmd run typecheck。
5. 執行 npm.cmd --workspace client run build。
```

## 明確提醒

這個專案是 Phaser canvas 遊戲，單純修改 `styles.css` 幾乎不會改到遊戲畫面。請直接修改 Phaser 場景、UI panel 建立方式、生成 texture 與世界繪製函式。

請先從這些函式開始：

```text
createGeneratedTextures()
addWorld()
addNpcs()
addHud()
createPanel()
updateInventoryHud()
updateQuestTracker()
updateCharacterPanel()
updateShopPanel()
showDialogue()
```

本輪目標不是「程式碼看起來有改」，而是「玩家截圖一看就知道畫面升級」。
