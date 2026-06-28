# UI 中文文案稽核

專案：蓬萊異聞錄 Online  
更新日期：2026-06-28

## 目的

避免從外部工具貼回程式碼時混入亂碼、替換字元或不一致的中文 UI 文案。

## 自動檢查

```powershell
npm.cmd run audit:ui-text
```

嚴格模式：

```powershell
node scripts/audit-ui-text.mjs --strict
```

## 掃描範圍

- `client/src/scenes/GameScene.ts`
- `client/src/adminDashboard.ts`
- `client/src/game/clientConfig.ts`
- `client/src/styles.css`
- `shared/src/index.ts`
- `START_PENGLAI.bat`
- `START_PENGLAI_UBUNTU.sh`
- `docs/UI_TEXT_AUDIT.md`

## 檢查重點

- 不應出現 Unicode 替換字元。
- 不應出現 Unicode 私用區字元。
- 不應出現常見 UTF-8/Big5 轉碼錯誤片段。
- UI 文字應使用台灣正體中文。
- 同一功能的名稱應一致，例如：公告、任務、背包、角色、回饋、後台。

## 目前結論

Day136 檢查結果：

```text
UI text audit passed
```

目前核心檔案沒有偵測到高風險亂碼。
