@echo off
REM VPN Desktop Local Launcher
REM This script installs dependencies if needed and launches the Electron app

echo VPN Desktop Local Launcher
echo ==========================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Launch the app
echo Launching VPN Desktop...
call npm start
