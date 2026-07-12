# P8-G1 場景小物庫

## 資產

最終素材位於 `client/public/assets/p8/props/`：

- `cargo_crates`：安平與淡水的綁繩貨箱
- `burlap_sacks`：港口、鹿港商棧的麻袋
- `tea_chest_stack`：大稻埕與大溪的茶葉外銷箱
- `timber_stack`：鹿港、艋舺的木料堆
- `bamboo_sieves`：大稻埕焙茶竹篩
- `ledger_manifest`：港務與木材貨單
- `tea_drying_rack`：大稻埕與山區的茶葉乾燥架
- `camphor_still`：三峽／大溪的完整樟腦蒸餾儀

## 六張地圖配置

| 地圖 | 前景小物 |
|---|---|
| 安平府城港埠 | 貨箱、麻袋、帳冊 |
| 淡水河港 | 貨箱、麻袋、帳冊 |
| 鹿港商棧 | 貨箱、麻袋、木料堆 |
| 大稻埕茶埠 | 茶箱、竹篩、乾燥架 |
| 艋舺木料街 | 木料堆、帳冊、貨箱 |
| 三峽／大溪山產線 | 乾燥架、樟腦蒸餾儀、茶箱 |

配置由 `MapRenderer.addSceneProps()` 管理；素材載入表為 `scenePropTextureKeys`。所有物件的原點設為底部中心、深度為背景前景層，讓主角、NPC 和怪物保持在前方；不存在碰撞體，也不參與任務互動。

## 圖片流程

小物採內建 imagegen 逐項生成：歷史台灣商港／茶業／木工／樟腦材料、三分之四側視、固定底線、清楚輪廓、純綠色去背、無文字與人物。原始稿存於 Git 忽略的 `tmp/imagegen/p8/props/`；`scripts/build-p8-sprites.py` 會去背後縮放到一致的遊戲格框，並驗證透明角落與尺寸。
