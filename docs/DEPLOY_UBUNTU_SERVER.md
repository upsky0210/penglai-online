# 課堂伺服器部署：Dell OptiPlex 3060 SFF + Ubuntu Server 24.04

把一台空的 Dell SFF（i5-8500／16 GB／256 GB）變成「開機就能上課」的遊戲伺服器。
一鍵腳本：[deploy/ubuntu/penglai-deploy.sh](../deploy/ubuntu/penglai-deploy.sh)。

> **驗證狀態**：腳本與設定檔已通過語法檢查，伺服器啟動指令已在 Windows 開發機實測；
> 但開發機沒有 Ubuntu 環境，**整套流程尚未在真機上跑過**。第一次安裝就是實測，
> 請照第 5 節逐項驗收，有錯誤把畫面訊息貼回來即可。

## 架構

```text
學生／老師瀏覽器 ──http://伺服器IP（80 埠）──> nginx
                                              ├─ 前端靜態檔（client/dist）
                                              └─ /ws、/auth、/account、/admin、/health、/feedback
                                                   └─> 127.0.0.1:8787 遊戲伺服器（systemd 服務 penglai）
                                                          └─> SQLite：/var/lib/penglai/data/penglai.sqlite
```

- 學生與老師只連 **80 埠**；8787 由防火牆擋住、不對外。
- 遊戲伺服器開機自動啟動、當掉 3 秒後自動重啟；關機或重啟前會先寫入未存的進度。
- 每天 17:30 自動備份，保留 30 天；只自動裝安全更新，**絕不自動重開機**。
- 跟舊的 Windows 啟動方式不同：不再需要 5174 埠，也不跑 Vite 開發伺服器。

## 0. 事前準備

- [ ] **先把最新程式碼 push 到 GitHub**：安裝腳本會從 GitHub 下載程式碼。
- [ ] 向學校資訊組要一個**固定 IP**（或在 DHCP 做保留），學生網址才不會變。
- [ ] 確認學生電腦所在網段（VLAN）能連到這台主機的 80 埠。
- [ ] 一支 4 GB 以上的隨身碟。

## 1. BIOS 設定（開機時按 F2）

選單名稱依 BIOS 版本可能略有不同：

| 項目 | 設定 | 為什麼 |
|---|---|---|
| System Configuration → SATA Operation | **AHCI** | 出廠常是 RAID On，Ubuntu 安裝程式會看不到硬碟或要求關閉 Intel RST。硬碟是空的，切換不會遺失資料 |
| Power Management → AC Recovery | **Power On** | 停電復電後自動開機，不用有人去按電源 |
| Secure Boot | 維持開啟即可 | Ubuntu 支援 |

開機時按 **F12** 選 USB 開機。

## 2. 安裝 Ubuntu Server 24.04 LTS

1. 到 ubuntu.com 下載 **Ubuntu Server 24.04 LTS** ISO，用 Rufus 或 balenaEtcher 寫入隨身碟。
2. 安裝流程：
   - 語言選 **English**：伺服器的實體螢幕無法顯示中文，之後改用遠端連線操作。
   - 網路：資訊組給了固定 IP 就在這裡設定（Edit IPv4 → Manual）；否則先用 DHCP。
   - 儲存空間：Use an entire disk。建議**取消勾選** "Set up this disk as an LVM group"，整顆硬碟直接使用最單純。
   - Profile：伺服器名稱可填 `penglai`，設定你的帳號與密碼。
   - **勾選 Install OpenSSH server**（重要，之後要從 Windows 遠端操作）。
   - Featured snaps：都不要選。
3. 安裝完重開機，拔掉隨身碟。

## 3. 從 Windows 遠端連線

部署腳本的訊息是中文，伺服器實體螢幕顯示不了，所以從你的 Windows 電腦連過去操作。
先在伺服器螢幕登入，輸入 `hostname -I` 看 IP，然後在 Windows 的 PowerShell：

```powershell
ssh 你的帳號@伺服器IP
```

## 4. 一鍵安裝

```bash
sudo apt update && sudo apt install -y git
git clone https://github.com/upsky0210/penglai-online.git ~/penglai-online
sudo bash ~/penglai-online/deploy/ubuntu/penglai-deploy.sh install
```

約 5–10 分鐘，腳本會依序：

1. 安裝 nginx、Node.js 24、防火牆、自動安全更新。
2. 建立服務帳號 `penglai`，把程式碼放到 `/opt/penglai-online`。
3. 產生設定檔 `/etc/penglai/penglai.env`，內含**隨機產生的教師 Token**。
4. 安裝相依套件、建置前端。
5. 設定 systemd 服務、每日備份、nginx、防火牆（只開 22 與 80）。
6. 啟動、做健康檢查，並建立第一份備份。

完成後畫面會顯示學生入口與教師後台網址。腳本可以重複執行，不會覆蓋既有的設定與存檔。

## 5. 安裝後驗收

