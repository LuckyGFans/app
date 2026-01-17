$ErrorActionPreference = 'Stop'
$svc='vpn-desktop-helper'
$node='C:\Programy\nodejs\node.exe'
$scriptPath='C:\ProgramData\vpn-desktop\privileged-helper.js'
$bin = "\"$node\" \"$scriptPath\""
Write-Output "Creating service $svc with binPath: $bin"
& sc.exe create $svc "binPath= $bin" "DisplayName=VPN Desktop Helper" "start= auto" "obj=LocalSystem"
Write-Output "Setting description"
& sc.exe description $svc "Privileged helper for VPN Desktop (node script)"
Write-Output "Starting service"
& sc.exe start $svc
Write-Output "Service status:"
& sc.exe queryex $svc

# Output recent System events for context
Write-Output "Recent System events (last 10 minutes) mentioning vpn-desktop-helper:"
Get-WinEvent -FilterHashtable @{LogName='System'; StartTime=(Get-Date).AddMinutes(-10)} | Where-Object { $_.Message -match 'vpn-desktop-helper' -or $_.Message -match 'privileged-helper' } | Select-Object TimeCreated, Id, LevelDisplayName, Message -First 50 | Format-List
