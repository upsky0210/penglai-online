# Day 7 工作內容

日期：2026-06-23  
專案：蓬萊異聞錄 Online  
主題：技能系統第一版、MP、冷卻時間、技能快捷列

## 今日目標

Day 7 的目標是把原本的 `J skill` 從單純的強攻擊，改成真正的技能系統第一版。  
技能不再只是 client 告訴 server「我要打比較痛」，而是由 server 判定 MP、冷卻時間、傷害與攻擊範圍。

## 完成項目

### 1. 新增技能資料

在 shared package 新增技能資料：

```text
SkillId
SkillDefinition
SKILL_DEFINITIONS
```

目前第一個技能：

```text
Spirit Slash
快捷鍵：J
MP 消耗：12
冷卻時間：1.8 秒
傷害：24
範圍：比普通攻擊更遠
```

### 2. Server 權威技能判定

技能施放由 server 判定。

server 會檢查：

- 玩家是否活著
- 技能是否存在
- MP 是否足夠
- 技能是否還在冷卻
- 攻擊是否命中怪物

技能成功時：

- 扣除 MP
- 設定技能冷卻
- 使用技能傷害與技能範圍
- 回傳 `skill:notice`
- 回傳帶有 `isSkill` 與 `skillId` 的 `combat:hit`

技能失敗時：

```text
MP 不足 -> Need 12 MP for Spirit Slash.
冷卻中 -> Spirit Slash cooling down: 1.7s.
```

### 3. MP 自動回復

server 新增 MP 回復邏輯。

目前設定：

```text
最大 MP：40
每秒回復：5 MP
升級或重生：MP 回滿
```

MP 會透過既有 `world:snapshot` 同步到 client。

### 4. Client HUD 更新

新增 MP 條：

```text
MP 40/40
```

新增技能快捷列文字：

```text
J Spirit Slash | 12 MP | Ready
```

狀態會依照情況改變：

```text
Ready
1.5s
Need 4 MP
```

### 5. 技能視覺回饋

技能攻擊仍使用藍色 hitbox。

技能命中時，傷害數字會用藍色顯示，和普通攻擊的黃色傷害做區分。

## 驗證結果

已通過：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

也完成 WebSocket 技能流程測試：

1. 連線進入 server
2. 移動到 Field Rat 附近
3. 施放 `Spirit Slash`
4. 確認收到 `Spirit Slash used.`
5. 確認 MP 從 40 扣到 28
6. 確認技能造成 24 傷害
7. 立刻再次施放
8. 確認收到冷卻提示

測試結果：

```text
Spirit Slash used.
MP：40 -> 28
damage：24
remainingHp：12
cooldown：1.8s
```

## 修改範圍

主要修改：

```text
shared/src/index.ts
server/src/index.ts
client/src/scenes/GameScene.ts
docs/DAY7.md
```

## 設計筆記

### 為什麼技能要由 server 判定

技能會影響：

- 傷害
- MP
- 冷卻時間
- 打怪效率
- 任務進度
- 經驗值取得

這些都屬於線上遊戲的核心狀態，不能由 client 自行決定。  
client 只能送出「我要施放技能」的請求，server 才決定是否成功。

### 為什麼先做一招技能

第一版只做 `Spirit Slash`，是為了先把技能系統的骨架做穩：

- 技能資料表
- MP 消耗
- 冷卻表
- 技能提示
- 技能傷害
- UI 狀態

之後要加火球、治療、範圍技，只要擴充 `SKILL_DEFINITIONS` 與技能效果處理即可。

## Padlet AI 日誌簡記

今天完成 Day 7：把原本的 `J skill` 改成真正的技能系統第一版。新增 `Spirit Slash`，需要 12 MP、冷卻 1.8 秒、造成 24 傷害。server 會判定 MP 是否足夠與技能是否冷卻完成，client 則新增 MP 條與技能快捷列，會顯示 Ready、冷卻秒數或 MP 不足。這一步讓戰鬥開始有資源管理與技能節奏，不再只是一直按攻擊。

## 下一階段建議

Day 8 建議做 `裝備系統第一版`：

1. 新增武器與防具資料
2. 背包道具分成 consumable、material、equipment
3. 裝備武器後增加攻擊力
4. 裝備防具後降低碰撞傷害
5. 新增角色面板顯示 ATK / DEF
