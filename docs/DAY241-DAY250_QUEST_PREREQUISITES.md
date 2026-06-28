# Day241-Day250 任務前置與章節化
專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 階段目標

Day241-Day250 的目標是把任務從「全部 available」整理成「依章節與前置條件逐步開放」。

## 已完成

- `QuestDefinition` 新增 `chapterId`。
- `QuestDefinition` 新增 `prerequisiteQuestIds`。
- 第一章任務建立前置鏈。
- 舊港倉庫任務建立前置鏈。
- Server 阻擋未解鎖任務。
- Client 顯示 `[鎖定]`。
- 導引略過鎖定任務。
- 新增 `smoke:quest-lock`。

## Padlet AI 日誌

Day241-Day250 完成任務前置與章節化。這讓遊戲更像正式 RPG 流程，玩家會照順序解任務，而不是一開始看到全部任務。

