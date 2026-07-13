param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[a-z0-9][a-z0-9-]{2,39}$")]
  [string]$SessionId,

  [ValidateRange(5, 10)]
  [int]$Students = 8,

  [ValidateSet("simulated", "real")]
  [string]$Mode = "simulated"
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$databasePath = Join-Path $projectRoot "tmp\p10-a\$SessionId\data\penglai.sqlite"
$backupPath = Join-Path $projectRoot "tmp\p10-a\$SessionId\backups"

Push-Location $projectRoot
try {
  & node "scripts/p10-a-trial-data.mjs" prepare $SessionId --students $Students --mode $Mode
  if ($LASTEXITCODE -ne 0) { throw "P10-A session preparation failed." }

  & node "scripts/p10-a-trial-data.mjs" preflight $SessionId
  if ($LASTEXITCODE -ne 0) { throw "P10-A preflight failed." }

  $adminToken = & "$PSScriptRoot/read-admin-token.ps1"
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($adminToken)) {
    throw "ADMIN_TOKEN input failed."
  }

  $env:ADMIN_TOKEN = $adminToken
  $env:PENGLAI_REQUIRE_ADMIN_TOKEN = "1"
  $env:PENGLAI_DB_PATH = $databasePath
  $env:PENGLAI_BACKUP_DIR = $backupPath
  $env:PORT = "8787"
  $env:AUTH_CORS_ORIGIN = "http://localhost:5174"
  if ($Mode -eq "simulated") {
    $env:AUTH_ALLOW_MOCK = "1"
    $env:VITE_AUTH_ALLOW_MOCK = "1"
  } else {
    Remove-Item Env:AUTH_ALLOW_MOCK -ErrorAction SilentlyContinue
    Remove-Item Env:VITE_AUTH_ALLOW_MOCK -ErrorAction SilentlyContinue
  }

  & node "scripts/validate-admin-token.mjs"
  if ($LASTEXITCODE -ne 0) { throw "ADMIN_TOKEN validation failed." }

  Write-Host ""
  Write-Host "P10-A session: $SessionId ($Mode, $Students students)"
  Write-Host "Student: http://localhost:5174"
  Write-Host "Teacher: http://localhost:5174/?admin=1"
  Write-Host "Database: $databasePath"
  Write-Host "Press Ctrl+C once to stop both services."
  Write-Host ""

  & node "scripts/p10-a-run.mjs"
} finally {
  Remove-Item Env:ADMIN_TOKEN -ErrorAction SilentlyContinue
  $adminToken = $null
  Pop-Location
}
