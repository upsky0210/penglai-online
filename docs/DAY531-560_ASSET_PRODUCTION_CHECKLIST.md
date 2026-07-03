# Day531-560 美術資產生產清單（Asset Production Checklist）

交接日期：2026-07-03
接手對象：Claude Design（產圖）＋ Claude Code（manifest 接線）

## 這份文件的定位

- `docs/CLAUDE_DESIGN_ASSET_BRIEF.md` 是**風格聖經**：世界觀、每個角色/怪物/NPC/道具的設計方向。先讀那份。
- 這份是**可執行的生產清單**：哪些檔案已完成、哪些還缺、精確路徑與規格，以及地圖多樣化的美術方向。
- Claude Design 只要照這份的「缺」欄位逐檔產出即可；產出後由 Claude Code 補 `assetManifest.ts` 接線。

所有資產放在 `client/public/assets/`。全部 PNG、透明背景、像素風、邊緣清楚、與背景高對比。

---

## 現況總覽（截至 Day500）

| 類別 | 完成 | 缺 |
| --- | --- | --- |
| 玩家 spritesheet | 5 / 5 | 0（可精修） |
| 怪物 spritesheet | 3 / 15 | **12** |
| NPC sprite | 0 / 10 | **10** |
| 道具 icon | 0 / 28 | **28** |
| 地圖專屬背景 | 2 / 6 | **4 張地圖 × 4 層 = 16** |
| 平台/材質 | 1 通用 | 5 章節專屬變體 |
| 效果（霧氣） | 1 | 可精修 + 互動物件發光版 |

核心缺口約 **66 張圖**，外加既有資產精修。

---

## 1. 玩家（已完成，僅精修）

保留檔名與尺寸，勿更動（更動需同步改 `assetManifest.ts`）：

| 檔案 | 尺寸 | frame | 狀態 |
| --- | --- | --- | --- |
| `characters/player/player_idle.png` | 48×48 | 4 | ✅ 精修 |
| `characters/player/player_run.png` | 48×48 | 6 | ✅ 精修 |
| `characters/player/player_jump.png` | 48×48 | 2 | ✅ 精修 |
| `characters/player/player_attack.png` | 48×48 | 4 | ✅ 精修 |
| `characters/player/player_skill_slash.png` | 64×48 | 5 | ✅ 精修 |

---

## 2. 怪物 spritesheet（缺 12）

橫向排列的 idle spritesheet，透明背景。命名＝`<id 底線化>_idle.png`，放 `assets/monsters/`。

| 檔案 | 中文名 | 區域 | 定位 | 建議尺寸 | frame | 狀態 |
| --- | --- | --- | --- | --- | --- | --- |
| `field_rat_idle.png` | 田鼠 | 霧港 | 小怪 | 32×24 | 4 | ✅ 精修 |
| `mist_slime_idle.png` | 海霧凝膠 | 霧港/堤道 | 小怪 | 40×32 | 4 | ✅ 精修 |
| `tide_watcher_idle.png` | 潮眼守衛 | 堤道 | Boss | 96×96 | 6 | ✅ 精修 |
| `warehouse_rat_idle.png` | 倉鼠 | 舊港倉庫 | 小怪 | 40×32 | 4 | ❌ 缺 |
| `mist_puppet_idle.png` | 霧化木偶 | 舊港倉庫 | 小怪 | 48×48 | 4 | ❌ 缺 |
| `warehouse_sentry_idle.png` | 倉庫巡弋者 | 舊港倉庫 | Boss | 96×96 | 6 | ❌ 缺 |
| `cave_crab_idle.png` | 潮洞蟹 | 珊瑚潮洞 | 小怪 | 48×32 | 4 | ❌ 缺 |
| `reef_wisp_idle.png` | 礁光幽影 | 珊瑚潮洞 | 小怪 | 32×32 | 4 | ❌ 缺 |
| `coral_warden_idle.png` | 珊瑚守望者 | 珊瑚潮洞 | Boss | 96×96 | 6 | ❌ 缺 |
| `archive_drifter_idle.png` | 沉船漂書 | 沉船書庫 | 小怪 | 40×40 | 4 | ❌ 缺 |
| `ink_sprite_idle.png` | 墨潮精靈 | 沉船書庫 | 小怪 | 32×32 | 4 | ❌ 缺 |
| `archive_guardian_idle.png` | 書庫守衛 | 沉船書庫 | Boss | 112×96 | 6 | ❌ 缺 |
| `star_moth_idle.png` | 星砂蛾 | 星砂觀測台 | 小怪 | 40×32 | 4 | ❌ 缺 |
| `lens_sentinel_idle.png` | 星鏡哨兵 | 星砂觀測台 | 小怪 | 48×48 | 4 | ❌ 缺 |
| `astral_keeper_idle.png` | 星穹守望者 | 星砂觀測台 | Boss | 112×96 | 6 | ❌ 缺 |

