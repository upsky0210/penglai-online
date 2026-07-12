# P8-E / P8-F 互動物件與戰鬥特效

## P8-E：互動物件

五種任務互動類型已由程式幾何圖形升級為獨立透明 PNG：淡水港燈、潮汐量尺、大稻埕茶棧封印、艋舺木料帳板、三峽大溪樟腦觀測鏡。物件按地方產業材料設計；既有座標、互動半徑、任務狀態文字與章節完成效果不變。

最終資產位於 `client/public/assets/p8/interactables/`。`interactableTextureKeys` 是載入與種類對照的唯一來源；圖片缺失時，`MapRenderer` 仍使用原有程式圖形。

## P8-F：戰鬥特效

劍士斬擊、符師靈符、獵人射擊及共用命中回饋均改為四格動畫。普通攻擊沿用 P8-A/B 的墨色斬擊。新動畫只替換表現，不改傷害、範圍、MP、命中判定或伺服器權威流程。

最終資產位於 `client/public/assets/p8/effects/`。`CombatVfx` 會先嘗試播放外部動畫；缺圖或動畫未建立時，仍回退到原有 Phaser 幾何特效。

## 製作與驗證

- 原始生成圖保留在 Git 忽略的 `tmp/imagegen/p8/interactables` 與 `tmp/imagegen/p8/effects`。
- `scripts/build-p8-sprites.py` 負責去背來源的縮放、格框、腳底／中心對齊及透明角落檢查。
- 互動物件採單張圖；技能特效統一四格、16 fps、播放一次後銷毀。
