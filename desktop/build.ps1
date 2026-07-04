if (Test-Path dist) {
    Remove-Item -Recurse -Force dist
}

# Step 1: Package the electron app
Write-Host "=== Step 1: Packaging Electron app ===" -ForegroundColor Cyan
& .\node_modules\.bin\electron-builder.cmd
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Step 2: Install backend node_modules into the packaged output
$backendDir = "dist\win-unpacked\resources\backend"
Write-Host "=== Step 2: Installing backend dependencies into packaged app ===" -ForegroundColor Cyan
Write-Host "Target: $backendDir"

if (Test-Path $backendDir) {
    Push-Location $backendDir
    & npm.cmd install --production --no-audit --no-fund 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "Backend dependencies installed." -ForegroundColor Green
} else {
    Write-Host "Backend directory not found: $backendDir" -ForegroundColor Red
    exit 1
}

# Step 3: Rebuild NSIS installer from the updated unpacked folder
Write-Host "=== Step 3: Rebuilding NSIS installer ===" -ForegroundColor Cyan
& .\node_modules\.bin\electron-builder.cmd --prepackaged "dist\win-unpacked" --win nsis
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Build complete! ===" -ForegroundColor Green
Write-Host "Installer: dist\Buktiin Setup 1.0.0.exe"
exit 0