> ⚠️ 接線提醒（Claude Code）：目前 `assetManifest.ts` 的 `optionalSpriteSheets` 只宣告了前 3 隻怪。新增的 12 隻在圖產好後，必須各補一筆 `SpriteSheetAsset`（key 對照 `monsterTextureKeys`，animationKey 對照 `monsterAnimationKeys`），否則不會載入。

---

## 3. NPC sprite（缺 10 全部）

單張 idle（或 2 frame idle spritesheet）。建議 48×64 或 64×64，透明背景。放 `assets/npc/`，命名＝`<id>.png`。

| 檔案 | 中文名 | 區域 | 狀態 |
| --- | --- | --- | --- |
| `npc/fog_harbor_guard.png` | 港口守衛 | 霧港 | ❌ 缺 |
| `npc/herbalist_lin.png` | 藥師阿霖 | 霧港 | ❌ 缺 |
| `npc/merchant_chen.png` | 陳老闆 | 霧港 | ❌ 缺 |
| `npc/lighthouse_apprentice.png` | 燈塔學徒阿澄 | 霧港 | ❌ 缺 |
| `npc/breakwater_scout.png` | 巡堤守衛阿岳 | 堤道 | ❌ 缺 |
| `npc/tide_researcher_yu.png` | 測潮學徒阿澄 | 堤道 | ❌ 缺 |
| `npc/warehouse_keeper.png` | 倉庫管理員阿桂 | 倉庫 | ❌ 缺 |
| `npc/cavern_scholar.png` | 潮洞學者阿璇 | 潮洞 | ❌ 缺 |
| `npc/archive_curator.png` | 書庫管理員阿澈 | 書庫 | ❌ 缺 |
| `npc/observatory_keeper.png` | 觀測員阿曜 | 觀測台 | ❌ 缺 |

> 每位 NPC 輪廓、職業道具、配色要能一眼區分；頭部上方留白給名牌。目前遊戲用程式繪製佔位，`assets/npc/` 是新資料夾，接線時 Claude Code 需新增 NPC 貼圖載入邏輯（GameScene 目前無 NPC texture loader）。

---

## 4. 道具 icon（缺 28 全部）

48×48 透明背景，放 `assets/items/`，命名＝`<id>.png`。掉落在地上要有亮邊避免與背景混淆。三類要一眼可分：消耗品（瓶罐/食物）、材料（碎片/核心）、裝備（武器/防具）。

消耗品（3）：`small_hp_potion` `medium_hp_potion` `harbor_lunchbox`
材料（14）：`rat_tail` `mist_gel` `watcher_shell` `warehouse_cloth` `damp_wood` `crab_shell` `reef_spark` `coral_key` `salted_page` `ink_core` `archive_seal` `star_dust` `lens_core` `astral_seal`
裝備（11）：`training_sword` `cloth_vest` `harbor_dagger` `patched_jacket` `warehouse_talisman` `reef_blade` `coral_coat` `archive_wand` `scholar_robe` `star_sabre` `observer_cloak`

> 接線提醒：目前背包/掉落用色塊或文字佔位，icon 產好後 Claude Code 需在 UI 與掉落渲染加上 icon texture 對照表。

---

## 5. 地圖多樣化（本階段重點 — 解決「地圖太像」）

### 問題根因

`assetManifest.ts` 中，**只有 `fog-harbor-test` 與 `mist-breakwater` 有專屬背景**。其餘 4 張地圖（倉庫/潮洞/書庫/觀測台）都是**借用這兩組圖並調 alpha 變暗**，所以看起來像「同一個霧港的不同亮度」。

要真正做出差異，每張地圖需要**自己的 4 層背景**，並具備 4 個可區分維度：**主色調、地平線型態（開放天空 / 洞穴頂 / 海底 / 夜空）、光源、前景招牌母題**。

### 每張地圖的視覺識別（給 Claude Design 的方向）

