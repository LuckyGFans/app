#!/bin/bash
# VPN Desktop Local Launcher
# This script installs dependencies if needed and launches the Electron app

set -e

echo "VPN Desktop Local Launcher"
echo "=========================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Launch the app
echo "Launching VPN Desktop..."
npm start
