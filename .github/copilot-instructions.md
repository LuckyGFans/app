# Copilot Instructions — VPN Desktop (concise)

This file captures repository-specific knowledge an AI coding agent should know to be productive quickly.

**Big picture**
- What: Minimal Electron-based VPN desktop with a renderer UI, a main process, and an optional privileged helper daemon.
- Why: Helper-first design avoids repeated UAC elevation; when the helper is unavailable the app falls back to per-action elevation via `sudo-prompt`.
- Key runtime pieces: privileged helper (HTTP daemon) listens on `127.0.0.1:43123` (token header `x-vpn-token`), E2E control server on `127.0.0.1:43124` (when `E2E=1`).

**Major components & boundaries**
- UI / renderer: `index.html` + `renderer.js` — uses APIs exposed in `preload.js` (`window.electronAPI`).
- Main process: `main.js` — IPC handlers: `vpn-get-config`, `vpn-save-config`, `vpn-connect`, `vpn-disconnect`; implements E2E endpoints.
- Privileged helper: `privileged-helper.js` — local daemon that runs connect/disconnect commands after validating `daemon.token`.
- Config & logs: `vpn-config.json` stored in Electron `userData`; logs under `vpn-logs` (userData or helper-side directory).

**Concrete workflows**
- Install dependencies: `npm install` (project root).
- Run dev: `npm start` or `npm run dev` (both run `electron .`).
- E2E: `npm run e2e` (runs `node e2e-test.js`). To start app interactively in E2E mode (PowerShell): `$env:E2E='1'; npm start`.
- Run helper locally for testing: `node privileged-helper.js` (create a `daemon.token` next to the script with the expected secret).
- Windows helper install/uninstall: use `install-helper.ps1` / `uninstall-helper.ps1`; service helpers and NSSM scripts live under `scripts/`.

**Default servers (click-to-use)**
- Default server list: include a small set of pre-configured, global VPN endpoints exposed in the UI for quick selection.
- Example entries (suggested names + example config paths):
	- United States — `us-west` : `C:\vpn-configs\us-west.conf` (or `/home/user/vpn-configs/us-west.conf`)
	- United Kingdom — `uk-london` : `C:\vpn-configs\uk-london.conf`
	- Germany — `de-frankfurt` : `C:\vpn-configs\de-frankfurt.conf`
	- Singapore — `sg-singapore` : `C:\vpn-configs\sg-singapore.conf`
	- Australia — `au-sydney` : `C:\vpn-configs\au-sydney.conf`
- Wiring note: `index.html` exposes `#configPath` and `#toggle` — add a list or buttons that set `#configPath.value` to the selected config and trigger a click on `#toggle` to connect.
- Implementation hint: modify `renderer.js` to render buttons with `data-config-path` attributes and attach `click` handlers that call `document.querySelector('#configPath').value = this.dataset.configPath; document.querySelector('#toggle').click();`.

**Project-specific patterns & gotchas**
- Helper-first flow: `main.js` attempts `callDaemon('/connect')` before falling back to `runPrivileged()`.
- Command construction is duplicated: `buildConnectCommand` / `buildDisconnectCommand` appear in both `main.js` and `privileged-helper.js` — update both when modifying command logic.
- Token auth: helper expects a plain `daemon.token` file next to the helper binary; HTTP header is `x-vpn-token`.
- Config path validation: `validateConfigPath` enforces `configPath` be inside the user's profile or app data — tests and automation must respect this.
- IPC surface is intentionally small; if you change `preload.js` API names, update `renderer.js` accordingly.

**E2E and debugging tips for agents**
- E2E endpoints (main process): `POST /e2e/connect`, `POST /e2e/disconnect`, `POST /e2e/click`, `POST /e2e/set`, `POST /e2e/eval`, `GET /e2e/logs`.
- `e2e-test.js` captures stdout/stderr to `e2e-electron-stdout.log` / `e2e-electron-stderr.log` and writes JUnit at `e2e-results.xml` — useful when running CI.
- Electron selection in tests: `e2e-test.js` prefers `node_modules/electron/dist/electron.exe` on Windows, else falls back to `.bin/electron.cmd`.
- When debugging UI via CDP, `main.js` attaches `webContents.debugger` and uses `Runtime.evaluate` (see `/e2e/eval`, `/e2e/click`, `/e2e/set`).

**Files to inspect when changing behavior**
- IPC & lifecycle: `main.js`
- Preload API: `preload.js` (the bridge exposed to renderer)
- Renderer UI: `renderer.js`, `index.html`
- Privileged helper: `privileged-helper.js`
- Tests & CI: `e2e-test.js`, `e2e-results.xml`
- Installer scripts: `install-helper.ps1`, `uninstall-helper.ps1`, `service-status.ps1`, scripts/*

If anything here is unclear or you want more line-level code examples (e.g., exact command strings, token-handling locations, or how to run the helper in a service), tell me which area to expand and I'll iterate.
