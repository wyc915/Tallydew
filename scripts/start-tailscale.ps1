<#
  拾分 Tallydew — 以「本機伺服器 + tailscale serve」方式執行，讓 iPhone 透過 Tailscale 網址記帳。

  用法（在專案根目錄）：
    powershell -ExecutionPolicy Bypass -File scripts\start-tailscale.ps1
    powershell -ExecutionPolicy Bypass -File scripts\start-tailscale.ps1 -DataDir D:\TallydewData -AllowRegister 0

  - 只監聽 127.0.0.1（不對區網開放），由 `tailscale serve` 提供 HTTPS
  - 啟動前把資料庫備份到 <DataDir>\backups，保留最近 $KeepBackups 份（伺服器未執行時複製，檔案一致）
  - 前端尚未建置時會先執行 npm run build
#>
param(
  [string]$DataDir = 'F:\TallydewData',
  [int]$Port = 3311,
  [ValidateSet('0', '1')][string]$AllowRegister = '1',
  [int]$KeepBackups = 14,
  [switch]$Build
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# refuse to start twice / on a port another project uses
if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
  throw "Port $Port 已被使用（伺服器可能已在執行，或與其他專案衝突）"
}

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

# backup before the server opens the database
$db = Join-Path $DataDir 'ledger.db'
if (Test-Path $db) {
  $bk = Join-Path $DataDir 'backups'
  New-Item -ItemType Directory -Force -Path $bk | Out-Null
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  foreach ($suffix in '', '-wal', '-shm') {
    if (Test-Path "$db$suffix") { Copy-Item "$db$suffix" (Join-Path $bk "ledger-$stamp.db$suffix") }
  }
  Get-ChildItem $bk -Filter 'ledger-*.db' | Sort-Object Name -Descending | Select-Object -Skip $KeepBackups | ForEach-Object {
    Remove-Item "$($_.FullName)*" -Force
  }
}

if ($Build -or -not (Test-Path (Join-Path $root 'apps\web\dist\index.html'))) {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw '前端建置失敗' }
}

$env:API_PORT = "$Port"
$env:HOST = '127.0.0.1'
$env:DATA_DIR = $DataDir
$env:COOKIE_SECURE = '1'          # served over HTTPS by tailscale serve
$env:ALLOW_REGISTER = $AllowRegister

Write-Host "拾分 Tallydew → http://127.0.0.1:$Port（資料：$DataDir）"
npm start
