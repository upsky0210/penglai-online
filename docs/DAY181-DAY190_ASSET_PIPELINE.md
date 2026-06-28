# Day181-Day190 資產管線第一版
專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 階段目標

這一階段的重點不是一次把所有美術畫完，而是先建立「正式素材可以安全接進遊戲」的管線。

## 已完成

- 新增 `client/src/game/assetManifest.ts`。
- 新增 optional sprite sheet 載入設定。
- 新增載入失敗記錄與 fallback 判斷。
- 主角支援 `idle`、`run`、`jump`、`attack`、`skill` 動畫。
- 遠端玩家改用 sprite 顯示。
- 田鼠、海霧凝膠、潮眼守衛改用 sprite/fallback texture。
- 保留 HP 條、名稱標籤、受擊閃白。

## 如何啟用正式素材

1. 依照 `client/public/assets/README.md` 放入 PNG sprite sheet。
2. 確認檔名與 `assetManifest.ts` 內的 `path` 一致。
3. 確認單格尺寸與 `frameWidth`、`frameHeight` 一致。
4. 將 `assetManifest.ts` 內的 `externalSpritesEnabled` 改為 `true`。
5. 執行 `npm.cmd --workspace client run build`。

## 目前限制

- 外部 sprite 預設關閉。
- 尚未做背景分層 loader。
- 尚未做正式 tilemap。
- 尚未把 UI 面板改成圖片 9-slice。

## Padlet AI 日誌

Day181-Day190 完成正式素材管線第一版。這讓遊戲從「程式畫的原型圖」進入「可以逐步替換正式像素圖」的階段，而且素材缺失時仍有 fallback 保護。