| 地圖 | 主色調 | 場景型態 | 光源 | 招牌母題 |
| --- | --- | --- | --- | --- |
| `fog-harbor-test` 霧港試煉場 | 灰藍晨霧＋暖木 | 開放港町，清晨 | 柔白晨光 | 港町屋舍剪影、桅杆、碼頭 |
| `mist-breakwater` 海霧堤道 | 冷灰藍＋燈籠暖點 | 開放海堤，陰天 | 燈籠暖點 | 長石堤沒入霧中、潮位尺 |
| `old-harbor-warehouse` 舊港倉庫 | **深暖褐、室內** | **半室內**倉庫 | 破窗斜射琥珀光柱 | 木樑、堆疊木箱、垂吊繩索 |
| `coral-tide-cavern` 珊瑚潮洞 | **青綠＋螢光珊瑚粉紫** | **地底洞穴**（無天空） | 生物發光珊瑚 | 鐘乳石、發光珊瑚、水面倒影 |
| `sunken-archive` 沉船書庫 | **深藍靛＋墨色** | **海底遺跡** | 上方透下的幽藍光柱 | 沉船肋骨、漂浮書頁、水中懸浮塵 |
| `starlit-observatory` 星砂觀測台 | **深紫夜＋黃銅** | **高台夜空** | 星光＋星砂微光 | 星空、黃銅觀測儀剪影、高台欄杆 |

關鍵：倉庫要像「室內」、潮洞要像「地底」、書庫要像「水下」、觀測台要像「夜空」——與前兩張開放港口拉開距離。

### 每張地圖的背景層檔案（每張 4 層）

放 `assets/maps/<map_folder>/`，四層固定命名 `bg_sky.png` `bg_far.png` `bg_back.png` `bg_mid.png`（可捲動、可橫向重複、避免中央太花蓋住 UT/角色）。

| 地圖資料夾 | 狀態 |
| --- | --- |
| `maps/fog_harbor_test/` (bg_sky/far/buildings_back/buildings_mid) | ✅ 已有，精修 |
| `maps/mist_breakwater/` (bg_sky/far/harbor_back/harbor_mid) | ✅ 已有，精修 |
| `maps/old_harbor_warehouse/` | ❌ 缺 4 層 |
| `maps/coral_tide_cavern/` | ❌ 缺 4 層 |
| `maps/sunken_archive/` | ❌ 缺 4 層 |
| `maps/starlit_observatory/` | ❌ 缺 4 層 |

寬度建議 ≥1920（試煉場最寬地圖 2800，遠景層可重複鋪排）。

> ⚠️ 接線提醒（Claude Code）：新地圖圖產好後，需改 `assetManifest.ts`：(1) 在 `optionalImageAssets` 新增 4×4=16 筆 image；(2) 把 `mapBackgroundLayers` 裡那 4 張地圖從「借用 fog/mist key」改成指向各自的新 key。這是解決「地圖太像」的最後一步。

---

## 6. 平台與環境材質（精修＋章節變體）

現有 `assets/tiles/harbor_platform_tiles.png`（通用）。建議每章一組可辨識材質：

- 港口木板（潮濕木板、繩索、釘子）
- 海堤石牆（石塊、青苔、水痕）
- 舊倉木板（舊木樑、木箱邊、破布）
- 珊瑚礁石（礁石、珊瑚、潮濕反光）
- 沉船木板（船木、書頁、封印紋）
- 觀測台石台（石台、黃銅邊、星砂紋）

---

## 7. 效果與互動物件

- `effects/mist_overlay.png`：✅ 已有，精修為可循環、不過厚的霧氣。
- 互動物件（13 個：霧堤燈 ×3、潮位尺、潮封印 ×3、書庫碑 ×3、觀測鏡 ×3）：可做「未啟動 / 已啟動發光」兩版或 2 frame 動畫。目前程式繪製佔位，屬 nice-to-have，優先度低於怪物/NPC/道具/地圖。

---

## 交付與接線流程

1. Claude Design 依「❌ 缺」欄位逐檔產出，**不刪現有檔、不改檔名、不改 TS 邏輯**，完成後列出所有新增/修改檔案。
2. Claude Code 依上面各「接線提醒」補 `assetManifest.ts` 與載入邏輯，逐項跑：
   ```powershell
   npm.cmd run typecheck
   npm.cmd --workspace client run build
   npm.cmd run audit:ui-text
   ```
3. 優先順序：**地圖背景（解決最明顯的「太像」問題）→ 怪物 → NPC → 道具 icon → 平台材質 → 互動物件發光版**。

## 給 Claude Design 的一句話指令

```text
請先讀 docs/CLAUDE_DESIGN_ASSET_BRIEF.md（風格）與 docs/DAY531-560_ASSET_PRODUCTION_CHECKLIST.md（清單），
依清單中所有標「❌ 缺」的項目逐檔產出像素資產到 client/public/assets/，
特別依第 5 節讓 6 張地圖各有不同主色調與場景型態（室內/地底/海底/夜空），
不要刪除或改名現有檔案，不要改 TypeScript 邏輯，完成後列出所有新增與修改的檔案。
```
