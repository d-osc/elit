$ErrorActionPreference = 'Stop'

Write-Host '[mobile-test] init'
bun run mobile:init

Write-Host '[mobile-test] sync'
bun run mobile:sync

Write-Host '[mobile-test] doctor --json'
$doctorOutput = bun run mobile:doctor
Write-Output $doctorOutput

$assetPath = Join-Path $PWD 'android\app\src\main\assets\public\index.html'
if (-not (Test-Path $assetPath)) {
    throw "[mobile-test] FAILED: synced web asset missing at $assetPath"
}

$manifestPath = Join-Path $PWD 'android\app\src\main\AndroidManifest.xml'
if (-not (Test-Path $manifestPath)) {
    throw "[mobile-test] FAILED: AndroidManifest.xml missing at $manifestPath"
}

Write-Host '[mobile-test] PASS: scaffold + sync completed'
