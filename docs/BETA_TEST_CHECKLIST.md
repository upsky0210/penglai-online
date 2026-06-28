# Beta v0.1 測試檢查表

專案：蓬萊異聞錄 Online  
目標：確認第一章可以穩定給學生試玩，老師能管理與收集回饋。

## 老師測試流程

```text
1. 啟動 server 與 client
2. 開啟遊戲首頁
3. 開啟教師管理面板
4. 輸入 ADMIN_TOKEN
5. 確認系統狀態、線上玩家、聊天紀錄可讀取
6. 建立資料庫備份
7. 測試公告廣播
8. 測試聊天鎖定 / 解鎖
```

## 學生測試流程

```text
1. 進入遊戲
2. 建立角色名稱
3. 接清理田鼠任務
4. 打怪、撿物、回報任務
5. 前往海霧堤道
6. 完成巡查與潮眼守衛任務
7. 按 T 填寫測試回饋
```

## 多人測試流程

```text
1. 至少 3 位玩家同時進入
2. 確認線上玩家出現在管理面板
3. 確認聊天可以廣播
4. 確認教師公告能送到所有玩家
5. 確認靜音、踢出功能有效
6. 確認玩家按 H 可回安全區
```

## 自動檢查

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
npm.cmd run smoke:multi
```

## 回饋收集

```text
學生填寫 T 回饋表單
老師在管理面板查看測試回饋
下載回饋 CSV
整理到 Google Sheet 或 Padlet
```

## 已知風險

```text
美術仍是原型等級
Vite build 有 chunk size 警告
Google 登入需正式 Client ID 與學校網域測試
多人壓力測試目前只做輕量 smoke
```

## Beta 通過標準

```text
第一章任務可以從頭到尾完成
玩家死亡後可復活
玩家卡住時可按 H 回安全區
老師可查看線上玩家與聊天紀錄
老師可建立備份
學生可送出回饋
回饋可在管理面板查看並匯出 CSV
```
