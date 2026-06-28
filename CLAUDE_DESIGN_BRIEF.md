# Claude Design / Claude Code 美術重製委託說明

專案名稱：蓬萊異聞錄 Online  
專案類型：2D 像素橫向多人 RPG / 類楓之谷玩法原型  
目前進度：Day1-DAY60，已有基本遊戲、任務、打怪升級、背包、商店、職業技能、Google 登入雛形、教師管理面板、聊天控場、資料庫備份。

## 你的任務

請幫我將整個遊戲與教師管理面板做「視覺美化與 UI 整理」，但不要改壞既有功能。

主要目標：

```text
1. 遊戲畫面更像完整的像素橫向 RPG。
2. UI 文字、按鈕、面板、血條、任務、背包、商店、聊天視窗更美觀。
3. 教師管理面板維持專業、清楚、適合學校使用。
4. 所有顯示文字使用台灣正體中文。
5. 保留目前玩法、WebSocket、API、存檔與教師管理功能。
```

## 不要做的事情

請不要：

```text
1. 不要重寫整個專案架構。
2. 不要更換 Phaser、Vite、TypeScript、Node.js、WebSocket 等主要技術。
3. 不要刪除或改壞 server/src/index.ts 的 API 行為。
4. 不要改資料庫 schema，除非非常必要，而且必須先說明。
5. 不要移除既有功能。
6. 不要把遊戲改成 Landing Page 或純展示頁。
7. 不要加入需要額外付費 API 的功能。
8. 不要把 UI 文字改成簡體中文或英文。
9. 不要大量改動 smoke test，除非是為了配合視覺調整。
```

## 可優先修改的檔案

建議優先處理：

```text
client/src/styles.css
client/src/adminDashboard.ts
client/src/scenes/GameScene.ts
client/src/game/constants.ts
shared/src/index.ts
```

如果需要新增美術或 UI 常數，可以新增：

```text
client/src/game/theme.ts
client/src/game/uiTheme.ts
client/src/game/pixelPalette.ts
```

## 美術方向

請使用「台灣史地 + 奇幻蓬萊」方向，而不是直接使用金庸或哈利波特 IP。

風格參考：

```text
台灣山城、港口、老街、廟埕、榕樹、石階、霧氣、山海交界
像素風、溫暖但不要過度可愛
學校學生可接受，不要血腥、恐怖、成人向
```

色彩方向：

```text
主色：墨綠、深青、米白、木色
點綴：金色、朱紅、霧藍
避免整個畫面只有紫色、深藍或咖啡色
```

## 遊戲畫面要改善的重點

請優先美化：

```text
1. HUD：血量、魔力、等級、經驗值、金幣、職業資訊。
2. 任務面板：目前任務、進度、獎勵。
3. NPC 對話框：更像 RPG 對話框。
4. 背包與裝備：格子、選取狀態、物品資訊。
5. 商店 UI：購買按鈕、商品列表、金幣顯示。
6. 技能列：冷卻、MP 不足、可用狀態。
7. 聊天視窗：訊息層級、系統公告、玩家訊息。
8. 怪物血條與傷害數字。
9. 登入與角色名稱輸入畫面。
```

## 教師管理面板要改善的重點

管理面板不是遊戲風格，而是學校教師可用的工具。請走清楚、安靜、專業的 dashboard 風格。

請改善：

```text
1. 資訊密度合理，適合老師快速查看。
2. 系統狀態、備份、線上玩家、聊天紀錄、操作紀錄分區清楚。
3. 按鈕狀態清楚，例如重新整理、建立備份、靜音、踢出。
4. 表格在小螢幕不要爆版。
5. 錯誤與成功訊息容易理解。
```

## 技術限制

請遵守：

```text
1. 保持 TypeScript 通過。
2. 保持 npm.cmd run typecheck 通過。
3. 保持 npm.cmd --workspace client run build 通過。
4. 不要新增大型圖片或二進位素材，除非必要。
5. 如果新增素材，請放在 client/public 或 client/src/assets，並說明用途。
6. 不要提交 node_modules、dist、server/data、server/backups。
```

## 測試方式

修改後請執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

如果要啟動測試：

```powershell
START_PENGLAI.bat
```

或手動：

```powershell
npm.cmd --workspace server run start
npm.cmd --workspace client run dev -- --host 0.0.0.0 --port 5174
```

遊戲：

```text
http://localhost:5174/
```

教師管理面板：

```text
http://localhost:5174/?admin=1
```

本機測試 Admin Token：

```text
smoke-admin
```

## 請先回報你的修改計畫

開始大量修改前，請先列出：

```text
1. 你打算先改哪些檔案。
2. 你會怎麼分階段美化。
3. 你會保留哪些既有功能不動。
4. 你預計會新增哪些 UI 元件或素材。
```

## 最後交付時請提供

完成後請提供：

```text
1. 修改摘要。
2. 修改檔案清單。
3. 執行過的測試指令與結果。
4. 還沒做但建議下一步處理的項目。
```
