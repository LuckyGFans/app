<#
Service and helper status script.

Shows whether the `vpn-desktop-helper` service exists and its state,
and whether the daemon token and helper file exist.

Run without elevation for status; use Admin if you need to inspect service logs.
#>

$serviceName = 'vpn-desktop-helper'
$installDir = Join-Path $env:ProgramData 'vpn-desktop'

Write-Host "Checking service: $serviceName"
try {
    $svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($svc) {
        Write-Host "Service exists: $($svc.Name) - Status: $($svc.Status) - StartType: check sc.exe for details"
    }
    else {
        Write-Host "Service '$serviceName' not found."
    }
}
catch {
    Write-Host "Unable to query service via Get-Service. Falling back to sc.exe"
    sc.exe query $serviceName
}

Write-Host "`nChecking install directory: $installDir"
if (Test-Path $installDir) {
    Get-ChildItem -Path $installDir | Format-Table Name, Length, LastWriteTime
    $token = Join-Path $installDir 'daemon.token'
    if (Test-Path $token) {
        Write-Host "Token file found: $token"
    }
    else {
        Write-Host "Token file not found: $token"
    }
}
else {
    Write-Host "Install directory not present."
}

Write-Host "`nTo inspect service details or logs, open Event Viewer or run:"
Write-Host "  sc.exe qc $serviceName"
Write-Host "  sc.exe queryex $serviceName"
