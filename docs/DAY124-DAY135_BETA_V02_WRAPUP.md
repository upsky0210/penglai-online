# Day124-Day135 Beta v0.2 收斂

專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 完成內容

- 新增第一章支線：修補霧堤燈。
- 修正同一 NPC 多任務處理。
- 第一章流程調整為 7 步。
- 任務面板顯示與右側 UI 位置微調。
- 新增 Beta v0.2 檔案檢查腳本。
- 新增 Beta v0.2 Release Notes。
- 新增教師 Beta v0.2 操作手冊。

## 影響檔案

- `shared/src/index.ts`
- `server/src/index.ts`
- `client/src/scenes/GameScene.ts`
- `scripts/beta-v02-check.mjs`
- `package.json`
- `docs/BETA_RELEASE_V0.2.md`
- `docs/TEACHER_BETA_V0.2_GUIDE.md`

## 驗證

```bash
npm.cmd run typecheck
npm.cmd --workspace client run build
node scripts/beta-v02-check.mjs
SMOKE_ADMIN_TOKEN=smoke-admin SMOKE_BASE_URL=http://localhost:8788 SMOKE_WS_URL=ws://localhost:8788 npm.cmd run smoke
SMOKE_WS_URL=ws://localhost:8788 npm.cmd run smoke:multi
```

## 下一階段建議

- Day136-Day140：整理中文 UI 文案與亂碼風險。
- Day141-Day145：任務面板重設計，加入完整任務列表與目前追蹤任務。
- Day146-Day150：第一章地圖美術與互動物件強化。
