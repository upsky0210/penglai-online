# 交接手冊:Claude Code → Codex(2026-11-13,P11 美術升級)

## 這次要做什麼

把主角招式、NPC、寶物物品的外觀升級,線上多人版與安平單機版都要吃到。**只換外觀**:伺服器數值、訊息協定、存檔格式都不動。

Claude Code 已完成 P11-0(規範與規格,只動了 `docs/` 與 `CLAUDE.md` 的一行)。P11-1 到 P11-6 由 Codex 執行。Claude Code 只在兩個點回來:P11-2 之後的切片審查,以及 P11-7 總驗收。

## 開工前讀這五份

1. [CLAUDE.md](../CLAUDE.md):驗收指令、完成的定義、踩過的坑。
2. [P11-ART-UPGRADE-PLAN.md](P11-ART-UPGRADE-PLAN.md):問題清單與工作包。
3. [P11-ART-BIBLE-V2.md](P11-ART-BIBLE-V2.md):該長什麼樣、不該長什麼樣。
4. [P11-ASSET-SPEC.md](P11-ASSET-SPEC.md):尺寸、幀數、檔名、每一件素材的內容。
5. [DESIGN-DECISIONS.md](DESIGN-DECISIONS.md) 的 D1–D3、D7–D10、D16:戰鬥手感與世界觀的既有決定。

## 交接當下的 repo 狀態

- 分支 `main`。P11-0 的文件已提交在 `fbf1237` 之後的一個 commit(`docs: complete P11-0 art upgrade plan, bible and asset spec`),尚未 push。
- 該 commit 新增三份 `docs/P11-*.md` 與本文件,修改 `docs/SPEC.md`、`docs/NAMING-AUDIT.md`、`docs/DESIGN-DECISIONS.md`、`docs/P8-CHARACTER-ART-BIBLE.md`、`CLAUDE.md`。開工前確認工作樹是乾淨的。
- `npm run typecheck` 在 `fbf1237` 通過。其他閘這一輪沒跑(只動文件)。
- 這台機器的 `tmp/imagegen/` 不存在,P8/P9 的生成原圖不在這裡。風格參考用 `client/public/assets/p8/style/p8_anping_style_anchor.png` 與現有成品圖。

## 不可以做的事

- 不改 `server/` 的任何邏輯與數值。
- 不改訊息協定(`ClientMessage`、`ServerMessage`)、不改存檔格式、不動 `persistence.ts`。
- 不改任何 id。不改技能名、物品名、NPC 名(P11-ASSET-SPEC §9 的三項要使用者明確同意才動)。
- 不加新招式、不加裝備欄、不加屬性相剋。
- 不刪 `p8/`、`p9/` 素材與現有的回退鏈。
- 不刪 `client-src-before-claude-design-20260627/` 與根目錄截圖(要刪先問使用者)。
- 不 push。push 由使用者決定。
- 提示詞不寫任何作品名、角色名;不用圖像生成產生文字。

## 工作包與模型

使用者指定 Codex 主要用 `astra-6` 與 `sol-6.1`。

| 包 | 內容摘要 | 模型 | 提交前要過的閘 |
| --- | --- | --- | --- |
| **P11-1** 管線與工具 | shared 資料拆檔(只搬不改);`?gallery=1` 素材檢視頁;`check:assets`;禁用詞檢查;新的 sprite 建置腳本(單一縮放比例);`p11-records.json` 格式;風格錨點圖移到 `docs/art/` | `sol-6.1` | `npm run check:beta`(動到 shared);gallery 能列出現有全部素材 |
| **P11-2** 垂直切片 | DOM 疊層容器;劍士「斬擊」完整四段演出與題字;港吏立繪與新對話框;三件物品(`small-hp-potion`、`coral-key`、`star-sabre`)的圖示、品階框、背包格、取得提示;技能列 | `astra-6` + 圖像生成 | `typecheck`、client build、`check:assets`、`check:p8-g`;**做完停下來** |
| **P11-3** 物品量產 | 其餘 25 件圖示與掉落圖;`rarity`、`description` 欄位;背包完整功能 | `sol-6.1` + 圖像生成 | `check:beta`(動到 shared)、`check:assets` |
| **P11-4** 招式量產 | 符咒師、獵人職業動作;靈符、狙擊四段演出;三種命中;普攻三變化;遠端玩家降級顯示 | `astra-6` + 圖像生成 | `typecheck`、client build、`check:assets`、`check:p8-g`;兩個 client 互看 |
| **P11-5** NPC 量產 | 其餘 12 張立繪;10 個說話手勢;單機版 3 名 NPC 待機 | `sol-6.1` + 圖像生成 | `typecheck`、client build、`check:assets` |
| **P11-6** 單機版整合 | `AnpingScene` 改用共用的素材載入、`CombatVfx`、NPC 與 DOM 疊層,取代色塊 | `astra-6` | client `typecheck` + build;瀏覽器走完主線與家書支線 |

