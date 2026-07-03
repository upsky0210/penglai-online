# Claude Design 美術資產設計 Brief

## 專案定位

專案名稱：蓬萊 Online / Penglai Online  
類型：像素橫向 MMORPG / 類楓之谷橫向卷軸  
美術方向：台灣港町、海霧、舊港、珊瑚潮洞、沉船書庫、星砂觀測台。整體要有東亞海港、台灣漁村、霧氣、燈籠、潮汐、古舊木造建築、海底遺跡與星象觀測元素。

請保持目前遊戲可讀性：角色、怪物、平台、NPC、掉落物必須在 2D 橫向視角中清楚辨識，不要做成太暗或太寫實。風格是精緻像素風，不是油畫、照片、3D 或厚塗。

## 目前遊戲資產路徑

請修改或補齊 `penglai-online/client/public/assets/` 內的圖片。

目前已存在：

- `assets/characters/player/player_idle.png`
- `assets/characters/player/player_run.png`
- `assets/characters/player/player_jump.png`
- `assets/characters/player/player_attack.png`
- `assets/characters/player/player_skill_slash.png`
- `assets/monsters/field_rat_idle.png`
- `assets/monsters/mist_slime_idle.png`
- `assets/monsters/tide_watcher_idle.png`
- `assets/maps/fog_harbor_test/bg_sky.png`
- `assets/maps/fog_harbor_test/bg_far.png`
- `assets/maps/fog_harbor_test/bg_buildings_back.png`
- `assets/maps/fog_harbor_test/bg_buildings_mid.png`
- `assets/maps/mist_breakwater/bg_sky.png`
- `assets/maps/mist_breakwater/bg_far.png`
- `assets/maps/mist_breakwater/bg_harbor_back.png`
- `assets/maps/mist_breakwater/bg_harbor_mid.png`
- `assets/effects/mist_overlay.png`
- `assets/tiles/harbor_platform_tiles.png`

## 角色職業與招式

| 類型 | ID | 名稱 | 美術需求 |
| --- | --- | --- | --- |
| 玩家職業 | `swordsman` | 劍士 | 港町少年/少女劍士，布衣、短劍或木劍，動作清楚。 |
| 玩家職業 | `talisman` | 符師 | 道符、紙符、海霧靈力，偏台灣民俗幻想。 |
| 玩家職業 | `hunter` | 獵人 | 輕裝遠攻角色，可帶短弓、火繩槍或彈弓感。 |
| 技能 | `sword-cleave` | 斬擊 | 近距離弧形斬擊，可見刀光。 |
| 技能 | `spirit-talisman` | 靈符 | 飛出的符紙或藍綠色靈光。 |
| 技能 | `hunter-shot` | 狙擊 | 遠距離彈道或光箭。 |
| 技能 | `spirit-slash` | 靈斬 | 進階靈力斬擊，可當特效參考。 |

玩家 spritesheet 規格：

- idle：48x48，4 frame
- run：48x48，6 frame
- jump：48x48，2 frame
- attack：48x48，4 frame
- skill_slash：64x48，5 frame
- 透明背景 PNG
- 像素風，邊界清楚，不要模糊半透明太多

## 地圖與世界區域

| Map ID | 中文名 | 尺寸 | 主題 | 已有背景資產狀態 |
| --- | --- | --- | --- | --- |
| `fog-harbor-test` | 霧港試煉場 | 2400x540 | 新手港口、碼頭、港町屋舍、霧氣、訓練區 | 已有 4 層背景，需要精修。 |
| `mist-breakwater` | 海霧堤道 | 1800x540 | 海堤、燈籠、潮位尺、霧中海面 | 已有 4 層背景，需要精修。 |
| `old-harbor-warehouse` | 舊港倉庫 | 2200x540 | 老倉庫、木箱、潮濕木板、繩索、破布 | 目前重用霧港背景，建議新增專屬背景。 |
| `coral-tide-cavern` | 珊瑚潮洞 | 2400x560 | 潮洞、珊瑚、發光礁石、潮封印 | 目前重用背景，建議新增洞穴背景。 |
| `sunken-archive` | 沉船書庫 | 2600x560 | 沉船、書庫、鹽漬書頁、海底遺跡 | 目前重用背景，建議新增沉船書庫背景。 |
| `starlit-observatory` | 星砂觀測台 | 2800x560 | 星砂、觀測鏡、夜色海港、高台 | 目前重用背景，建議新增觀測台背景。 |

