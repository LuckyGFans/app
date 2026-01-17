$ErrorActionPreference = 'Stop'
$nssm = 'C:\ProgramData\nssm\nssm-2.24\win64\nssm.exe'
$svc = 'vpn-desktop-helper'
$node = 'C:\Programy\nodejs\node.exe'
$script = 'C:\ProgramData\vpn-desktop\privileged-helper.js'
$out = 'C:\ProgramData\vpn-desktop\nssm_stdout.log'
$err = 'C:\ProgramData\vpn-desktop\nssm_stderr.log'

Write-Output "Stopping and removing existing service (if any)"
try { sc.exe stop $svc } catch {}
Start-Sleep -Seconds 1
try { sc.exe delete $svc } catch {}
Start-Sleep -Seconds 1






















Get-ChildItem 'C:\ProgramData\vpn-desktop' -Force | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSizeWrite-Output "Directory listing of C:\ProgramData\vpn-desktop"if (Test-Path $err) { Copy-Item $err 'C:\appm\everything4\vpn\nssm_stderr.log' -Force }if (Test-Path $out) { Copy-Item $out 'C:\appm\everything4\vpn\nssm_stdout.log' -Force }Write-Output "Copying logs to workspace (if present)"sc.exe queryex $svcWrite-Output "Service status:"Start-Sleep -Seconds 4& $nssm start $svcWrite-Output "Starting service"& $nssm set $svc AppRotateOnline 1& $nssm set $svc AppRotateBytes 10485760& $nssm set $svc AppStderr $err& $nssm set $svc AppStdout $out& $nssm set $svc AppDirectory 'C:\ProgramData\vpn-desktop'& $nssm install $svc $node $scriptnWrite-Output "Installing service via NSSM: $nssm"