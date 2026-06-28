# Day 1-21 工作規劃、流程與進度分析

日期：2026-06-25  
專案：蓬萊異聞錄 Online  
類型：2D 像素橫向平台 MMORPG Prototype  
整理範圍：Day 1 到 Day 21

## 一頁摘要

Day 1 到 Day 21 已經把專案從「能不能用 AI 做出類楓之谷玩法的原型」推進到一個可玩的 2D 橫向 MMORPG prototype。

目前已具備：

```text
本機可執行的 Phaser + Vite client
Node.js WebSocket server
shared TypeScript 資料契約
多人位置同步
移動、跳躍、平台碰撞
怪物、攻擊、技能、經驗、升級
NPC、任務、商店、背包、道具、裝備
SQLite 存檔
開始畫面、角色名稱、職業選擇
三職業數值、技能、特效與音效
第二張區域感的地圖內容
新怪物、新材料、新任務
設定面板、音量控制
區域提示與任務方向提示
```

以「校內展示 / 教學 AI 日誌 / LAN prototype」來看，已經可展示。  
以「正式公開 MMORPG」來看，仍屬早期原型，尚缺帳號系統、部署架構、安全性、內容量、維運工具與壓力測試。

## 專案目前架構

```text
penglai-online/
  client/    Phaser 3 + Vite + TypeScript
  server/    Node.js + ws + TypeScript
  shared/    client/server 共用型別、地圖、怪物、任務、物品、技能資料
  docs/      每日開發紀錄、規格書、流程文件
```

目前技術路線：

```text
Client：Phaser 3
Server：Node.js WebSocket
Shared：TypeScript workspace package
Persistence：SQLite
Local testing：localhost + Vite dev server
未來部署：Ubuntu Server / Nginx / PM2 / HTTPS / WSS
```

## 開發流程模式

這 21 天實際形成的工作流程如下：

```text
1. 先定義當日目標
2. 找到要改的資料層 / server / client / docs
3. 小步修改，避免一次重寫
4. 跑 typecheck
5. 必要時跑 client build
6. 用 WebSocket 或瀏覽器做 smoke test
7. 補當日 MD 紀錄
8. 保持 dev server 可測
```

常用驗證指令：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

目前測試網址：

```text
http://127.0.0.1:5174/
ws://localhost:8787
```

## 階段規劃與完成度

### Phase 1：核心可玩循環

範圍：Day 1-2  
目標：先證明遊戲能跑、能動、能打怪、能得到回饋。

完成內容：

```text
移動、跳躍、平台
打怪、EXP、升級
第一個 NPC 與任務
道具掉落、拾取、背包、補血藥水
```

進度判斷：完成。  
意義：專案不是停留在規格書，而是有第一個 playable loop。

### Phase 2：玩法系統整理

範圍：Day 3-6  
目標：把快速堆出來的功能整理成可擴充的前端與 UI。

完成內容：

```text
前端架構整理
Rat Tail 收集任務
商人 NPC、商店、Gold 消費
背包面板、任務面板、商店面板
```

進度判斷：完成。  
意義：從「能玩」往「像遊戲介面」前進。

### Phase 3：戰鬥與角色成長

範圍：Day 7-9  
目標：讓戰鬥、技能、裝備形成成長循環。

完成內容：

```text
技能系統第一版
MP、冷卻、技能快捷列
裝備系統第一版
ATK / DEF
角色面板
怪物裝備掉落
商店多商品選取
```

進度判斷：完成。  
意義：玩家開始有「變強」與「取得裝備」的循環。

### Phase 4：存檔與進入流程

範圍：Day 10-13  
目標：讓遊戲從一次性 demo 變成可保存角色進度。

完成內容：

```text
SQLite 存檔
save slot
存檔管理面板
開始畫面
角色名稱
職業選擇
```

進度判斷：完成。  
意義：專案開始具備長期測試基礎，不再每次重開都歸零。

### Phase 5：職業、技能與手感

範圍：Day 14-17  
目標：讓三職業從資料變成實際玩法差異。

完成內容：

```text
劍士、符咒師、獵人數值差異
職業技能
server 端技能判定
技能特效
施放音效
命中音效
打空 combat:miss
未命中提示
```

進度判斷：完成。  
意義：職業開始有辨識度，戰鬥回饋也更接近遊戲。

