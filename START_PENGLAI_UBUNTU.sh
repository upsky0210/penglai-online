#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export PORT="${PORT:-8787}"
export ADMIN_TOKEN="${ADMIN_TOKEN:-change-this-admin-token}"
export AUTH_CORS_ORIGIN="${AUTH_CORS_ORIGIN:-http://localhost:5174}"
export PENGLAI_DB_PATH="${PENGLAI_DB_PATH:-./server/data/penglai.sqlite}"

echo "蓬萊異聞錄 Online - Ubuntu 啟動"
echo "Project: $(pwd)"
echo "Server:  http://0.0.0.0:${PORT}"
echo "Client:  http://0.0.0.0:5174"
echo "Admin:   http://0.0.0.0:5174/?admin=1"
echo "Admin token: ${ADMIN_TOKEN}"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "[錯誤] 找不到 node，請先安裝 Node.js LTS。"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[錯誤] 找不到 npm。"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[錯誤] 找不到 node_modules，請先執行 npm install。"
  exit 1
fi

echo "啟動後端..."
npm --workspace server run start &
SERVER_PID=$!

echo "啟動前端..."
npm --workspace client run dev -- --host 0.0.0.0 --port 5174 &
CLIENT_PID=$!

cleanup() {
  echo
  echo "關閉服務..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait
