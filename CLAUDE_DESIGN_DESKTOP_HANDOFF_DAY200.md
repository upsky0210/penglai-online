# Claude Design Desktop Handoff - Penglai Online

請協助美化這個 Phaser 橫向像素 MMORPG 專案，但請遵守以下限制。

## 重要限制

- 請優先產出 PNG 素材，不要大幅改動 TypeScript 遊戲邏輯。
- 不要改 server、shared、存檔、WebSocket、任務資料結構。
- 不要刪除 fallback texture 或 `assetManifest.ts` 的保護機制。
- 不要把 UI 面板重新放大到遮住主角、怪物、NPC。
- 不要使用中文檔名、空白檔名或特殊符號檔名。

## 請優先處理的資料夾

- `client/public/assets/characters/player/`
- `client/public/assets/monsters/`
- `client/public/assets/maps/fog_harbor_test/`
- `client/public/assets/maps/mist_breakwater/`
- `client/public/assets/tiles/`
- `client/public/assets/effects/`
- `client/public/assets/ui/`

## 第一批素材

請先輸出以下 PNG，透明背景：

- `characters/player/player_idle.png`：48x48，4 frames。
- `characters/player/player_run.png`：48x48，6 frames。
- `characters/player/player_jump.png`：48x48，2 frames。
- `characters/player/player_attack.png`：48x48，4 frames。
- `characters/player/player_skill_slash.png`：64x48，5 frames。
- `monsters/field_rat_idle.png`：32x24，4 frames。
- `monsters/mist_slime_idle.png`：40x32，4 frames。
- `monsters/tide_watcher_idle.png`：96x96，6 frames。

## 背景分層

請輸出可水平延伸或循環的 PNG：

- `maps/fog_harbor_test/bg_sky.png`
- `maps/fog_harbor_test/bg_far.png`
- `maps/fog_harbor_test/bg_buildings_back.png`
- `maps/fog_harbor_test/bg_buildings_mid.png`
- `maps/mist_breakwater/bg_sky.png`
- `maps/mist_breakwater/bg_far.png`
- `maps/mist_breakwater/bg_harbor_back.png`
- `maps/mist_breakwater/bg_harbor_mid.png`
- `effects/mist_overlay.png`
- `tiles/harbor_platform_tiles.png`

## 視覺方向

- 台灣港町奇幻，不要做成歐美中世紀。
- 像素橫向 MMORPG，可讀性優先。
- 主角、怪物、平台要比背景更清楚。
- 背景可以有港町建築、燈籠、海霧、堤岸、遠山、漁港屋頂。
- 色彩以墨綠、深青、米白、木色為主，金色與朱紅點綴。

## 完成後

請列出你新增或修改的檔案。完成後不要自動把 `externalSpritesEnabled` 或 `externalMapArtEnabled` 改成 `true`，先讓 Codex 檢查素材尺寸與路徑。

