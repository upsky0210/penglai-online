# Day191-Day200 背景管線與 Claude Design 交接整理
專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 階段目標

Day191-Day200 的目標是讓正式背景、霧氣、平台材質可以安全接進遊戲，同時準備給 Claude Design 桌面版的美化說明。

## 已完成

- 新增地圖背景分層 manifest。
- 新增 optional image asset 載入。
- 新增外部背景圖層顯示。
- 新增霧氣 overlay 動態圖層。
- 新增平台材質 tileSprite 顯示入口。
- 保留程式繪製 fallback，沒有 PNG 時遊戲仍可跑。
- 補上 Claude Design 桌面版交接文件。

## 啟用正式背景的方式

1. 依照 `client/public/assets/README.md` 放入 PNG。
2. 確認檔名與 `client/src/game/assetManifest.ts` 一致。
3. 將 `externalMapArtEnabled` 改成 `true`。
4. 執行 `npm.cmd --workspace client run build`。
5. 啟動遊戲檢查主角、怪物、平台、UI 是否被背景遮住。

## Padlet AI 日誌

Day191-Day200 完成背景與地圖美術管線。之後可以把資料夾交給 Claude Design 桌面版，要求它照規格輸出素材，再由 Codex 接回遊戲。

