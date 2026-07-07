# 命名侵權與一致性總校 (NAMING-AUDIT)

日期:2026-07-07。範圍:全遊戲 code 內的顯示名稱(shared 定義 + client UI 字串)。
依據:SPEC「避免 MapleStory、金庸、Harry Potter 的名稱/角色/設定/招式/UI」。
說明:`npm run audit:ui-text` 只查編碼亂碼,查不了侵權;此校對為人工判斷,補上那道防線。

## 掃描的類別

| 類別 | 來源 | 結果 |
|------|------|------|
| 道具(28) | `shared` ITEM_DEFINITIONS | 全原創,台灣海洋/民俗主題;修 1 項(見下) |
| NPC(10) | `shared` 各地圖 `npcs` | 全原創「阿X」民俗名;修 1 項撞名(見下) |
| 怪物(14 種) | `shared` 各地圖 `monsterSpawns` | 全原創;無問題 |
| 技能(4) | `shared` SKILL_DEFINITIONS(斬擊/靈符/狙擊/靈斬) | 通用武學詞,非金庸專有招式名;無問題 |
| 地圖(6) | `shared` GAME_MAPS | 全原創海港/潮汐主題;無問題 |
| 商店(3) | `shared` SHOP_DEFINITIONS | 全原創;無問題 |
| 區域/傳送門/互動物 | `shared` zones/portals/interactables | 全原創;無問題 |

## 結論:無侵權

未發現任何 MapleStory / 金庸 / Harry Potter 的名稱、角色、設定或招式。整體命名一致地落在「台灣海島民俗誌異」調性(港口、燈塔、潮汐、書庫、觀星),與 DESIGN-DECISIONS D7-D10 相符。

## 本輪修正的 2 項一致性問題(非侵權,但破壞沉浸/一致)

1. **NPC 撞名**:`燈塔學徒阿澄`(id `lighthouse-apprentice`)與 `測潮學徒阿澄`(id `tide-researcher-yu`)同名「阿澄」。
   - 改法:後者顯示名改為 **`測潮學徒阿汐`**(「汐」呼應測潮主題,更貼角色)。
   - 影響:`shared` NPC 名 + `client` 潮眼守衛擊退提示文字,共 2 處已同步。
2. **西幻式命名不一致**:`潮墨法杖` 的「法杖」是全遊戲唯一的西方奇幻式武器命名。
   - 改法:顯示名改為 **`潮墨符筆`**(符筆貼合本作符師/民俗調性)。

## 重要:只改顯示名,不改 id

兩項都**只改 `name` 顯示字串,`id` 維持不變**(`tide-researcher-yu`、`archive-wand`)——因此不動存檔相容性,無需存檔遷移。

## 給之後新增內容的護欄

- 命名從「台灣實物/民俗」出發(器物、地景、職稱),避免西幻詞(法杖、魔杖、聖劍、法師…)。
- 武學招式用通用漢語武學詞,不套四字金庸格式的專有招式名。
- 新 NPC 命名前先 grep 既有「阿X」避免撞名。
- `audit:ui-text` 擋不了侵權,新增文案仍須人工對照本檔與 SPEC。
