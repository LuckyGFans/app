# VPN Desktop (scaffold)

This repository contains a minimal Electron scaffold for a desktop VPN manager.

What it provides
- Electron app with a Connect / Disconnect toggle and a small settings panel.
- Two modes:
  - `mock` — simulates connect/disconnect locally for UI testing.
  - `cmd` — runs a user-provided command (e.g., `wg-quick up wg0` or an `openvpn` command).

Security note
- The scaffold does not bundle or configure any VPN servers. Running real VPN commands requires administrator privileges and appropriate config files. Only run commands you trust.

Quick start (Windows)
1. Install dependencies:

```powershell
npm install
```

2. Run the app:

```powershell
npm start
```

Usage
- Start in `mock` mode to exercise the UI.
- To use a real VPN command, set `Mode` to `command` and enter the full command in the `Command` field, then click `Save` and `Connect`.

Notes for developers
- Config is stored at the Electron user data path (`vpn-config.json`).
- The `main.js` file exposes IPC handlers: `vpn-get-config`, `vpn-save-config`, `vpn-connect`, `vpn-disconnect`.

Privileged helper (avoid UAC prompts)
- A helper daemon is provided at `privileged-helper.js`. When started as an elevated process (run once as Administrator), the Electron app will prefer calling the local helper over elevating on each connect/disconnect. The helper listens on `127.0.0.1:43123` and requires a token for simple auth.
- To create a token file and start the helper (one-time, run as Administrator):

```powershell
# generate a token (simple example)
"$(New-Guid)" | Out-File -Encoding ascii daemon.token
# run the helper as admin (one-time)
Start-Process -Verb RunAs -FilePath node -ArgumentList 'privileged-helper.js'
```

- To install as a Windows service you can use NSSM or `sc.exe` (requires admin). The helper must be started with admin privileges to manage VPN interfaces without UAC prompts.

- A convenience installer script is provided: `install-helper.ps1`.
  - Run this script from an elevated PowerShell prompt. It will copy `privileged-helper.js` into `C:\ProgramData\vpn-desktop`, generate `daemon.token`, set restrictive permissions, create a Windows service (`vpn-desktop-helper`) that runs `node privileged-helper.js`, and start it.
  - Example (run as Administrator):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd 'C:\path\to\vpn'
.\install-helper.ps1
```

  - The service will run as LocalSystem; the Electron app will call it on connect/disconnect to avoid elevation prompts.

Uninstall & Status
- To uninstall the helper service and remove installed files, run `uninstall-helper.ps1` from an elevated PowerShell prompt. The script prompts what to do with the `daemon.token` and defaults to backing it up to `C:\ProgramData\vpn-desktop-backups` if you don't choose to keep or delete it.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd 'C:\path\to\vpn'
.\uninstall-helper.ps1
```

- To check the service status and confirm the token/install directory, run `service-status.ps1` (no elevation required for basic checks):

```powershell
cd 'C:\path\to\vpn'
.\service-status.ps1
```

Security reminder
- During uninstall the script presents three choices for `daemon.token`:
  - `K` (Keep) — copy the token to the current user's `Documents` folder and preserve it.
  - `B` (Backup) — copy the token to `C:\ProgramData\vpn-desktop-backups` (default) and remove it from the install directory.
  - `D` (Delete) — remove the token without backup.

  The default behavior (press Enter) is `B` (Backup).

Security note
- The helper uses a shared token file (`daemon.token`) in the project root for simple authentication. If you register this helper as a long-running service, move the token to a protected location (e.g., `C:\ProgramData\vpn-desktop\daemon.token`) and ensure file permissions prevent unauthorized access.

**E2E Readiness**

- **What:** The app's E2E control server (used by `e2e-test.js`) now waits briefly for the renderer to reach `dom-ready` before attaching the debugger and evaluating expressions. This prevents race conditions where tests try to query DOM nodes before they exist.
- **How to run:** Start the E2E harness with the environment variable set and run the test script:

```powershell
$env:E2E='1'
node e2e-test.js
```

- **Behavior:** The main process will wait up to ~5 seconds for `dom-ready`; if the renderer is slow the harness will still attempt to attach the debugger but the initial queries are much less likely to return `null`.
