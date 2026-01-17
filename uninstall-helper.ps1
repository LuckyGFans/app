<#
Uninstall script for VPN Desktop privileged helper.

What it does:
- Ensures script is running elevated (relaunches as admin if needed).
- Stops and deletes the `vpn-desktop-helper` service if present.
- Removes installed files under `C:\ProgramData\vpn-desktop`.

Run as Administrator.
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
$serviceName = 'vpn-desktop-helper'

Write-Host "Stopping and removing service (if exists): $serviceName"
try {
    sc.exe stop $serviceName | Out-Null
} catch {}
try {
    sc.exe delete $serviceName | Out-Null
} catch {}

if (Test-Path $installDir) {
    Write-Host "Removing installation directory: $installDir"
    # Handle daemon.token: ask whether to keep, backup, or delete it
    $tokenPath = Join-Path $installDir 'daemon.token'
    if (Test-Path $tokenPath) {
        Write-Host "daemon.token found at: $tokenPath"
        Write-Host "Choose what to do with the token:"
        Write-Host "  K) Keep (copy to your Documents and preserve)"
        Write-Host "  B) Backup (copy to ProgramData\vpn-desktop-backups, then remove from install dir)"
        Write-Host "  D) Delete (remove without backup)"
        $choice = Read-Host "Enter K, B, or D (default B)"
        if ([string]::IsNullOrWhiteSpace($choice)) { $choice = 'B' }
        $choice = $choice.Substring(0,1).ToUpper()
        $time = Get-Date -Format 'yyyyMMdd_HHmmss'
        switch ($choice) {
            'K' {
                try {
                    $userDocs = Join-Path $env:USERPROFILE 'Documents'
                    $userBackup = Join-Path $userDocs ("daemon.token.keep_$time")
                    Copy-Item -Path $tokenPath -Destination $userBackup -Force
                    Write-Host "Token copied to $userBackup and will be preserved."
                } catch {
                    Write-Warning "Failed to copy token to Documents: $_"
                }
            }
            'B' {
                try {
                    $backupDir = Join-Path $env:ProgramData 'vpn-desktop-backups'
                    New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
                    $backupPath = Join-Path $backupDir ("daemon.token.bak_$time")
                    Copy-Item -Path $tokenPath -Destination $backupPath -Force
                    Write-Host "Backed up daemon.token to $backupPath (will be removed from install dir)."
                } catch {
                    Write-Warning "Failed to back up daemon.token: $_"
                }
            }
            'D' {
                try {
                    Remove-Item -Path $tokenPath -Force -ErrorAction SilentlyContinue
                    Write-Host "daemon.token deleted from install directory."
                } catch {
                    Write-Warning "Failed to delete daemon.token: $_"
                }
            }
            Default {
                Write-Host "Unknown choice '$choice', defaulting to Backup."
                try {
                    $backupDir = Join-Path $env:ProgramData 'vpn-desktop-backups'
                    New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
                    $backupPath = Join-Path $backupDir ("daemon.token.bak_$time")
                    Copy-Item -Path $tokenPath -Destination $backupPath -Force
                    Write-Host "Backed up daemon.token to $backupPath (will be removed from install dir)."
                } catch {
                    Write-Warning "Failed to back up daemon.token: $_"
                }
            }
        }
    }
    # Try to reset permissions so removal succeeds
    try {
        icacls $installDir /grant:r "Administrators:F" "SYSTEM:F" /T | Out-Null
    } catch {}
    Remove-Item -Path $installDir -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $installDir)) {
        Write-Host "Removed $installDir"
    } else {
        Write-Warning "Failed to remove $installDir. Check permissions and try manually."
    }
} else {
    Write-Host "Install directory not found: $installDir"
}

Write-Host "Uninstall complete."
