<#
Install script for VPN Desktop privileged helper.

What it does:
- Ensures script is running elevated (relaunches as admin if needed).
- Copies `privileged-helper.js` to `C:\ProgramData\vpn-desktop`.
- Generates `daemon.token` (GUID) in that folder.
- Sets directory/file permissions to Administrators and SYSTEM only.
- Creates a Windows service `vpn-desktop-helper` that runs `node privileged-helper.js`.
- Starts the service.

Run as Administrator. Requires Node.js available in PATH.
#>

function Ensure-Elevated {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Host "Relaunching with elevation..."
        Start-Process -FilePath powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    }
}

Ensure-Elevated

$installDir = Join-Path $env:ProgramData 'vpn-desktop'
Write-Host "Installing to: $installDir"
New-Item -Path $installDir -ItemType Directory -Force | Out-Null

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$helperSrc = Join-Path $scriptDir 'privileged-helper.js'
if (-not (Test-Path $helperSrc)) {
    Write-Error "privileged-helper.js not found in script directory: $helperSrc"
    Exit 1
}

Copy-Item -Path $helperSrc -Destination $installDir -Force

$tokenPath = Join-Path $installDir 'daemon.token'
if (-not (Test-Path $tokenPath)) {
    $token = [guid]::NewGuid().ToString()
    $token | Out-File -FilePath $tokenPath -Encoding ascii
    Write-Host "Generated token at $tokenPath"
} else {
    Write-Host "Token already exists at $tokenPath"
}

Write-Host "Setting file permissions (Administrators & SYSTEM only)..."
# Remove inheritance and set Administrators and SYSTEM full control
icacls $installDir /inheritance:r | Out-Null
icacls $installDir /grant:r "Administrators:F" "SYSTEM:F" /T | Out-Null

# Find node
$nodeCmd = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $nodeCmd) {
    Write-Error "Node.js not found in PATH. Please install Node.js and re-run this script."
    Exit 1
}
$node = $nodeCmd.Source
Write-Host "Node found at: $node"

$serviceName = 'vpn-desktop-helper'

function Service-Exists($name) {
    $s = sc.exe query $name 2>$null
    return ($LASTEXITCODE -eq 0)
}

if (Service-Exists $serviceName) {
    Write-Host "Service $serviceName already exists. Stopping and removing..."
    sc.exe stop $serviceName | Out-Null
    sc.exe delete $serviceName | Out-Null
}

$binPath = "`"$node`" `"$installDir\privileged-helper.js`""
Write-Host "Creating service $serviceName -> $binPath"
sc.exe create $serviceName binPath= $binPath start= auto DisplayName= "VPN Desktop Helper" | Out-Null

Write-Host "Starting service $serviceName..."
sc.exe start $serviceName

Write-Host "Installation complete. Token file: $tokenPath"
Write-Host "If the service fails to start, check the Event Viewer or run the helper manually with:"
Write-Host "  & $node `"$installDir\privileged-helper.js`""
