# Runs Spring Boot Digital Twin Backend on port 8080
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
Set-Location $BackendDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Spring Boot Digital Twin Backend on Port 8080..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

& "..\tools\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
