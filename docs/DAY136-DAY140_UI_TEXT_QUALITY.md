# Day136-Day140 UI 中文文案品質整理

專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 本階段目標

建立中文文案稽核工具與文件，降低外部 AI 工具貼回程式碼時造成亂碼、用詞不一致或 UI 文案品質下降的風險。

## 完成內容

- 新增 `scripts/audit-ui-text.mjs`。
- 新增 npm script：`audit:ui-text`。
- 更新 `check:beta:v02`，加入 UI 文案稽核。
- 重寫 `docs/UI_TEXT_AUDIT.md`。
- 新增 `docs/UI_COPY_STYLE_GUIDE.md`。
- 更新 `scripts/beta-v02-check.mjs`，把文案文件與稽核腳本納入檔案檢查。

## 驗證結果

```text
UI text audit passed: 8 files scanned.
Beta v0.2 file check passed: 12 files.
```

## 下一階段建議

- Day141-Day145：任務面板重設計，支援完整任務列表與追蹤任務。
- Day146-Day150：第一章地圖美術與互動物件強化。
- Day151-Day155：整理啟動批次檔與跨電腦測試包。
