const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const sudo = require('sudo-prompt');
const http = require('http');

const DAEMON_PORT = 43123;
const DAEMON_HOST = '127.0.0.1';
const DAEMON_URL = `http://${DAEMON_HOST}:${DAEMON_PORT}`;

function callDaemon(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body || {});
        const opts = {
            hostname: DAEMON_HOST,
            port: DAEMON_PORT,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'x-vpn-token': fs.existsSync(path.join(__dirname, 'daemon.token')) ? fs.readFileSync(path.join(__dirname, 'daemon.token'), 'utf8').trim() : ''
            }
        };
        const req = http.request(opts, (res) => {
            let out = '';
            res.on('data', (d) => out += d);
            res.on('end', () => {
                try { resolve(JSON.parse(out)); } catch (e) { resolve({ ok: false, error: 'invalid response' }); }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

// E2E control server (activated when E2E env var is set)
function startE2EServer() {
    const E2E_PORT = 43124;
    const server = http.createServer(async (req, res) => {
        // helper to ensure debugger attached
        async function ensureDebuggerAndEnable() {
            if (!mainWindow) throw new Error('no mainWindow');
            // wait briefly for the renderer to become ready to avoid early evals
            const waitForRenderer = (timeoutMs = 5000) => new Promise((resolve, reject) => {
                if (rendererReady) return resolve();
                const start = Date.now();
                const iv = setInterval(() => {
                    if (rendererReady) { clearInterval(iv); return resolve(); }
                    if (Date.now() - start > timeoutMs) { clearInterval(iv); return reject(new Error('renderer not ready')); }
                }, 50);
            });
            try { await waitForRenderer(5000); } catch (e) { /* continue, attach may still work */ }

            const wc = mainWindow.webContents;
            try {
                if (!wc.debugger.isAttached()) {
                    wc.debugger.attach('1.3');
                }
                // enable Runtime domain
                try { await wc.debugger.sendCommand('Runtime.enable'); } catch (e) { }
            } catch (e) {
                throw new Error('failed to attach debugger: ' + e);
            }
            return wc;
        }

        if (req.method === 'POST' && req.url === '/e2e/connect') {
            let body = '';
            req.on('data', (d) => body += d);
            req.on('end', async () => {
                try {
                    const j = body ? JSON.parse(body) : {};
                    if (j.mock) {
                        vpnProcess = { mock: true };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ ok: true, mode: 'mock' }));
                        return;
                    }
                    // otherwise attempt privileged/connect flow
                    const validated = validateConfigPath(j.configPath);
                    try {
                        const dres = await callDaemon('/connect', { type: j.type, configPath: validated });
                        if (dres && dres.ok) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, mode: 'daemon' })); return; }
                    } catch (e) { }
                    const cmd = buildConnectCommand(j.type, validated);
                    await runPrivileged(cmd);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true, mode: 'privileged' }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: String(err) }));
                }
            });
            return;
        }
        if (req.method === 'POST' && req.url === '/e2e/disconnect') {
            let body = '';
            req.on('data', (d) => body += d);
            req.on('end', async () => {
                try {
                    const j = body ? JSON.parse(body) : {};
                    if (vpnProcess && vpnProcess.mock) { vpnProcess = null; res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); return; }
                    try {
                        const dres = await callDaemon('/disconnect', { type: j.type, configPath: j.configPath });
                        if (dres && dres.ok) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, mode: 'daemon' })); return; }
                    } catch (e) { }
                    const cmd = buildDisconnectCommand(j.type, j.configPath);
                    await runPrivileged(cmd);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: String(err) }));
                }
            });
            return;
        }
        if (req.method === 'GET' && req.url === '/e2e/logs') {
            try {
                const dir = ensureLogDir();
                const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
                const out = files.map(f => ({ file: f, content: fs.readFileSync(path.join(dir, f), 'utf8') }));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, logs: out }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: String(err) }));
            }
            return;
        }
        // CDP-based renderer control
        if (req.method === 'POST' && req.url === '/e2e/click') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', async () => {
                try {
                    const j = JSON.parse(body || '{}');
                    if (!j.selector) throw new Error('selector required');
                    const wc = await ensureDebuggerAndEnable();
                    const expr = `(function(){const el=document.querySelector(${JSON.stringify(j.selector)}); if(!el) throw 'no element'; el.click(); return true; })()`;
                    await wc.debugger.sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true });
                    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true }));
                } catch (err) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(err) })); }
            });
            return;
        }

        if (req.method === 'POST' && req.url === '/e2e/eval') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', async () => {
                try {
                    const j = JSON.parse(body || '{}');
                    if (!j.expression) throw new Error('expression required');
                    const wc = await ensureDebuggerAndEnable();
                    const resEval = await wc.debugger.sendCommand('Runtime.evaluate', { expression: j.expression, returnByValue: true });
                    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, result: resEval }));
                } catch (err) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(err) })); }
            });
            return;
        }

        if (req.method === 'POST' && req.url === '/e2e/set') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', async () => {
                try {
                    const j = JSON.parse(body || '{}');
                    if (!j.selector) throw new Error('selector required');
                    if (typeof j.value === 'undefined') throw new Error('value required');
                    const wc = await ensureDebuggerAndEnable();
                    const expr = `(function(){const el=document.querySelector(${JSON.stringify(j.selector)}); if(!el) throw 'no element'; el.value = ${JSON.stringify(j.value)}; el.dispatchEvent(new Event('input', { bubbles:true })); return true; })()`;
                    await wc.debugger.sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true });
                    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true }));
                } catch (err) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(err) })); }
            });
            return;
        }
        res.writeHead(404); res.end();
    });
    server.listen(E2E_PORT, '127.0.0.1', () => {
        console.log(`E2E control server listening on http://127.0.0.1:${E2E_PORT}`);
    });
}

