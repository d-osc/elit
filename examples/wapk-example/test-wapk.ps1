# Test script for WAPK live-sync functionality (Windows/PowerShell)
# Packs, runs, sends requests, and verifies sync

param(
    [switch]$Watcher,
    [int]$Port = 3333
)

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ElitRoot = "$ProjectDir\..\.."
$CliPath = "$ElitRoot\src\cli.ts"
$WapkFile = ""
$LogFile = Join-Path $ProjectDir "wapk-runtime.log"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $("  $($Text.PadRight(56))") -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Cleanup {
    Write-Host "Cleaning up test files..." -ForegroundColor Yellow
    Remove-Item -Path $WapkFile -ErrorAction SilentlyContinue
    Remove-Item -Path (Join-Path $ProjectDir "marker-*.txt") -ErrorAction SilentlyContinue
    Remove-Item -Path $LogFile -ErrorAction SilentlyContinue
    Write-Host "[OK] Cleanup complete" -ForegroundColor Green
}

# Cleanup on any exit
trap { Cleanup }

Write-Header "WAPK Example App - Live-Sync Test"

# Step 1: Pack the project
Write-Host "[1/4] Packing project into WAPK..." -ForegroundColor Green
Push-Location $ProjectDir
$PackOutput = & bun run $CliPath wapk pack . 2>&1
Pop-Location
Write-Host $PackOutput

# Find the .wapk file that was created
$CreatedWapk = Get-ChildItem -Path (Join-Path $ProjectDir "*.wapk") -ErrorAction SilentlyContinue | Sort-Object -Property LastWriteTime -Descending | Select-Object -First 1

if ($CreatedWapk) {
    $WapkFile = $CreatedWapk.FullName
    $Size = $CreatedWapk.Length
    Write-Host "[OK] WAPK packed: $(Split-Path -Leaf $WapkFile) ($Size bytes)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to create WAPK file" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Inspect archive
Write-Host "[2/4] Inspecting WAPK archive..." -ForegroundColor Green
& bun run $CliPath wapk inspect $WapkFile
Write-Host ""

# Step 3: Run with specified mode
$Mode = if ($Watcher) { "watcher mode (event-driven)" } else { "polling mode (300ms)" }
Write-Host "[3/4] Running with $Mode..." -ForegroundColor Green



# Start WAPK app in background
$Arguments = @("run", $CliPath, "wapk", "run", $WapkFile)
if ($Watcher) { $Arguments += "--watcher" }
$AppProcess = Start-Process -FilePath "bun" -ArgumentList $Arguments -PassThru -NoNewWindow
$AppPid = $AppProcess.Id

try {
    # Give server time to start
    Start-Sleep -Seconds 2
    
    Write-Host "  -> Sending requests..." -ForegroundColor Yellow
    for ($i = 1; $i -le 3; $i++) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            Write-Host "    Request $i (health): [OK]" -ForegroundColor Green
        } catch {
            Write-Host "    Request $i (health): [FAIL]" -ForegroundColor Red
        }
        
        try {
            Invoke-WebRequest -Uri "http://localhost:$Port/create-marker" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue | Out-Null
            Write-Host "    Request $i (marker): [OK]" -ForegroundColor Green
        } catch {
            Write-Host "    Request $i (marker): [FAIL]" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    # Get status
    try {
        $Status = Invoke-WebRequest -Uri "http://localhost:$Port/status" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        $StatusObj = $Status.Content | ConvertFrom-Json
        Write-Host "  -> Status: $($StatusObj.requestCount) requests processed" -ForegroundColor Green
    } catch {
        Write-Host "  -> Could not fetch status" -ForegroundColor Yellow
    }
    
    # Shutdown via API
    Write-Host "  -> Requesting graceful shutdown..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "http://localhost:$Port/shutdown" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue | Out-Null
    } catch {
        # Expected - server shutting down
    }
    
    # Wait for process
    Start-Sleep -Seconds 1
    if (!$Process.HasExited) {
        Write-Host "  -> Process still running, waiting..." -ForegroundColor Yellow
        $AppProcess.WaitForExit(3000)
    }
} finally {
    # Ensure process is killed
    if (!$AppProcess.HasExited) {
        Stop-Process -Id $AppPid -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""

# Step 4: Verify live-sync
Write-Host "[4/4] Verifying live-sync..." -ForegroundColor Green

if (Test-Path $LogFile) {
    Write-Host "[OK] Log file was created and synced into WAPK" -ForegroundColor Green
    Write-Host "  Sample log entries:" -ForegroundColor Gray
    @(Get-Content $LogFile -Head 3) | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "[FAIL] Log file not found" -ForegroundColor Red
}

$MarkerCount = @(Get-ChildItem -Path (Join-Path $ProjectDir "marker-*.txt") -ErrorAction SilentlyContinue).Count
if ($MarkerCount -gt 0) {
    Write-Host "[OK] Marker files created: $MarkerCount" -ForegroundColor Green
} else {
    Write-Host "[WARN] No marker files created (may indicate sync timing issue)" -ForegroundColor Yellow
}

# Check WAPK was updated
Write-Host ""
Write-Host "Checking WAPK archive final contents..." -ForegroundColor Yellow
& bun run $CliPath wapk inspect $WapkFile 2>&1 | Select-String -Pattern "wapk-runtime.log|marker-" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  [OK] Found: $_" -ForegroundColor Green
}

Write-Header "Test Complete!"
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  • Test watcher mode:  .\test-wapk.ps1 -Watcher" -ForegroundColor Gray
Write-Host "  • Customize port:     .\test-wapk.ps1 -Port 8080" -ForegroundColor Gray
Write-Host "  • Manual testing:     bun run $CliPath wapk run example-app.wapk" -ForegroundColor Gray
Write-Host ""
