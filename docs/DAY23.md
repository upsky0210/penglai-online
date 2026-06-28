# Day 23 開發紀錄
日期：2026-06-26  
專案：蓬萊異聞錄 Online  
主題：GameScene 拆分第一步

## 今日目標

`client/src/scenes/GameScene.ts` 已經累積大量功能。  
Day 23 的目標不是一次重寫，而是先拆出最獨立、風險最低的兩塊：音效管理與 UI 面板建立。

## 完成內容

### 1. 拆出 GameAudioManager

新增：

```text
client/src/game/audioManager.ts
```

負責：

```text
讀取 / 儲存音量設定
靜音狀態
Web Audio Context
playTone
普通攻擊音效
技能施放音效
命中音效
擊破音效
打空音效
冷卻 / 法力不足提示音
音量預覽音
```

`GameScene.ts` 現在只呼叫：

```text
this.audio.playAttackSound(...)
this.audio.playHitSound(...)
this.audio.playMissSound(...)
this.audio.playBlockedSound()
```

### 2. 拆出 UI panel helper

新增：

```text
client/src/game/uiPanel.ts
```

負責建立標準 UI 面板：

```text
container
title
body
背景
邊框
標題列
```

`GameScene.ts` 保留薄 wrapper `addUiPanel(...)`，實際樣式由 `createUiPanel(...)` 控制。

### 3. 為後續重構鋪路

這次先拆：

```text
AudioManager
UiPanel helper
```

之後可以繼續拆：

```text
InventoryPanel
QuestPanel
ShopPanel
SavePanel
CombatEffects
MapRenderer
```

## 修改檔案

```text
client/src/game/audioManager.ts
client/src/game/uiPanel.ts
client/src/scenes/GameScene.ts
docs/DAY23.md
```

## 測試結果

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
```

結果：

```text
shared typecheck 通過
server typecheck 通過
client typecheck 通過
client build 通過
```

## Padlet AI 日誌簡要版

今天完成 Day 23：GameScene 拆分第一步。因為主場景檔案已經很大，今天先挑最獨立的兩塊拆出來：音效管理與 UI 面板建立。音效現在由 `GameAudioManager` 負責，包含音量、靜音、攻擊音、命中音與打空音。UI 面板也抽成 `uiPanel.ts`，之後如果要改面板樣式，不用在主場景裡改。這是整理期的重要一步，先降低未來繼續擴功能的維護壓力。