背景分層建議：

- `bg_sky.png`：天空/夜空/洞穴遠景，建議 1920x540 或更寬。
- `bg_far.png`：遠山、海面、遠方港燈、洞穴深處。
- `bg_buildings_back.png` 或地圖專屬 back layer：遠層建築/岩壁/船體。
- `bg_buildings_mid.png` 或地圖專屬 mid layer：主要建築輪廓、屋簷、平台後景。
- 保持透明或可重複鋪排，避免文字 UI 區太花。

## NPC 清單

| Map | NPC ID | 名稱 | 設計方向 |
| --- | --- | --- | --- |
| 霧港試煉場 | `fog-harbor-guard` | 港口守衛 | 港口巡守，短槍/哨笛/斗笠，穩重可靠。 |
| 霧港試煉場 | `herbalist-lin` | 藥師阿霖 | 草藥包、藥箱、台灣青草店感。 |
| 霧港試煉場 | `merchant-chen` | 陳老闆 | 雜貨商人，圍裙、算盤、木箱貨架。 |
| 霧港試煉場 | `lighthouse-apprentice` | 燈塔學徒阿澄 | 年輕學徒，提燈、工具腰包。 |
| 海霧堤道 | `breakwater-scout` | 巡堤守衛阿岳 | 海堤巡查員，披風、風燈、海防感。 |
| 海霧堤道 | `tide-researcher-yu` | 測潮學徒阿澄 | 測潮筆記、潮位尺工具、研究生感。 |
| 舊港倉庫 | `warehouse-keeper` | 倉庫管理員阿桂 | 老倉庫管理員，鑰匙串、工作背心。 |
| 珊瑚潮洞 | `cavern-scholar` | 潮洞學者阿璇 | 探洞學者，防水筆記、礁石樣本。 |
| 沉船書庫 | `archive-curator` | 書庫管理員阿澈 | 沉船書庫守書人，書卷、燈籠、濕潤長袍。 |
| 星砂觀測台 | `observatory-keeper` | 觀測員阿曜 | 星象觀測員，望遠鏡、星砂披肩。 |

NPC 建議規格：

- 每位 NPC 可先做單張透明 PNG 或 idle spritesheet。
- 建議 48x64 或 64x64。
- 必須和玩家、怪物尺寸區分清楚。
- 名牌區域不要被圖像遮擋，頭部輪廓清楚。

## 怪物 / 敵人 / Boss 清單

