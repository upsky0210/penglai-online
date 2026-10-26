#!/usr/bin/env bash
# 蓬萊異聞錄 Online — Ubuntu Server 24.04 一鍵部署／更新／狀態檢查
#
#   sudo bash penglai-deploy.sh install   首次安裝（可重複執行，不會覆蓋既有設定與存檔）
#   sudo bash penglai-deploy.sh update    先備份 → 拉最新版 → 重建 → 重啟
#   sudo bash penglai-deploy.sh status    服務、健康檢查、備份狀態
#
# 架構：nginx(:80) 提供前端靜態檔，並把 /ws 與 API 轉給 127.0.0.1:8787 的遊戲伺服器。
# 學生與老師都只連 80 埠；8787 由防火牆擋住、不對外。詳見 docs/DEPLOY_UBUNTU_SERVER.md。
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/upsky0210/penglai-online.git}"
BRANCH="${BRANCH:-main}"

# 以下路徑寫死在 systemd unit 與 nginx 設定裡，不要單獨修改。
APP_DIR=/opt/penglai-online
APP_USER=penglai
STATE_DIR=/var/lib/penglai
ENV_DIR=/etc/penglai
ENV_FILE=$ENV_DIR/penglai.env
DEPLOY_SRC=$APP_DIR/deploy/ubuntu
NODE_MAJOR=24

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m[錯誤] %s\033[0m\n' "$*" >&2; exit 1; }

require_root() {
  [ "$(id -u)" -eq 0 ] || die "請用 sudo 執行：sudo bash penglai-deploy.sh ${1:-install}"
}

# 先切到 /：服務帳號讀不到執行者的家目錄，繼承過去的 cwd 會讓 git／npm 出錯。
as_app() { (cd / && sudo -u "$APP_USER" -H "$@"); }

# 存檔使用 node:sqlite（DatabaseSync），需要 Node 22.13 以上。
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  node -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 22 || (a === 22 && b >= 13) ? 0 : 1)'
}

install_packages() {
  log "安裝系統套件"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y ca-certificates curl git nginx ufw unattended-upgrades
  if ! node_ok; then
    log "安裝 Node.js ${NODE_MAJOR}（NodeSource 官方套件庫）"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh
    bash /tmp/nodesource_setup.sh
    apt-get install -y nodejs
  fi
  node_ok || die "Node.js 版本不足（需要 22.13 以上），目前：$(node -v 2>/dev/null || echo 未安裝)"
  log "Node $(node -v)／npm $(npm -v)"
}

create_user_and_dirs() {
  log "建立服務帳號與資料目錄"
  if ! id "$APP_USER" >/dev/null 2>&1; then
    useradd --system --home-dir "$STATE_DIR" --create-home --shell /usr/sbin/nologin "$APP_USER"
  fi
  install -d -o "$APP_USER" -g "$APP_USER" -m 750 "$STATE_DIR" "$STATE_DIR/data" "$STATE_DIR/backups"
  install -d -o "$APP_USER" -g "$APP_USER" -m 755 "$APP_DIR"
  install -d -o root -g root -m 755 "$ENV_DIR"
}

fetch_code() {
  if [ -d "$APP_DIR/.git" ]; then
    log "更新程式碼（$BRANCH）"
    as_app git -C "$APP_DIR" fetch --quiet origin "$BRANCH"
    as_app git -C "$APP_DIR" checkout --quiet "$BRANCH"
    as_app git -C "$APP_DIR" pull --ff-only --quiet origin "$BRANCH"
  else
    [ -z "$(ls -A "$APP_DIR")" ] || die "$APP_DIR 不是空的也不是 git 專案，請先確認內容"
    log "下載程式碼 $REPO_URL"
    as_app git clone --quiet --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
  log "目前版本：$(as_app git -C "$APP_DIR" log -1 --format='%h %ad %s' --date=short)"
}

write_env_file() {
  if [ -f "$ENV_FILE" ]; then
    log "保留既有設定 $ENV_FILE"
    return
  fi
  log "產生設定檔 $ENV_FILE（含隨機教師 Token）"
  # 伺服器只接受 20 字元以上、英數與 _ - 組成的 Token；hex 符合且不用額外套件。
  local token
  token="$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
  install -m 600 -o root -g root /dev/null "$ENV_FILE"
  cat > "$ENV_FILE" <<EOF
# 蓬萊異聞錄 Online 伺服器設定
# 修改後執行：sudo systemctl restart penglai
# 修改 GOOGLE_CLIENT_ID 後還要重建前端：sudo bash $DEPLOY_SRC/penglai-deploy.sh update

PORT=8787
PENGLAI_DB_PATH=$STATE_DIR/data/penglai.sqlite
PENGLAI_BACKUP_DIR=$STATE_DIR/backups

# 啟動時強制檢查教師 Token（20 字元以上，只能英數與 _ -）
PENGLAI_REQUIRE_ADMIN_TOKEN=1
ADMIN_TOKEN=$token

# 只在搭配 GitHub Pages（方案 A）時有作用；學生直接連本機 nginx 時不受影響
AUTH_CORS_ORIGIN=https://upsky0210.github.io

# Google 登入（選用）。GOOGLE_HOSTED_DOMAIN 可限制只能用學校網域帳號
GOOGLE_CLIENT_ID=
GOOGLE_HOSTED_DOMAIN=

# 測試用，正式環境保持空白
AUTH_ALLOW_MOCK=
EOF
}

