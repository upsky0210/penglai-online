# Day 83 回饋資料儲存 API（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：後端新增測試回饋資料表與送出 API。

## 完成內容

新增 SQLite 資料表：

```text
test_feedback
```

新增公開 API：

```text
POST /feedback
```

儲存內容包含：

```text
姓名 / 班級
角色名稱 / 存檔
Google 帳號關聯
所在地圖
第一章進度
難度
卡關點
建議
送出時間
```

## 驗證

```powershell
npm.cmd run typecheck
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
```

## Padlet AI 日誌簡述

Day83 新增回饋儲存 API，學生送出的測試意見會寫入 SQLite，並記錄角色、地圖與第一章進度。
