# P8-G2／G3／G4 實作紀錄

## G2 場景結構

- 平台材質：`client/public/assets/p8/platforms/` 內含 stone、wood、roof、dock、mountain 五種 256×64 橫向材質。
- 地圖對照：安平使用石板、淡水與大稻埕使用碼頭、鹿港使用木棧、艋舺使用屋頂／木作表面、三峽大溪使用山路。
- 傳送點：保留原 portal 座標與目的地，只將抽象門框換成府城街口、河港碼頭、木橋或山路旗標。
- 安全區：保留原 safe-zone 矩形判定，但不再繪製整片綠色覆蓋；改畫低強度地面光紋與成對燈火。

## G3 戰鬥與可讀性

- 技能命中在高階模式疊加短促潮霧；既有刀光、墨痕與命中 sprite sheet 保持四格上限。
- 怪物首次從 alive 變成 defeated 時播放 360 ms 暗化、縮退、上浮與四顆霧墨粒子；重複 snapshot 不會重播。
- NPC、怪物、傳送點與互動狀態採 11 px、固定寬度、置中及深色底／描邊。
- 怪物加入深色接觸影；離開相機範圍後，角色動畫、血條、名稱與掉落物停止顯示。

## G4 畫面預算

`visualQuality.ts` 提供標準與低階兩種固定 profile：

| 預算 | 標準 | 低階 |
|---|---:|---:|
| 同屏戰鬥特效 | 16 | 6 |
| 世界標籤 | 32 | 14 |
| 遠端效果／音效節流 | 150 ms | 320 ms |
| 環境霧動畫／次要光暈 | 開啟 | 關閉 |

模式選擇順序為網址 `?quality=low|high`、localStorage `penglai-visual-quality`、最後依 prefers-reduced-motion 或 CPU 邏輯核心數自動判斷。設定面板會顯示目前模式。

`npm run check:p8-g` 是靜態密度守門；`check:beta:v02` 與 `check:release` 會包含它。此改動不增加伺服器事件、snapshot 欄位或廣播頻率。

## 圖像生成

五種平台原稿以內建 imagegen 分別生成；提示規格為「歷史台灣平台表面、可水平平鋪、清楚頂緣與暗色立面、1990 年代台灣 PC RPG 像素密度、無角色／文字／物件」。原稿位於 Git 忽略的 `tmp/imagegen/p8/platforms`，`scripts/build-p8-sprites.py` 負責裁切成 256×64 最終材質。
