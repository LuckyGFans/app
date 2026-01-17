$ErrorActionPreference = 'Stop'
try {
    $nssmDir = 'C:\ProgramData\nssm'
    if (-not (Test-Path $nssmDir)) { New-Item -ItemType Directory -Path $nssmDir -Force | Out-Null }
    $nssmExe = Join-Path $nssmDir 'win64\nssm.exe'
    if (-not (Test-Path $nssmExe)) {
        Write-Output "Downloading NSSM to $nssmDir"
        $zip = Join-Path $nssmDir 'nssm.zip'
        Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile $zip -UseBasicParsing
        Expand-Archive -Path $zip -DestinationPath $nssmDir -Force
    }
    Write-Output "Using NSSM: $nssmExe"

    $svcName = 'vpn-desktop-helper'
    $nodeExe = 'C:\Programy\nodejs\node.exe'
    $script = 'C:\ProgramData\vpn-desktop\privileged-helper.js'

    Write-Output " Installing service $svcName ..."
    & $nssmExe install $svcName $nodeExe $script
    Write-Output " Setting AppDirectory ..."
    & $nssmExe set $svcName AppDirectory 'C:\ProgramData\vpn-desktop'
    Write-Output " Setting Start=auto ..."
    & $nssmExe set $svcName Start SERVICE_AUTO_START
    Write-Output " Starting service ..."
    & $nssmExe start $svcName

    Write-Output "Service status:"
    sc.exe queryex $svcName | Out-String | Write-Output
}
catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    Exit 1
}
Exit 0
