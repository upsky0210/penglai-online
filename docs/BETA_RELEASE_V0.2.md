# Beta v0.2 Release Notes

專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 版本定位

Beta v0.2 是「可進行小班級測試」版本，重點不只是遊戲能玩，而是老師可以控場、發公告、收回饋、追蹤問題。

## 新增內容

- 後台公告系統
  - 公告歷史
  - 公告 CSV
  - 公告分類
  - 公告有效期限
  - 玩家登入推送最新公告

- 玩家端公告面板
  - 按 `U` 查看最近公告

- Beta 回饋管理
  - 回饋狀態：未處理、處理中、已修正、暫不處理
  - 管理備註
  - 回饋 CSV 補狀態與備註

- 第一章內容補強
  - 新增 NPC：測潮學徒阿澄
  - 新增任務：修補霧堤燈
  - 新增任務：回收潮眼甲片
  - 第一章流程調整為 7 步

## 驗證指令

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
npm.cmd run smoke:multi
npm.cmd run check:beta:v02
```

## 已知限制

- 遊戲美術仍是 prototype 等級。
- UI 面板仍需做更完整的版面設計。
- 目前適合 LAN / 校內測試，不建議直接公開到 Internet。
- Google Workspace 登入需另外設定 Client ID 與網域限制。

## 下一版方向

- Beta v0.3：第一章完整關卡節奏、更多地圖互動、任務面板重設計。
