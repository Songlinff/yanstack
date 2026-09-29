# 研栈 · 一键对外发布（本机 Next.js 站点 + Cloudflare 免费隧道）
# 双击同目录下的「一键启动.bat」即可运行，不需要单独执行本文件。

$ErrorActionPreference = "Continue"
$deploy = $PSScriptRoot
$root   = Split-Path -Parent $deploy
Set-Location $root

function Step($msg) { Write-Host "[研栈] $msg" -ForegroundColor Cyan }

# ---------- 1. 定位 cloudflared ----------
$cf = $null
$candidates = @(
  (Join-Path $deploy "cloudflared.exe"),
  (Join-Path $root "tools\cloudflared.exe"),
  "C:\Program Files\Cloudflare\cloudflared.exe",
  "$env:LOCALAPPDATA\Microsoft\WinGet\Links\cloudflared.exe"
)
foreach ($p in $candidates) { if (Test-Path $p) { $cf = $p; break } }
if (-not $cf) {
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd) { $cf = $cmd.Source }
}
if (-not $cf) {
  Write-Host "[研栈] 没找到 cloudflared.exe，请把 cloudflared.exe 放到 deploy 目录后重试。" -ForegroundColor Red
  Read-Host "按回车退出"
  exit 1
}
Step "隧道程序：$cf"

$logs = Join-Path $deploy "logs"
if (-not (Test-Path $logs)) { New-Item -ItemType Directory -Path $logs | Out-Null }

# ---------- 2. 必要时构建生产版本 ----------
if (-not (Test-Path (Join-Path $root ".next\BUILD_ID"))) {
  Step "首次运行，正在生产构建（大概几分钟）..."
  & npm run build *>&1 | Tee-Object -FilePath (Join-Path $logs "build.log")
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[研栈] 构建失败，请看上面的报错，或把 deploy\logs\build.log 发出来。" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
  }
}

# ---------- 3. 启动站点（独立窗口，端口 3000） ----------
$existing = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $existing) {
  Step "正在启动研栈站点 ..."
  $siteLog = Join-Path $logs "site.log"
Start-Process cmd.exe -ArgumentList "/c `"cd /d $root && npm run start > `"`"$siteLog`"`" 2>&1`"" -WindowStyle Minimized
} else {
  Step "端口 3000 已经在跑，复用现有站点。"
}

Write-Host "[研栈] 等待站点就绪" -NoNewline
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 2
  Write-Host "." -NoNewline
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/" -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
}
Write-Host ""
if (-not $ready) {
  Write-Host "[研栈] 本地站点没起来，检查 deploy\logs\site.log。" -ForegroundColor Red
  Read-Host "按回车退出"
  exit 1
}
Step "本地站点已就绪：http://127.0.0.1:3000"

# ---------- 4. 启动隧道 ----------
$logFile = Join-Path $logs "cloudflared.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }

Step "正在向 Cloudflare 申请外网地址 ..."
Start-Process -FilePath $cf -ArgumentList "tunnel --no-autoupdate --logfile `"$logFile`" --url http://127.0.0.1:3000" -WindowStyle Minimized

$url = $null
for ($i = 0; $i -lt 45; $i++) {
  Start-Sleep -Seconds 2
  if (Test-Path $logFile) {
    $m = Select-String -Path $logFile -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -ErrorAction SilentlyContinue
    if ($m) { $url = $m.Matches[0].Value; break }
  }
}

$tunnelFile = Join-Path $root ".tunnel-url"
if ($url) {
  Set-Content -Path $tunnelFile -Value $url -Encoding UTF8
  Write-Host ""
  Write-Host "==========================================================" -ForegroundColor Green
  Write-Host "  研栈已对外开放，把下面这个网址发给别人即可访问：" -ForegroundColor Green
  Write-Host "  $url" -ForegroundColor Yellow
  Write-Host "  后台： $url/admin" -ForegroundColor Yellow
  Write-Host "  支付回调： $url/api/pay/notify" -ForegroundColor Yellow
  Write-Host "==========================================================" -ForegroundColor Green
  Write-Host "  注意：免费隧道地址每次重启都会换，重启后请重新发新地址。" -ForegroundColor DarkGray
  Write-Host "  保持这个窗口所在的电脑开机联网，站点才在线。" -ForegroundColor DarkGray
} else {
  Write-Host "[研栈] 没拿到外网地址，请查看 deploy\logs\cloudflared.log" -ForegroundColor Red
}

Write-Host ""
Write-Host "[研栈] 最小化运行的两个窗口别关（站点 + 隧道）。窗口可以直接最小化。" -ForegroundColor DarkGray
Read-Host "按回车退出本窗口（站点和隧道会继续在后台运行）"