build_app() {
  log "安裝相依套件（npm ci，首次約 1–3 分鐘）"
  as_app bash -c "cd '$APP_DIR' && npm ci --no-audit --no-fund"
  log "建置前端"
  local google_client_id
  google_client_id="$(grep -E '^GOOGLE_CLIENT_ID=' "$ENV_FILE" | cut -d= -f2- || true)"
  as_app env VITE_GOOGLE_CLIENT_ID="$google_client_id" bash -c "cd '$APP_DIR' && npm --workspace client run build"
}

install_units() {
  log "安裝 systemd 服務與每日備份排程"
  install -m 644 "$DEPLOY_SRC/penglai.service" /etc/systemd/system/penglai.service
  install -m 644 "$DEPLOY_SRC/penglai-backup.service" /etc/systemd/system/penglai-backup.service
  install -m 644 "$DEPLOY_SRC/penglai-backup.timer" /etc/systemd/system/penglai-backup.timer
  systemctl daemon-reload
  systemctl enable --quiet penglai.service penglai-backup.timer
  systemctl start penglai-backup.timer
}

configure_nginx() {
  log "設定 nginx"
  install -m 644 "$DEPLOY_SRC/nginx-penglai.conf" /etc/nginx/sites-available/penglai
  ln -sf /etc/nginx/sites-available/penglai /etc/nginx/sites-enabled/penglai
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable --quiet nginx
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
}

configure_firewall() {
  log "設定防火牆（只開 22 與 80；8787 不對外）"
  ufw allow 22/tcp >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  ufw --force enable >/dev/null
}

configure_updates() {
  log "設定自動安全更新（不自動重開機）"
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
  cat > /etc/apt/apt.conf.d/52penglai-unattended <<'EOF'
// 蓬萊：只自動安裝安全更新，絕不自動重開機（避免上課途中重開）
Unattended-Upgrade::Automatic-Reboot "false";
EOF
}

wait_healthy() {
  local i
  for i in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 \
      && curl -fsS http://127.0.0.1/health >/dev/null 2>&1; then
      log "健康檢查通過（遊戲伺服器與 nginx 都正常）"
      return 0
    fi
    sleep 1
  done
  journalctl -u penglai -n 40 --no-pager || true
  die "遊戲伺服器 30 秒內沒有回應，上面是最後 40 行紀錄"
}

print_summary() {
  local ip
  ip="$(hostname -I | awk '{print $1}')"
  cat <<EOF

================ 部署完成 ================
學生入口：http://$ip/
教師後台：http://$ip/?admin=1
查看教師 Token（不要投影）：sudo grep ADMIN_TOKEN $ENV_FILE

資料庫：$STATE_DIR/data/penglai.sqlite
備份：  $STATE_DIR/backups（每天 17:30 自動備份，保留 30 天）
狀態：  sudo bash $DEPLOY_SRC/penglai-deploy.sh status
更新：  sudo bash $DEPLOY_SRC/penglai-deploy.sh update（請在下課時間執行）
==========================================
EOF
}

cmd_install() {
  require_root install
  install_packages
  create_user_and_dirs
  fetch_code
  write_env_file
  build_app
  install_units
  configure_nginx
  configure_firewall
  configure_updates
  log "啟動遊戲伺服器"
  systemctl restart penglai
  wait_healthy
  log "建立第一份備份，確認備份機制正常"
  systemctl start penglai-backup.service
  print_summary
}

cmd_update() {
  require_root update
  [ -d "$APP_DIR/.git" ] || die "尚未安裝，請先執行：sudo bash penglai-deploy.sh install"
  log "更新前先備份"
  systemctl start penglai-backup.service
  fetch_code
  build_app
  install_units
  configure_nginx
  log "重新啟動遊戲伺服器（線上玩家會短暫斷線，存檔會先寫入）"
  systemctl restart penglai
  wait_healthy
  print_summary
}

cmd_status() {
  systemctl --no-pager --lines=0 status penglai nginx || true
  echo
  if curl -fsS http://127.0.0.1/health; then echo; else echo "[警告] 健康檢查失敗"; fi
  echo
  systemctl list-timers penglai-backup.timer --no-pager || true
  echo
  echo "最近的備份："
  ls -lt "$STATE_DIR/backups" 2>/dev/null | head -6 || true
  echo
  df -h "$STATE_DIR"
}

case "${1:-}" in
  install) cmd_install ;;
  update) cmd_update ;;
  status) cmd_status ;;
  *)
    echo "用法：sudo bash penglai-deploy.sh {install|update|status}"
    exit 2
    ;;
esac
