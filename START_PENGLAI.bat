@echo off
chcp 65001 >nul
setlocal

title Penglai Online 一鍵啟動
cd /d "%~dp0"

set "ADMIN_TOKEN="
set "FRONTEND_URL=http://localhost:5174"
set "BACKEND_URL=http://localhost:8787"
set "AUTH_CORS_ORIGIN=%FRONTEND_URL%"

echo.
echo ==========================================
echo   蓬萊異聞錄 Online - 一鍵啟動
echo ==========================================
echo.
echo 專案資料夾：%CD%
echo 前端網址：%FRONTEND_URL%
echo 後端網址：%BACKEND_URL%
echo 管理面板：%FRONTEND_URL%/?admin=1
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [錯誤] 這台電腦尚未安裝 Node.js。
  echo 請先安裝 Node.js LTS：https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [錯誤] 找不到 npm.cmd。請確認 Node.js 已正確安裝。
  echo.
  pause
  exit /b 1
)

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo [錯誤] 找不到 Windows PowerShell，無法安全讀取教師管理 Token。
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [錯誤] 找不到 package.json，請把這個 bat 放在 penglai-online 專案根目錄。
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [首次啟動] 找不到 node_modules，正在安裝套件...
  echo 這一步需要網路，可能需要幾分鐘。
  echo.
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo [錯誤] npm install 失敗。請確認網路、Node.js 版本與資料夾權限。
    echo.
    pause
    exit /b 1
  )
) else (
  echo [OK] 已找到 node_modules，略過套件安裝。
)

echo.
echo [安全設定] 請輸入教師管理 Token。
echo Token 至少 20 字元，僅限英文字母、數字、底線或連字號；不可使用 smoke-admin。
for /f "usebackq delims=" %%T in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\read-admin-token.ps1"`) do set "ADMIN_TOKEN=%%T"
node scripts\validate-admin-token.mjs
if errorlevel 1 (
  echo.
  echo [錯誤] 未啟動。請設定符合規則的 ADMIN_TOKEN。
  echo.
  pause
  exit /b 1
)
set "PENGLAI_REQUIRE_ADMIN_TOKEN=1"

echo.
echo 正在啟動後端伺服器...
start "Penglai Online - Server" /D "%CD%" cmd /k "npm.cmd --workspace server run start"

timeout /t 3 /nobreak >nul

echo 正在啟動前端網頁...
start "Penglai Online - Client" /D "%CD%" cmd /k "npm.cmd --workspace client run dev -- --host 0.0.0.0 --port 5174"

timeout /t 5 /nobreak >nul

echo.
echo 正在開啟瀏覽器...
start "" "%FRONTEND_URL%"

echo.
echo ==========================================
echo 啟動完成
echo ==========================================
echo.
echo 遊戲網址：%FRONTEND_URL%
echo 管理面板：%FRONTEND_URL%/?admin=1
echo 管理 Token 已設定。請在管理面板手動輸入。
echo.
echo 若要關閉遊戲，請關閉另外開啟的 Server 與 Client 兩個命令視窗。
echo.
pause
