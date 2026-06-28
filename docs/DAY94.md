# Day 94 防火牆與 Port 文件（2026-06-27）

專案：蓬萊異聞錄 Online  
主題：整理校內防火牆需要開放的服務。

## 完成內容

文件列出：

```text
TCP 5174：前端網頁
TCP 8787：後端 API 與 WebSocket
```

也補充：

```text
若網頁可開但無法進遊戲，多半是 8787 / WebSocket 被擋
不建議直接開放到 Internet
跨 VLAN 時要確認學生電腦可連到主機 IP
```

## Padlet AI 日誌簡述

Day94 整理防火牆與 Port 文件，方便之後換 PA 防火牆時對照需要開放哪些連線。
