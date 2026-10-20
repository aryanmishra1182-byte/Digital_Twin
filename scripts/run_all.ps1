# Launches ML Microservice, Spring Boot Backend, and React Dashboard in separate consoles
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Launching Full Explainable Digital Twin System..." -ForegroundColor Green
Write-Host "1. Python ML Service (Port 8001)" -ForegroundColor Cyan
Write-Host "2. Spring Boot 3 Backend (Port 8080)" -ForegroundColor Cyan
Write-Host "3. React + Vite Dashboard (Port 3000)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-File", "$ScriptDir\run_ml_service.ps1"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-File", "$ScriptDir\run_backend.ps1"
Start-Sleep -Seconds 5
Start-Process powershell -ArgumentList "-NoExit", "-File", "$ScriptDir\run_frontend.ps1"

Write-Host "All processes started in separate windows." -ForegroundColor Green
Write-Host "Access Dashboard at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Access Swagger API at: http://localhost:8080/swagger-ui.html" -ForegroundColor Yellow
