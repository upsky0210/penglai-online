# Day171-Day180 世界狀態與美術規格整理
專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 階段目標

Day171-Day180 分成兩個重點：

- Day171-Day175：讓第一章任務完成後，地圖會留下可見的世界狀態變化。
- Day176-Day180：整理正式像素素材規格，方便交給 Claude Design、OpenDesign 或人工繪師。

## 已完成的遊戲內容

- 修好的霧堤燈會出現亮光與「燈已復明」提示。
- 潮眼守衛相關任務完成後，平台會顯示「潮眼已平定」。
- 第一章完成後，地圖顯示「海霧穩定，第一章完成」。
- 新增章節狀態圖層，讓任務完成後的視覺效果可集中管理。
- 清除章節狀態時同步停止動畫，避免長時間遊玩累積舊 tween。

## 美術交付總規則

- 所有 sprite 需使用透明背景 PNG。
- 角色、NPC、怪物先以右向為主，左向可由程式鏡射。
- 背景必須分層，不要只交一張完整大圖。
- UI 與特效要小型化，不能遮住主角、敵人與平台。
- 檔名使用英文小寫與底線，避免中文檔名造成部署問題。

## 建議資料夾

- `client/public/assets/characters/player/`
- `client/public/assets/npcs/`
- `client/public/assets/monsters/`
- `client/public/assets/maps/mist_breakwater/`
- `client/public/assets/tiles/`
- `client/public/assets/effects/`
- `client/public/assets/ui/`

## 驗收標準

- 主角在 1366x768 與 1920x1080 都清楚可見。
- UI 面板不遮住主角、怪物、NPC 對話點。
- 戰鬥時能分辨普攻、技能、受傷與死亡狀態。
- 背景分層有景深，但不搶走前景可讀性。
- 素材缺失時遊戲仍可用程式繪製 fallback 跑起來。

## Padlet AI 日誌

Day171-Day180 把第一章完成後的場景回饋補起來，也整理了正式素材規格。這代表專案開始從功能原型往可展示的像素 MMORPG 前進。