### Phase 6：內容擴充與導覽

範圍：Day 18-21  
目標：從測試場景走向第一張正式小地圖。

完成內容：

```text
地圖寬度擴大到 2400
燈塔營地
潮汐林道
海霧史萊姆
海霧凝膠
燈塔學徒阿澄
霧燈補給任務
設定面板
音量控制
區域名稱提示
任務方向提示
地圖路標
```

進度判斷：完成。  
意義：遊戲不再只有起始測試區，開始有探索方向與第二個任務區域。

## Day-by-Day 進度表

| Day | 主題 | 主要成果 | 進度意義 |
|---|---|---|---|
| Day 1 | 核心玩法骨架 | 移動、跳躍、打怪、EXP、升級、第一個 NPC 任務 | 完成第一個 playable loop |
| Day 2 | 道具掉落與背包 | 怪物掉落、拾取、背包、補血藥水 | 讓打怪有物品回饋 |
| Day 3 | 前端架構整理 | 整理快速累積的 client 程式 | 降低後續功能擴充風險 |
| Day 4 | 收集任務 | Rat Tail 掉落與收集型任務 | 任務目標從擊殺擴充到背包檢查 |
| Day 5 | 商店與金幣 | 商人 NPC、商店購買、Gold 消費 | 打怪任務與經濟循環接上 |
| Day 6 | UI 視窗化 | 背包、任務、商店面板 | HUD 從文字堆疊變成遊戲 UI |
| Day 7 | 技能系統 | MP、冷卻、技能判定、快捷列 | 技能從強攻擊變成 server 判定系統 |
| Day 8 | 裝備系統 | 武器、防具、ATK、DEF、角色面板 | 角色成長加入裝備層 |
| Day 9 | 裝備取得流程 | 裝備掉落、商店多商品選取 | 測試裝備變成正式取得循環 |
| Day 10 | 存檔系統 | SQLite、save slot、角色資料保存 | 從一次性 demo 進入可保存 prototype |
| Day 11 | 存檔管理介面 | 存檔面板、新角色、上一個角色 | 測試多角色更方便 |
| Day 12 | 開始畫面 | 不再開網頁直接進場，可選擇進入 | 進入流程更像正式遊戲 |
| Day 13 | 名稱與職業選擇 | 角色名稱、職業選擇、存入 server | 角色建立流程成形 |
| Day 14 | 職業差異 | 三職業 HP/MP/ATK/DEF/距離差異 | 職業開始影響實際玩法 |
| Day 15 | 職業技能 | 劍士斬擊、符咒師靈符彈、獵人遠射 | 技能依職業分化，server 防 spoof |
| Day 16 | 技能特效 | 三職業技能視覺差異、命中特效 | 戰鬥可讀性提升 |
| Day 17 | 音效與回饋 | 音效、combat:miss、未命中提示 | 操作手感與結果回饋提升 |
| Day 18 | 正式小地圖 | 擴大地圖、燈塔營地、海霧史萊姆 | 從測試場景走向內容地圖 |
| Day 19 | 新 NPC 與任務 | 燈塔學徒、海霧凝膠、霧燈補給 | 新地圖區域有任務目的 |
| Day 20 | 設定面板 | 音量、靜音、localStorage 設定 | 補上基本使用者設定 |
| Day 21 | 導覽提示 | 區域 banner、路標、任務方向 | 玩家知道自己在哪裡與該往哪裡走 |

## 目前完成度分析

### 以原型展示來看

完成度：約 75%

理由：

```text
可以開網頁玩
可以多人同步
可以打怪升級
可以接任務與領獎勵
可以撿道具、使用藥水、裝備道具
可以保存角色進度
有職業與技能差異
有第二區域與第二種怪物
有基本 UI、設定、導覽
```

仍未滿 100% 的原因：

```text
內容量仍少
美術仍是程式產生的簡易圖形
沒有完整新手教學
沒有正式登入帳號
沒有部署與營運流程
```

### 以校內 LAN 測試來看

完成度：約 60%

已具備：

```text
可本機啟動 client/server
可同 LAN 開瀏覽器連線
server 不需要 GPU
Dell 3060 SFF i5-8500 + 16GB RAM 足以做早期測試
```

還需要：