const CONFIG_FILE = path.join(app.getPath('userData'), 'vpn-config.json');

function loadConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        return { mode: 'mock', command: '' };
    }
}

function saveConfig(cfg) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

let vpnProcess = null;
let mainWindow = null;
let rendererReady = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 480,
        height: 360,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
    // mark renderer as ready when DOM is available so E2E harness can wait
    mainWindow.webContents.on('dom-ready', () => {
        rendererReady = true;
    });
}

app.whenReady().then(() => {
    createWindow();
    if (process.env.E2E === '1') startE2EServer();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('vpn-get-config', () => {
    return loadConfig();
});

ipcMain.handle('vpn-save-config', (event, cfg) => {
    saveConfig(cfg);
    return { ok: true };
});

function sanitizePath(p) {
    return String(p).replace(/['"`]/g, '');
}

function validateConfigPath(p) {
    if (!p || typeof p !== 'string') throw new Error('configPath missing');
    const abs = path.isAbsolute(p) ? p : path.resolve(p);
    if (!fs.existsSync(abs)) throw new Error('config file not found');
    const allowedRoots = [app.getPath('home'), app.getPath('userData')].map(x => path.resolve(x));
    const resolved = path.resolve(abs);
    if (!allowedRoots.some(r => resolved.startsWith(r))) {
        throw new Error('configPath must be inside user profile or app data');
    }
    return resolved;
}

function ensureLogDir() {
    const dir = path.join(app.getPath('userData'), 'vpn-logs');
    try { fs.mkdirSync(dir, { recursive: true }); } catch { }
    return dir;
}

function buildConnectCommand(vpnType, configPath) {
    const safe = sanitizePath(configPath);
    const log = path.join(ensureLogDir(), `${path.basename(safe)}.log`);
    if (process.platform === 'win32') {
        if (vpnType === 'openvpn') {
            return `powershell -NoProfile -Command "Start-Process -FilePath 'openvpn' -ArgumentList '--config','${safe}' -Verb RunAs -WindowStyle Hidden"`;
        } else {
            return `powershell -NoProfile -Command "Start-Process -FilePath 'wireguard.exe' -ArgumentList '/installtunnelservice','${safe}' -Verb RunAs -WindowStyle Hidden"`;
        }
    } else {
        if (vpnType === 'openvpn') {
            return `nohup openvpn --config '${safe}' > '${log}' 2>&1 &`;
        } else {
            return `nohup wg-quick up '${safe}' > '${log}' 2>&1 &`;
        }
    }
}

function buildDisconnectCommand(vpnType, configPath) {
    const safe = sanitizePath(configPath);
    if (process.platform === 'win32') {
        return `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match '${safe.replace(/\\/g, '\\\\')}' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"`;
    } else {
        if (vpnType === 'openvpn') {
            return `pkill -f "openvpn.*${path.basename(safe)}" || true`;
        } else {
            return `wg-quick down '${safe}' || true`;
        }
    }
}

function runPrivileged(cmd) {
    return new Promise((resolve, reject) => {
        sudo.exec(cmd, { name: 'VPN Desktop' }, (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve({ stdout, stderr });
        });
    });
}

ipcMain.handle('select-config-file', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (res.canceled || !res.filePaths.length) return null;
    return res.filePaths[0];
});

ipcMain.handle('vpn-connect', async (event, args) => {
    // args optional: { type: 'wireguard'|'openvpn', configPath: '/abs/path' }
    const cfg = loadConfig();
    if (vpnProcess) return { ok: false, error: 'Already connected' };

    if (!args || cfg.mode === 'mock') {
        vpnProcess = { mock: true };
        setTimeout(() => { }, 500);
        return { ok: true, mode: 'mock' };
    }

    try {
        const validated = validateConfigPath(args.configPath);
        // Prefer local privileged helper if available
        try {
            const res = await callDaemon('/connect', { type: args.type, configPath: validated });
            if (res && res.ok) return { ok: true, mode: 'daemon' };
        } catch (e) {
            // daemon unavailable, fall through to elevation
        }

        const cmd = buildConnectCommand(args.type, validated);
        await runPrivileged(cmd);
        return { ok: true, mode: 'privileged' };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

ipcMain.handle('vpn-disconnect', async (event, args) => {
    if (!args) {
        // no args -> try to stop mock
        if (vpnProcess && vpnProcess.mock) { vpnProcess = null; return { ok: true }; }
        return { ok: false, error: 'No args provided' };
    }
    try {
        const validated = validateConfigPath(args.configPath);
        try {
            const res = await callDaemon('/disconnect', { type: args.type, configPath: validated });
            if (res && res.ok) return { ok: true, mode: 'daemon' };
        } catch (e) {
            // daemon not available, fall through
        }
        const cmd = buildDisconnectCommand(vpnType, validated);
        await runPrivileged(cmd);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});