| ID | 名稱 | 出現區域 | 定位 | 設計方向 |
| --- | --- | --- | --- | --- |
| `field-rat` | 田鼠 | 霧港試煉場 | 小怪 | 港邊田鼠，低矮、動作快，可愛但可辨識為敵人。 |
| `mist-slime` | 海霧凝膠 | 霧港試煉場、海霧堤道 | 小怪 | 半透明霧狀凝膠，藍綠色，內有水珠。 |
| `tide-watcher` | 潮眼守衛 | 海霧堤道 | Boss/精英 | 海潮眼球守衛，貝殼甲片、潮汐光圈。 |
| `warehouse-rat` | 倉鼠 | 舊港倉庫 | 小怪 | 倉庫老鼠，背著破布或木屑。 |
| `mist-puppet` | 霧化木偶 | 舊港倉庫 | 小怪 | 潮濕木偶，被霧氣附身，關節木質。 |
| `warehouse-sentry` | 倉庫巡弋者 | 舊港倉庫 | Boss/精英 | 舊倉庫自走守衛，木箱、鐵鉤、破燈。 |
| `cave-crab` | 潮洞蟹 | 珊瑚潮洞 | 小怪 | 潮間帶蟹，殼上有藍綠珊瑚紋。 |
| `reef-wisp` | 礁光幽影 | 珊瑚潮洞 | 小怪 | 發光礁石幽靈，小型漂浮光體。 |
| `coral-warden` | 珊瑚守望者 | 珊瑚潮洞 | Boss/精英 | 大型珊瑚守衛，珊瑚角、潮汐核心。 |
| `archive-drifter` | 沉船漂書 | 沉船書庫 | 小怪 | 漂浮書頁或濕書本，像被潮水驅動。 |
| `ink-sprite` | 墨潮精靈 | 沉船書庫 | 小怪 | 墨水精靈，黑藍色，拖曳墨跡。 |
| `archive-guardian` | 書庫守衛 | 沉船書庫 | Boss/精英 | 書庫守衛，船木、書卷、封印核心。 |
| `star-moth` | 星砂蛾 | 星砂觀測台 | 小怪 | 夜色飛蛾，翅膀有星砂亮點。 |
| `lens-sentinel` | 星鏡哨兵 | 星砂觀測台 | 小怪 | 小型觀測鏡哨兵，鏡片、三腳架或浮游機械。 |
| `astral-keeper` | 星穹守望者 | 星砂觀測台 | Boss/精英 | 星象守望者，大型觀測儀與星穹核心。 |

怪物 spritesheet 現有規格：

- `field_rat_idle.png`：32x24，4 frame
- `mist_slime_idle.png`：40x32，4 frame
- `tide_watcher_idle.png`：96x96，6 frame

建議補齊規格：

- 小怪：32x32、40x32 或 48x48，4 frame idle。
- 精英/Boss：80x80、96x96 或 112x96，6 frame idle。
- 透明背景 PNG。
- 命名請對應 ID，例如 `warehouse_rat_idle.png`、`coral_warden_idle.png`。

## 道具清單

| ID | 名稱 | 類型 | 設計方向 |
| --- | --- | --- | --- |
| `small-hp-potion` | 小型補血藥水 | 消耗品 | 小紅藥水瓶。 |
| `medium-hp-potion` | 中型補血藥水 | 消耗品 | 中型紅藥水瓶。 |
| `harbor-lunchbox` | 霧港便當 | 消耗品 | 港町便當、竹葉或木盒。 |
| `rat-tail` | 田鼠尾巴 | 材料 | 小型尾巴材料。 |
| `mist-gel` | 海霧凝膠 | 材料 | 藍綠半透明凝膠。 |
| `watcher-shell` | 潮眼甲片 | 材料 | 潮眼守衛掉落甲片。 |
| `warehouse-cloth` | 舊倉破布 | 材料 | 潮濕舊布。 |
| `damp-wood` | 潮濕木片 | 材料 | 舊港木板碎片。 |
| `crab-shell` | 潮洞蟹殼 | 材料 | 蟹殼。 |
| `reef-spark` | 礁光碎晶 | 材料 | 發光礁晶。 |
| `coral-key` | 珊瑚潮鑰 | 材料 | 珊瑚形鑰匙。 |
| `salted-page` | 鹽漬書頁 | 材料 | 被鹽水泡過的書頁。 |
| `ink-core` | 墨潮核心 | 材料 | 墨色核心。 |
| `archive-seal` | 書庫封印 | 材料 | 書庫封印石/符。 |
| `star-dust` | 星砂粉塵 | 材料 | 星光粉塵。 |
| `lens-core` | 星鏡核心 | 材料 | 觀測鏡核心。 |
| `astral-seal` | 星穹封印 | 材料 | 星象封印。 |
| `training-sword` | 練習木劍 | 裝備/武器 | 初級木劍。 |
| `cloth-vest` | 粗布背心 | 裝備/防具 | 初級布衣。 |
| `harbor-dagger` | 舊港短刀 | 裝備/武器 | 港邊短刀。 |
| `patched-jacket` | 補丁布衣 | 裝備/防具 | 補丁外衣。 |
| `warehouse-talisman` | 倉庫護符 | 裝備/防具 | 舊倉符牌。 |
| `reef-blade` | 礁光短刃 | 裝備/武器 | 礁光武器。 |
| `coral-coat` | 珊瑚護衣 | 裝備/防具 | 珊瑚護甲。 |
| `archive-wand` | 潮墨法杖 | 裝備/武器 | 墨潮法杖。 |
| `scholar-robe` | 書庫學袍 | 裝備/防具 | 書庫長袍。 |
| `star-sabre` | 星砂彎刀 | 裝備/武器 | 星砂彎刀。 |
| `observer-cloak` | 觀測者斗篷 | 裝備/防具 | 星象斗篷。 |

