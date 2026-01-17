# Quick Start Guide

## Local Development Setup

This guide will help you get started with the VPN Desktop application on your local machine.

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/LuckyGFans/app.git
   cd app
   ```

2. **Launch the application**

   **Easy method (recommended):**
   
   On Windows:
   ```powershell
   .\launch.bat
   ```
   
   On Linux/Mac:
   ```bash
   ./launch.sh
   ```
   
   The launcher script will automatically install dependencies if needed.

   **Manual method:**
   ```bash
   npm install
   npm start
   ```

### First Run

On first run, the application will start in **mock mode** which simulates VPN connections without requiring any real VPN configuration. This is perfect for testing the UI.

### Testing Features

1. Click the **Connect** button to simulate connecting to a VPN
2. Click **Disconnect** to simulate disconnecting
3. Open the **Settings** panel to configure different modes:
   - `mock` - Simulates VPN connections (no real network changes)
   - `command` - Runs actual VPN commands (requires proper configuration)

### Development Scripts

- `npm start` - Start the application
- `npm run dev` - Start in development mode (same as start)
- `npm run e2e` - Run end-to-end tests

### Configuration

- Config file location: Electron userData directory (`vpn-config.json`)
- Default server configurations: `default-servers.json`

### Privileged Helper (Optional)

For Windows users who want to avoid UAC prompts on every connect/disconnect:

1. Run PowerShell as Administrator
2. Navigate to the project directory
3. Run: `.\install-helper.ps1`

This installs a Windows service that handles VPN operations with elevated privileges.

### Troubleshooting

**Issue:** Dependencies not installing
- Make sure you have Node.js 14+ installed
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

**Issue:** Application won't start
- Check that port 43123 is not in use
- Look for error logs in the console output

**Issue:** Can't connect to real VPN
- Make sure you have the appropriate VPN config files
- Verify you have the necessary permissions (admin/root)
- Check that your VPN client software is properly installed

### More Information

See the main [README.md](README.md) for detailed documentation.
