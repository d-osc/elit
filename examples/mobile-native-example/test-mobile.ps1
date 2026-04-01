$ErrorActionPreference = 'Stop'

Write-Host '[mobile-test] init'
bun ../../src/cli.ts mobile init . --app-id com.elit.mobileexample --app-name ElitMobileExample --web-dir web

Write-Host '[mobile-test] sync'
bun ../../src/cli.ts mobile sync --cwd . --web-dir web

Write-Host '[mobile-test] doctor --json'
$doctorOutput = bun ../../src/cli.ts mobile doctor --cwd . --json
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
