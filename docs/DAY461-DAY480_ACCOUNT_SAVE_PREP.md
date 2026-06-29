# Day461-Day480 帳號存檔銜接準備

## 目標

這一階段先不正式開放 Google 校園帳號登入，而是把「匿名測試存檔」和「未來學校 Google 帳號綁定存檔」的管理基礎補起來。重點是讓後台看得到目前資料狀態，也讓學生端清楚知道自己現在是匿名測試模式或帳號綁定模式。

## 完成內容

| Day | 工作項目 | 完成狀態 |
| --- | --- | --- |
| Day461-Day464 | 後台新增存檔稽核資料 | 已完成 `/admin/save-audit`，可統計全部角色、帳號綁定角色、匿名角色、帳號存檔摘要與 Smoke 測試角色。 |
| Day465-Day468 | 後台新增測試資料報表 | 已完成 `/admin/test-data`，可統計 Smoke 測試角色、回饋、聊天紀錄、管理紀錄與帳號存檔。 |
| Day469-Day472 | 測試資料清理 dry-run | 已完成 `/admin/test-data/cleanup`，預設只做 dry-run；真的刪除必須輸入 `DELETE_SMOKE_TEST_DATA`。 |
| Day473-Day475 | 後台儀表板銜接 | 系統狀態區新增帳號綁定角色、匿名測試角色、Smoke 測試角色、Smoke 測試回饋。 |
| Day476-Day478 | 學生端存檔模式提示 | 標題畫面與 P 存檔面板改成清楚顯示「匿名測試」或「學校 Google 帳號」。 |
| Day479-Day480 | 自動化測試補強 | Smoke 測試新增存檔稽核、測試資料報表、dry-run 清理與錯誤確認文字防呆。 |

## 技術細節

- `server/src/persistence.ts`
  - 新增 `AdminSaveAudit`、`TestDataReport`、`TestDataCleanupResult` 型別。
  - 新增 `getAdminSaveAudit()`、`getTestDataReport()`、`cleanupSmokeTestData()`。
  - 清理功能只鎖定 Smoke 測試資料，避免誤刪正式測試角色。

- `server/src/index.ts`
  - 新增 `/admin/save-audit`。
  - 新增 `/admin/test-data`。
  - 新增 `/admin/test-data/cleanup`。
  - 真正刪除測試資料前會先建立備份，並寫入管理紀錄。

- `client/src/adminDashboard.ts`
  - 後台系統狀態接上新 API。
  - 老師可以先看資料量，確認是否累積太多 Smoke 測試資料。

- `client/src/scenes/GameScene.ts`
  - 標題畫面顯示目前存檔模式。
  - P 面板顯示匿名測試或 Google 帳號模式。
  - 登入後提示 `1/2/3` 可切換帳號存檔。

- `scripts/smoke.mjs`
  - 加入後台新端點測試。
  - 只測 dry-run，不會真的刪除資料。
  - 測試未輸入正確確認文字時，真刪除會被拒絕。

## Padlet AI 日誌簡記

Day461-Day480：這次主要做「Google 帳號存檔正式導入前的準備」。後台新增存檔稽核，可以看匿名測試角色、帳號綁定角色和 Smoke 測試資料量；也新增測試資料 dry-run 清理機制，避免未來測試資料越堆越多。學生端則把存檔模式文字改清楚，讓玩家知道目前是匿名測試，還是已經使用學校 Google 帳號綁定存檔。

## 下一步建議

1. 後台補一個明確的「測試資料清理」按鈕，但要保留二次確認。
2. Google 登入正式測試前，先決定學校網域限制與學生帳號格式。
3. 增加帳號綁定後的角色移轉流程，避免匿名角色和 Google 角色混淆。