P11-7 總驗收交回 Claude Code。

### P11-2 之後一定要停

切片的目的是讓使用者在量產前看到實際畫面。P11-2 完成後:

1. commit。
2. 附上至少四張 960×540 實機截圖:放招起手、放招本體、對話框含立繪、背包開啟並滑過一件物品。另附一張全螢幕(1920×1080)下的背包截圖,用來確認 DOM 疊層的圖示是清楚的。
3. 寫 `docs/P11-2-VERTICAL-SLICE.md`:做了什麼、怎麼驗的、看到什麼、哪裡與規格不同及原因。
4. **不要開始 P11-3。**等使用者看過並說可以。

### P11-2 開工先確認一件事

在瀏覽器確認遊戲畫布的實際像素尺寸(`document.querySelector("canvas").width`)。規格假設它固定是 960,所以高解析介面素材必須走 DOM 疊層(P11-ASSET-SPEC §1.3)。若不是 960,先回報,不要自行改方案。

## 每一包的交付方式

- 一包一個 commit,commit 訊息沿用專案慣例(`feat: ...`、`fix: ...`)。
- 每包寫一份簡短交付文件 `docs/P11-<n>-<名稱>.md`,格式參考 `docs/P8-EF-PROPS-VFX.md`:做了什麼、素材放哪、怎麼驗的。
- 畫面相關的改動要實際起 `npm run dev` 看,交付文件裡寫明**具體做了什麼操作、看到什麼**。看不了就直說,並附手動確認清單。
- 測試沒跑就寫沒跑,失敗就貼輸出。
- 新素材都要在 `scripts/assets/p11-records.json` 留紀錄;每包的生成原圖備份到 repo 外,位置寫進交付文件。

## 容易踩的坑

- **smoke 不會自己起 server。**改了 `shared/` 之後要先重啟 `npm run dev` 再跑 smoke,否則測到舊進程。`check:release` 例外,它會自己起隔離的 server,而且不可以預先啟動 server。
- **不要平行改同一個工作樹。**生圖與寫程式若要同時進行,各開 git worktree;否則嚴格串行。
- **`shared/src/index.ts` 後段有一層歷史化改名**(`relabelMapEntries`,約第 2340 行起)。地圖、NPC、怪物在畫面上顯示的是改名後的名字,不是前面定義裡的名字。拆檔時要保持這段的執行順序。
- **現有主角技能圖把劍氣畫進了角色圖**(`p8/characters/player/player_skill_slash.png`)。接上新的「斬擊」特效後會重疊,P11-2 要處理:重畫一張不含劍氣的劍士技能動作,或在播放新特效時改用不含劍氣的幀。選哪個寫進交付文件。
- **預設入口是單機版。**線上版要加 `?online=1` 並啟動 server;單機版只需要 `npm --workspace client run dev`。兩個都要看。
- **`audit:ui-text` 不查侵權。**新增文案與提示詞要過 P11-1 寫的禁用詞檢查,造型相似度仍靠人工。
- **低階模式要一起驗。**網址加 `?quality=low`。

## 遇到這些情況請停下來問使用者

- 規格與實際程式或素材對不上(例如立繪表的道具與現有小人不同且無法判斷以誰為準)。
- 要動到「不可以做的事」任何一條才能完成。
- 圖像生成怎麼調都達不到 Bible 的一致性要求。
- 同一個問題修了兩次還是同類錯誤。