道具 icon 建議：

- 32x32 或 48x48，透明背景 PNG。
- 裝備、材料、消耗品要一眼能分辨。
- 掉落物在地上顯示時要有亮邊，避免和背景混在一起。

## 互動物件清單

| Map | ID | 名稱 | 設計方向 |
| --- | --- | --- | --- |
| 海霧堤道 | `lantern-west` | 西側霧堤燈 | 海堤燈籠，修補前後可有亮暗差。 |
| 海霧堤道 | `lantern-mid` | 中央霧堤燈 | 同系列燈籠。 |
| 海霧堤道 | `lantern-east` | 東側霧堤燈 | 同系列燈籠。 |
| 海霧堤道 | `tide-gauge-main` | 霧堤潮位尺 | 木製/金屬潮位尺。 |
| 珊瑚潮洞 | `reef-seal-west` | 西側潮封印 | 珊瑚符文封印。 |
| 珊瑚潮洞 | `reef-seal-mid` | 中央潮封印 | 珊瑚符文封印。 |
| 珊瑚潮洞 | `reef-seal-east` | 深處潮封印 | 珊瑚符文封印。 |
| 沉船書庫 | `archive-tablet-west` | 西側書庫碑 | 船木/石碑/書頁符文。 |
| 沉船書庫 | `archive-tablet-mid` | 中央書庫碑 | 船木/石碑/書頁符文。 |
| 沉船書庫 | `archive-tablet-east` | 深處書庫碑 | 船木/石碑/書頁符文。 |
| 星砂觀測台 | `observatory-lens-west` | 西側觀測鏡 | 黃銅觀測鏡。 |
| 星砂觀測台 | `observatory-lens-mid` | 中央觀測鏡 | 黃銅觀測鏡。 |
| 星砂觀測台 | `observatory-lens-east` | 深處觀測鏡 | 黃銅觀測鏡。 |

## 平台與環境材質

目前平台材質：

- `assets/tiles/harbor_platform_tiles.png`

請補強：

- 港口木板平台：潮濕木板、繩索、釘子。
- 海堤平台：石牆、青苔、水痕。
- 倉庫平台：舊木樑、木箱邊、破布。
- 潮洞平台：礁石、珊瑚、潮濕反光。
- 書庫平台：沉船木板、書頁、封印紋。
- 觀測台平台：石台、黃銅邊、星砂紋。

## Claude Design 指令

請直接把下面整段貼給 Claude Design：

