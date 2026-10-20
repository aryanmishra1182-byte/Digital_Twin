# Runs React + Vite Dashboard on port 3000
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $RootDir "frontend"
Set-Location $FrontendDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting React + Vite Industrial Dashboard on Port 3000..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

npm run dev
