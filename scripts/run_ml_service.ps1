# Runs Python ML Microservice on port 8001
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Python ML Inference Microservice on Port 8001..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

python -m uvicorn ml.service:app --host 0.0.0.0 --port 8001 --reload