```text
你現在是這個遊戲的美術總監與像素資產設計師。請針對 penglai-online/client/public/assets/ 進行美術重製與補齊，但不要改壞 TypeScript 程式邏輯。

遊戲類型：像素橫向 MMORPG / 類楓之谷玩法。
世界觀：台灣港町幻想，包含霧港、海霧堤道、舊港倉庫、珊瑚潮洞、沉船書庫、星砂觀測台。美術主軸是港町、海霧、燈籠、潮汐、舊木造建築、珊瑚洞穴、沉船書庫、星象觀測。

請優先做這些工作：

1. 背景分層
   - 為 fog_harbor_test 和 mist_breakwater 精修現有 4 層背景。
   - 為 old-harbor-warehouse、coral-tide-cavern、sunken-archive、starlit-observatory 補出專屬背景分層。
   - 背景要能橫向捲動，避免太花，不能影響 UI 與角色辨識。

2. 角色 sprites
   - 保留現有玩家 spritesheet 檔名與尺寸：
     assets/characters/player/player_idle.png：48x48，4 frame
     assets/characters/player/player_run.png：48x48，6 frame
     assets/characters/player/player_jump.png：48x48，2 frame
     assets/characters/player/player_attack.png：48x48，4 frame
     assets/characters/player/player_skill_slash.png：64x48，5 frame
   - 風格要符合台灣港町幻想，可以同時適合劍士、符師、獵人。
   - 動作要清楚，不能讓主角在深色背景中消失。

3. 怪物 sprites
   - 已有 field_rat_idle.png、mist_slime_idle.png、tide_watcher_idle.png，請精修。
   - 請補齊以下怪物 idle spritesheet：
     warehouse_rat_idle.png、mist_puppet_idle.png、warehouse_sentry_idle.png、
     cave_crab_idle.png、reef_wisp_idle.png、coral_warden_idle.png、
     archive_drifter_idle.png、ink_sprite_idle.png、archive_guardian_idle.png、
     star_moth_idle.png、lens_sentinel_idle.png、astral_keeper_idle.png。
   - 小怪可用 32x32、40x32 或 48x48，4 frame。
   - Boss/精英可用 80x80、96x96 或 112x96，6 frame。
   - 透明背景 PNG，像素邊緣清楚。

4. NPC sprites
   - 請為以下 NPC 補單張或 idle spritesheet：
     港口守衛、藥師阿霖、陳老闆、燈塔學徒阿澄、巡堤守衛阿岳、測潮學徒阿澄、倉庫管理員阿桂、潮洞學者阿璇、書庫管理員阿澈、觀測員阿曜。
   - 建議 48x64 或 64x64，透明背景。
   - 每位 NPC 要有不同輪廓與職業道具。

5. 道具 icon
   - 請製作 32x32 或 48x48 icon，透明背景。
   - 包含：補血藥水、霧港便當、田鼠尾巴、海霧凝膠、潮眼甲片、舊倉破布、潮濕木片、潮洞蟹殼、礁光碎晶、珊瑚潮鑰、鹽漬書頁、墨潮核心、書庫封印、星砂粉塵、星鏡核心、星穹封印、練習木劍、粗布背心、舊港短刀、補丁布衣、倉庫護符、礁光短刃、珊瑚護衣、潮墨法杖、書庫學袍、星砂彎刀、觀測者斗篷。

6. 平台與環境材質
   - 精修 assets/tiles/harbor_platform_tiles.png。
   - 追加不同章節可用的材質：港口木板、海堤石牆、舊倉木板、珊瑚礁石、沉船書庫木板、星砂觀測台石台。

7. 霧氣與燈籠動態
   - 精修 assets/effects/mist_overlay.png。
   - 製作可循環的霧氣 overlay，不能太厚。
   - 燈籠、封印、觀測鏡可做發光版本或簡單兩幀動畫。

重要限制：
- 不要刪除現有檔案。
- 不要改變現有檔名，除非同時更新 assetManifest.ts。
- 不要改 TypeScript 遊戲邏輯。
- PNG 必須透明背景，像素風，不要模糊、不要照片風、不要 3D。
- 角色與敵人要有高辨識度，不能和背景混在一起。
- 完成後請列出你新增或修改的所有檔案。
```
