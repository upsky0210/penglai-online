# Day481-Day500 後台清理操作台與 Google 前置檢查

## 目標

這一階段延續 Day461-Day480 的帳號存檔準備，把後台 API 做成老師可以操作的維護介面。重點不是正式開放 Google 登入，而是先讓後台能看懂資料狀態、預覽 Smoke 測試資料、並用強確認方式清理測試資料。

## 完成內容

| Day | 工作項目 | 完成狀態 |
| --- | --- | --- |
| Day481-Day484 | 後台新增 Smoke 測試資料清理區 | 已完成，系統狀態下方新增「Smoke 測試資料清理」面板。 |
| Day485-Day488 | 清理前 dry-run 預覽 | 已完成，老師可先按「預覽清理範圍」，不會刪除任何資料。 |
| Day489-Day492 | 正式清理強確認 | 已完成，必須輸入 `DELETE_SMOKE_TEST_DATA`，並通過瀏覽器確認。 |
| Day493-Day495 | 清理後自動更新後台 | 已完成，清理或預覽後會重新整理報表、備份列表與系統狀態。 |
| Day496-Day498 | Google 登入前置檢查 | 已完成，後台系統狀態顯示 Google Client ID、網域限制與 Auth CORS 設定。 |
| Day499-Day500 | Smoke 測試補強 | 已完成，測試會確認新欄位、dry-run 回傳格式與錯誤確認文字防呆。 |

## 使用方式

1. 開啟後台並輸入 `ADMIN_TOKEN`。
2. 按「重新整理」確認系統狀態。
3. 在「Smoke 測試資料清理」區查看目前測試資料數量。
4. 先按「預覽清理範圍」確認會影響的資料。
5. 若確定要清理，在確認文字輸入 `DELETE_SMOKE_TEST_DATA`。
6. 按「清理 Smoke 測試資料」。

正式清理前，伺服器會先建立 SQLite 備份；清理紀錄也會寫進管理操作紀錄。

## 技術細節

- `client/src/adminDashboard.ts`
  - 新增測試資料清理面板。
  - 新增 dry-run 與正式清理按鈕。
  - 新增確認文字輸入欄。
  - 系統狀態新增 Google 前置設定欄位。

- `client/src/styles.css`
  - 新增清理面板樣式。
  - 補上清理按鈕 disabled 狀態。
  - 手機寬度下仍維持單欄可操作。

- `server/src/index.ts`
  - `/admin/system` 回傳 Google Client ID 是否設定、Hosted Domain 與 Auth CORS。

- `scripts/smoke.mjs`
  - 驗證 `/admin/system` 的 Google 前置檢查欄位。
  - 驗證 `/admin/test-data/cleanup` dry-run payload。
  - 驗證錯誤確認文字會被拒絕。

## Padlet AI 日誌簡記

Day481-Day500：今天把「測試資料清理」從後端 API 做成後台可操作介面。老師可以先 dry-run 預覽 Smoke 測試資料，不會直接刪除；真的要清理時必須輸入固定確認文字，系統會先備份 SQLite。也補上 Google 登入前置檢查，後台可以看到 Client ID、學校網域限制和 CORS 是否設定，方便之後正式接學校 Google 帳號。

## 下一步建議

1. 開始規劃 Google 登入正式測試流程。
2. 決定是否限制學校 Google 網域，例如 `school.edu.tw` 或教育局指定網域。
3. 增加匿名角色轉移到 Google 帳號的流程，避免學生登入後找不到原本角色。
