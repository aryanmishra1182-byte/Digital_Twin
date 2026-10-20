$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
$mvnCmd = Join-Path $ScriptDir "tools\apache-maven-3.9.9\bin\mvn.cmd"
if (!(Test-Path $mvnCmd)) {
    $mvnCmd = Join-Path (Split-Path -Parent $ScriptDir) "tools\apache-maven-3.9.9\bin\mvn.cmd"
}
& $mvnCmd $args
