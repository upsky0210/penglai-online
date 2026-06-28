# Penglai Online Asset Folder

這個資料夾保留給正式美術素材。現階段遊戲仍以程式繪製的 fallback 圖形為主，所以沒有素材時也能正常執行。

## Folder Plan

- `characters/player/`：主角 sprite sheets。
- `npcs/`：NPC sprite sheets。
- `monsters/`：怪物與 Boss sprite sheets。
- `maps/mist_breakwater/`：霧港、海霧堤道、潮眼區域背景分層。
- `tiles/`：平台、地板、木板、港町建築 tile。
- `effects/`：攻擊、靈斬、拾取、燈籠光、霧氣。
- `ui/`：面板、圖示、背包格、任務標記。

## Naming Rules

- 使用英文小寫、底線與數字。
- 避免空白與中文檔名。
- PNG 優先，背景透明。
- sprite sheet 檔名包含角色與動作，例如 `player_run.png`。

## Enable External Sprites

1. 放入 PNG sprite sheet。
2. 確認檔名與 `client/src/game/assetManifest.ts` 相同。
3. 確認每一格尺寸符合 `frameWidth` / `frameHeight`。
4. 將 `assetManifest.ts` 的 `externalSpritesEnabled` 改為 `true`。
5. 執行 `npm.cmd --workspace client run build` 檢查。

素材尚未放入時，請維持 `externalSpritesEnabled = false`。遊戲會使用程式產生的 fallback texture。

## Map Art Files

`assetManifest.ts` 目前預期以下背景與地圖素材：

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

素材尚未放入時，請維持 `externalMapArtEnabled = false`。背景會使用程式繪製的 fallback。