```text
固定 LAN IP
Windows 防火牆規則
啟動腳本
PM2 或 Windows service 類似機制
多人同時測試紀錄
斷線重連測試
```

### 以公開上線 MMORPG 來看

完成度：約 15-20%

原因：

```text
沒有帳號與登入安全
沒有 HTTPS/WSS 正式部署
沒有 reverse proxy
沒有壓力測試
沒有封包頻率與作弊防護完整策略
沒有管理工具
沒有內容量與美術資產管線
沒有正式備份與資料遷移流程
```

## 目前主要風險

### 1. 美術仍是 prototype 等級

目前視覺多為 Phaser rectangle/circle/text 產生，適合驗證玩法，不適合正式發表。

建議：

```text
先保持簡易美術到核心玩法穩定
之後再用 OpenDesign 或像素素材流程統一改版
```

### 2. UI 文字與編碼要整理

部分歷史字串曾在終端輸出時出現亂碼風險。  
目前新文件可正常用 UTF-8 撰寫，但正式美化前應統一檢查 client/server/shared 的顯示字串。

建議：

```text
建立 i18n 或集中式文字表
統一 UTF-8
避免把大量中文直接散落在 GameScene.ts
```

### 3. GameScene.ts 已經偏大

目前多數 client 邏輯集中在 `GameScene.ts`。  
這對快速 prototype 很有效，但功能再增加會變難維護。

建議拆分：

```text
HUDManager
AudioManager
QuestPanel
InventoryPanel
MapRenderer
CombatEffects
```

### 4. Server 尚未分區或房間化

目前是單張地圖單一 world snapshot。  
玩家少時可用，玩家多時需要控制廣播範圍。

建議：

```text
先做 10-30 人 LAN 壓測
記錄 tick rate、CPU、記憶體、封包量
再決定要不要做 map instance 或 interest management
```

### 5. 存檔仍是 prototype 模式

目前 save slot 由瀏覽器本機保存，不是正式帳號登入。

建議：

```text
短期：保留 save slot，方便教學展示
中期：加入簡單帳號 / PIN / 班級代碼
長期：正式登入與權限設計
```

## 後續工作規劃

### Day 22-25 建議：整理與穩定

```text
Day 22：文字集中化與繁中修正
Day 23：拆分 GameScene.ts，建立 HUD/Audio/Effects modules
Day 24：新手教學提示與操作說明
Day 25：LAN 測試腳本與測試紀錄表
```

### Day 26-30 建議：內容擴充

```text
Day 26：第三種怪物與第二套掉落裝備
Day 27：技能升級第一版
Day 28：任務鏈第一版
Day 29：小地圖 UI
Day 30：第一輪美術整理規格
```

### OpenDesign 介入時機

建議在以下條件達成後再交給 OpenDesign：

```text
核心玩法穩定
GameScene.ts 拆分完成
UI 文字集中化
確定 HUD、背包、任務、商店、設定面板的資料結構
```

OpenDesign 適合處理：

```text
開始畫面
角色選擇
HUD 版面
任務追蹤
背包與商店面板
技能快捷列
整體色彩與像素風格規範
```

## AI 協作流程建議

### Codex Desktop

適合：

```text
跨檔修改
架構整理
跑測試
重啟 server/client
補文件
整合多天進度
```

目前本專案主要應繼續用 Codex Desktop 做主控。

### Codex CLI / Antigravity CLI

適合：

```text
單一小任務
修一個 TypeScript error
加一個物品
加一個 NPC
改一個 UI 面板
```

交接規則：

```text
一次只讓一個 CLI 工具改
任務要窄
改完一定跑 npm.cmd run typecheck
最好先 commit 再交給另一個工具
```

### Gemini

適合：

```text
世界觀文案
任務文本
NPC 對話
教學文件
Padlet 日誌整理
企劃比較與命名發想
```

不建議直接讓 Gemini 同時大改 client/server 核心流程，除非先切出明確小任務。

## 暫時收工狀態

目前已達成：

```text
Day 1-21 每日文件已建立
核心 prototype 可玩
server/client 可本機啟動
typecheck 通過
client build 通過
具備教學展示與 AI 日誌材料
```

目前收工點合理。  
下一階段不應急著擴功能，建議先做整理、文字修正、架構拆分與 LAN 測試。
