# 交接手冊:Claude Code → Codex(2026-07-07)

## 為什麼交接

Claude Code 額度目前分給另一個專案(`C:\AI\Codex\gas-notion`)用,penglai-online 這邊回到 Codex 手上繼續。這份文件是給 Codex(或任何接手的人/工具)看的,目的是不用重新摸索脈絡就能接著做。

## 先讀這 4 份,再動手

1. [CLAUDE.md](../CLAUDE.md) — 專案結構、常用指令、工作準則(完成的定義、何時問、何時換方法)。**這是最優先讀的檔案**,裡面的驗收指令與陷阱都是實測過的。
2. [docs/ARCHITECTURE-REVIEW.md](ARCHITECTURE-REVIEW.md) — 架構審查,含技術債優先序清單。
3. [docs/DESIGN-DECISIONS.md](DESIGN-DECISIONS.md) — 玩法/手感/經濟/命名的設計決策與理由,**之後任何平衡或內容調整都該先查這份、不要自創數值哲學**。
4. [docs/NAMING-AUDIT.md](NAMING-AUDIT.md) — 侵權與命名一致性稽核記錄(SPEC 要求避開 MapleStory/金庸/Harry Potter)。

## 目前 repo 狀態(2026-07-07 交接當下)

- 分支 `main`,工作樹**乾淨**(只有 `.claude/` 是 gitignore 的個人設定,不影響)。
- 本機 `main` **領先 origin 19 個 commit,尚未 push**。push 是使用者本人要做的動作,不要自己 push。
- 沒有 dev server 在跑(port 8787 是空的),接手後要驗證得自己起。
- 資料庫:`server/data/*.sqlite` 不進版控,如果本機沒有這個檔案,`server` 啟動時會自動建立空的。

## 這次 session(A–F)做了什麼

依 commit 順序,每項都已 typecheck + 對應 smoke 驗證過:

| 項目 | Commit | 內容 |
|---|---|---|
| A | `e90e744` | 存檔不含 mapId 導致重連座標跑到地圖外的 bug 修復;WAL 模式備份漏交易改用 `VACUUM INTO`;新增 `smoke:save-roundtrip` |
| B | `a7f1185` | 戰鬥手感:接觸傷害改依章節遞增(修掉「穿好裝後期怪打不動你」的裝甲免疫 bug)、技能改可穿透最多 3 隻、普攻加 350ms 節奏鎖、打擊回饋(震動/受擊位移/傷害浮動) |
| C | `6cca7d8` | 效能:世界快照廣播從「每人各自序列化一次」改成「每張有人的地圖序列化一次」,15 人同圖時序列化次數從 15 降到 1;新增 `smoke:broadcast-budget` |
| D | `e3febb1` | 遠端玩家攻擊會顯示招式特效(以前只有自己看得到自己的攻擊動畫,其他玩家攻擊時你這邊是靜默的) |
| E | `6f7db98` | 經濟:小紅藥掉落率改依章節遞減(第一章 100%、之後遞減),避免藥水氾濫讓金幣變死錢;潮洞學者阿璇、觀測員阿曜新增商店 |
| F | `3275db0` | 命名/侵權總校:全遊戲名稱掃過一輪確認無侵權;修掉「阿澄」NPC 撞名、「潮墨法杖」改成「潮墨符筆」(避免西幻式命名) |

**驗證方式**:每項改完都重啟乾淨的 dev server(避免測到舊進程)、跑 `npm run check:beta`(含 typecheck、build、smoke、smoke:multi、smoke:save-roundtrip、smoke:broadcast-budget),部分項目另外寫 WebSocket 探針做動態實測(例如 E 實測 ch1 掉率 12/12、ch2 掉率 10/14,證明遞減確實生效,不只是改了數字沒驗證)。

## 尚未做、值得接手的方向

依 `docs/ARCHITECTURE-REVIEW.md` 與 `docs/DESIGN-DECISIONS.md` 裡標記的待辦:

1. **GameScene.ts 巨石拆分**(架構審查點名的最大技術債):目前單檔約 4600+ 行,加第 6 章內容前建議先拆(拆法架構審查裡有具體建議)。這是最大的一塊,建議獨立一輪做,不要跟別的改動混。
2. **技能傷害微調**:B 的決策文件裡標記,若實測發現單體戰鬥技能偏弱,可微調 `skillDamageBonus`(在 server 端職業設定裡),但要先實測再調,不要憑感覺改。
3. **王的追擊/脫戰範圍**(`D4` 提到的 boss leash)這輪沒動,之後如果王的體驗有問題可以看。
4. **push 到 origin**:這次的 19 個 commit 都還在本機,使用者會自己決定何時 push。

## 接手時的關鍵準則(避免踩雷)

這些是本次 session 真的踩過的坑,已經寫進 `CLAUDE.md`,這裡再強調一次:

- **smoke 不會自己起 server**:改了 `server/` 或 `shared/` 之後,必須先重啟 dev server 再跑 smoke,否則測到的是舊進程,等於沒驗。
- **平行 session 不要同時改同一個工作樹**:如果同時開兩個 agent/工具動這個 repo,會互相覆蓋、commit 時把對方半成品掃進來。這次 session 內部就出過一次事故(已修正,教訓寫進 CLAUDE.md)。要平行就開獨立 git worktree,否則嚴格串行。
- **完成的定義**:改了程式碼不等於修好問題,要跑對應的 `smoke:*` 或 `check:beta` 實際看到通過,能實測(WebSocket 探針或起瀏覽器)就實測,不要只憑讀 code 判斷。
- **不侵權**:新增地名/角色/招式/UI 文案前對照 `docs/NAMING-AUDIT.md` 的護欄與 SPEC,`audit:ui-text` 只查編碼亂碼、查不了侵權。

## 驗收指令速查

```bash
npm run typecheck          # 三個 workspace 全檢
npm run dev                # 起 server + client(本機測試用)
npm run check:beta         # 提交前主閘:typecheck + build + 4 個核心 smoke
npm run audit:ui-text      # 只查編碼亂碼,不查侵權
npm run backup:db          # 動 DB 前先備份
```

若只改 `docs/` 或註解,不需要跑任何閘。
