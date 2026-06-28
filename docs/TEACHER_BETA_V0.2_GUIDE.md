# 教師 Beta v0.2 操作手冊

專案：蓬萊異聞錄 Online  
日期：2026-06-28

## 啟動方式

Windows：

```powershell
START_PENGLAI.bat
```

Ubuntu / VM：

```bash
chmod +x START_PENGLAI_UBUNTU.sh
ADMIN_TOKEN=change-this-token ./START_PENGLAI_UBUNTU.sh
```

## 學生入口

```text
http://老師電腦IP:5174
```

## 教師後台

```text
http://老師電腦IP:5174/?admin=1
```

預設測試 token：

```text
smoke-admin
```

正式測試請改成自己的 `ADMIN_TOKEN`。

## 課堂建議流程

1. 老師先開後台，確認線上人數。
2. 用公告發送測試目標，例如「請完成第一章前 3 個任務」。
3. 學生進入遊戲並建立角色。
4. 學生完成任務、打怪、拾取、回報。
5. 老師觀察後台線上玩家與聊天紀錄。
6. 學生按 `T` 送出回饋。
7. 老師在後台將回饋標記為未處理、處理中、已修正或暫不處理。
8. 測試結束後匯出角色、聊天、公告、回饋 CSV。

## 常用按鍵

```text
A / D：移動
W：跳躍
K：攻擊
J：技能
E：對話 / 傳送
F：拾取
H：回安全區
I：背包
Q：任務
C：角色
P：存檔
U：公告
T：回饋表
```

## 後台重點功能

- 公告廣播：可選分類與有效期限。
- 公告歷史：可查看曾發送的公告。
- 線上玩家：可踢出或靜音。
- 聊天鎖定：可暫停全班聊天。
- 測試回饋：可更新狀態與處理備註。
- 備份：可建立 SQLite 備份。

## 測試後整理

建議匯出：

- 角色 CSV
- 聊天 CSV
- 公告 CSV
- 回饋 CSV

可貼到 Google Sheet 或 Padlet 作為課堂 AI 開發紀錄。
