# 校內區網部署與防火牆

## 預設服務

```text
Client dev server：5174
Server / WebSocket / API：8787
管理面板：http://主機IP:5174/?admin=1
```

## Windows 主機

```powershell
START_PENGLAI.bat
```

確認本機 IP：

```powershell
ipconfig
```

學生端開啟：

```text
http://主機IP:5174
```

## Ubuntu / VM

```bash
npm install
chmod +x START_PENGLAI_UBUNTU.sh
ADMIN_TOKEN=change-this-token ./START_PENGLAI_UBUNTU.sh
```

## 防火牆需求

```text
TCP 5174：前端網頁
TCP 8787：後端 API 與 WebSocket
```

## 校內 PA 防火牆提醒

```text
先確認是否只開放校內 VLAN
不要直接開到 Internet
若跨 VLAN，確認學生電腦能連到主機 IP 的 5174 與 8787
若瀏覽器能開頁面但無法登入遊戲，通常是 8787/WebSocket 被擋
```

## 快速檢查

```powershell
curl http://主機IP:8787/health
```

成功時應看到 JSON，包含：

```json
{"ok":true}
```
