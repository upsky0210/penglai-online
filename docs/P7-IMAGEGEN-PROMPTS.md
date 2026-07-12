# P7 歷史場景生成規格

本文件記錄 P7-A／B／C 使用的最終提示詞方向，讓後續重製、分層或外包時能維持一致。完整時代與史料邊界見 `P7-HISTORICAL-ART-BIBLE.md`。

## 共通提示

- 16:9、1680×945 原圖，供 960×540 遊戲畫布等比縮放。
- high-density handcrafted pixel-painted side-scrolling environment，成熟、寫實、細膩，但保留像素繪製質感。
- 上方 18–20% 降低視覺噪音，底部 35% 保留寬闊、可辨識的角色移動與戰鬥平面。
- 歷史建築、產業工具、交通與材料以臺灣在地為基礎；奇幻光效只作敘事提示。
- 無 UI、文字、標誌、浮水印、現代車輛、霓虹、塑膠、當代高樓與大型前景人物。
- 左右邊緣避免強烈切線，便於橫向重複。

## 六關場景提示

1. **霧港開埠／臺南府城與安平，1860–1870s**：府城牆、港埠、帆船、洋行與傳統街屋；暖金、赭石、海霧青，石板前景通道。
2. **滬尾新學／淡水，1872–1884**：河港坡地、中西合璧紅磚學堂、診療與傳教空間、帆船；灰藍河霧、紅磚與暖燈。
3. **鹿港商棧，1880–1905**：不見天式街屋、郊商倉棧、窄港、廟宇屋脊、米糖布匹貨箱；木褐、暗紅、潮濕青灰。
4. **稻江茶市／大稻埕，1895–1935**：仿迪化街紅磚與牌樓厝、製茶焙茶間、竹篩、茶箱、淡水河碼頭與蒸汽船；茶褐、磚紅、河面金與微量玉色茶霧。
5. **艋舺木料街，1910–1945**：剝皮寮式街屋、木材堆、鋸木與木作工坊、河運與廟頂；戰時歲月感僅以修補、煙灰表現，無戰鬥與武器；木褐、朱紅、灰綠與微量藍紫木紋異光。
6. **大嵙崁山產線／三峽大溪，1920–1955**：紅磚街屋、山坡茶園、樟腦蒸餾棚、窄軌與橋、河谷；日治末期設施與戰後初期修補並存，星夜蒸氣形成節制的星圖意象。

## 資產對照

| 地圖 ID | 成品 |
| --- | --- |
| `fog-harbor-test` | `client/public/assets/maps/historical/fog_harbor_test_backplate.png` |
| `mist-breakwater` | `client/public/assets/maps/historical/mist_breakwater_backplate.png` |
| `old-harbor-warehouse` | `client/public/assets/maps/historical/old_harbor_warehouse_backplate.png` |
| `coral-tide-cavern` | `client/public/assets/maps/historical/coral_tide_cavern_backplate.png` |
| `sunken-archive` | `client/public/assets/maps/historical/sunken_archive_backplate.png` |
| `starlit-observatory` | `client/public/assets/maps/historical/starlit_observatory_backplate.png` |
