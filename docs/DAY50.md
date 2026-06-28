# Day 50 控場第二階段驗證（2026-06-26）

專案：蓬萊異聞錄 Online  
階段：課堂控場第二階段整合

## 今日目標

把 Day46-49 的禁言、踢出、聊天鎖與管理頁操作納入驗證流程。

## 完成內容

### 1. Smoke test 擴充

含 `SMOKE_ADMIN_TOKEN` 時新增測試：

```text
GET /admin/classroom
POST /admin/classroom
POST /admin/mute 對不存在玩家應回 404
POST /admin/kick 對不存在玩家應回 404
```

### 2. 文件整理

新增：

```text
docs/DAY46.md
docs/DAY47.md
docs/DAY48.md
docs/DAY49.md
docs/DAY50.md
```

### 3. 驗證項目

本日會執行：

```text
npm.cmd run typecheck
npm.cmd --workspace client run build
npm.cmd run smoke
含 ADMIN_TOKEN 的 smoke test
```

## 驗證結果

已執行：

```powershell
npm.cmd run typecheck
npm.cmd --workspace client run build
npm.cmd run smoke
SMOKE_ADMIN_TOKEN=smoke-admin npm.cmd run smoke
```

結果：

```text
TypeScript typecheck 通過
Client production build 通過
基本 smoke test 通過
含 ADMIN_TOKEN 的 smoke test 通過
/admin/classroom 成功回應
/admin/mute 對不存在玩家正確回 404
/admin/kick 對不存在玩家正確回 404
```

## Padlet AI 日誌簡記

Day50 完成控場第二階段驗證。禁言、踢出、聊天鎖與管理頁操作已納入 smoke test，教師端更接近可用於小規模校內測試。