| 檢查 | 做法 | 預期 |
|---|---|---|
| 服務狀態 | `sudo bash /opt/penglai-online/deploy/ubuntu/penglai-deploy.sh status` | penglai 與 nginx 都是 active，健康檢查有 `{"ok":true...}` |
| 學生入口 | 另一台電腦開 `http://伺服器IP/` | 出現標題畫面 |
| 進遊戲 | 按 Enter 進入 | 能移動、能接任務 |
| 多人同步 | 兩台電腦同時進同一關 | 彼此看得到對方移動 |
| 教師後台 | `http://伺服器IP/?admin=1`，輸入 Token | 看得到線上學生 |
| 開機自啟 | `sudo reboot`，**不要登入**，等 1 分鐘再開學生入口 | 直接能玩 |
| 8787 不對外 | 另一台電腦開 `http://伺服器IP:8787/health` | 連不上（這是正確的） |

## 6. 上課日常

- **開機即可**，不用登入伺服器。
- 教師 Token（不要投影）：`sudo grep ADMIN_TOKEN /etc/penglai/penglai.env`
- 下課不必關機；要關機用 `sudo poweroff`，未存的進度會先寫入。
- 看即時紀錄：`sudo journalctl -u penglai -f`

## 7. 更新遊戲

在開發機 push 新版後，**於下課時間**執行（會自動先備份；線上玩家會短暫斷線）：

```bash
sudo bash /opt/penglai-online/deploy/ubuntu/penglai-deploy.sh update
```

## 8. 備份與還原

- 自動：每天 17:30 備份到 `/var/lib/penglai/backups`，保留 30 天；當天若沒開機，下次開機時補做。
- 手動備份：`sudo systemctl start penglai-backup.service`
- 複製到 Windows 保存：

```bash
# 在伺服器上，先複製到自己的家目錄
sudo cp /var/lib/penglai/backups/penglai-要的檔名.sqlite ~/ && sudo chown $USER ~/penglai-*.sqlite
```

```powershell
# 在 Windows 上
scp 你的帳號@伺服器IP:~/penglai-要的檔名.sqlite .
```

還原是**破壞性操作**，會覆蓋目前所有學生進度，務必先停止服務：

```bash
sudo systemctl stop penglai
# 先把舊的 WAL/SHM 移開：留在原地的話，SQLite 會把它們套回還原後的資料庫
sudo mkdir -p /var/lib/penglai/pre-restore
sudo mv /var/lib/penglai/data/penglai.sqlite-wal /var/lib/penglai/data/penglai.sqlite-shm /var/lib/penglai/pre-restore/ 2>/dev/null || true
sudo -u penglai env PENGLAI_DB_PATH=/var/lib/penglai/data/penglai.sqlite \
  node /opt/penglai-online/scripts/restore-sqlite.mjs /var/lib/penglai/backups/penglai-要的檔名.sqlite --confirm
sudo systemctl start penglai
```

## 9.（選用）方案 A：GitHub Pages 讓校外也能開

**課堂使用不需要這一節**，第 4 節做完學生就能在校內玩。只有要讓校外（家裡、別校）用 `https://upsky0210.github.io/penglai-online/` 開啟時才需要。

> ⚠️ 這會讓伺服器可以從網際網路連到。伺服器存有學生資料，請先跟學校確認，
> 並建議設定 `GOOGLE_HOSTED_DOMAIN` 限制只能用學校帳號登入。

需要：一個交給 Cloudflare 管理的網域（Cloudflare 免費方案即可，網域本身要另外購買）。

1. 在伺服器安裝 `cloudflared`，建立 tunnel 指向 `http://localhost:80`，取得 `https://penglai.你的網域`。
   安裝與建立指令請依 Cloudflare 官方文件（Cloudflare Tunnel），本手冊未在本機實測。
2. 確認 `/etc/penglai/penglai.env` 的 `AUTH_CORS_ORIGIN=https://upsky0210.github.io`，
   改過就執行 `sudo systemctl restart penglai`。
3. GitHub repo → Settings → Pages → Source 選 **GitHub Actions**。
4. Settings → Secrets and variables → Actions → **Variables** 新增
   `PENGLAI_SERVER_URL` = `https://penglai.你的網域`（必須是 https）。
5. Actions → **Deploy client to GitHub Pages** → Run workflow（只會手動觸發，平常 push 不會自動發布）。
6. 若要 Google 登入：在 Google Cloud Console 的 OAuth 用戶端把 `https://upsky0210.github.io` 加入已授權的 JavaScript 來源。

## 10. 疑難排解

| 症狀 | 檢查 |
|---|---|
| 學生打不開網頁 | `sudo ufw status` 要有 80；跨 VLAN 時請資訊組開放 80 埠 |
| 網頁開得了但進不了遊戲 | 多半是 WebSocket 被學校 proxy 擋；看 `sudo journalctl -u penglai -n 50` |
| 伺服器拒絕啟動，紀錄有 "Refusing classroom startup" | `ADMIN_TOKEN` 格式不符：至少 20 字元，只能英數與 `_ -` |
| 想看負載數據 | 在伺服器上：`curl http://127.0.0.1:8787/debug/load-stats`（nginx 不對外提供 /debug） |
| 要用 P10 試教的獨立資料庫 | 把 `penglai.env` 的 `PENGLAI_DB_PATH` 改到該梯路徑，`sudo systemctl restart penglai`；`trial:start` 是 Windows 專用，Ubuntu 上改由 systemd 服務啟動 |
