const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 43123;
const HOST = '127.0.0.1';
const TOKEN_FILE = path.join(__dirname, 'daemon.token');

function readToken() {
    try {
        return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    } catch (e) {
        return null;
    }
}

function sanitizePath(p) {
    return String(p).replace(/['"`]/g, '');
}

function ensureLogDir() {
    const dir = path.join(__dirname, 'vpn-logs');
    try { fs.mkdirSync(dir, { recursive: true }); } catch { }
    return dir;
}

function buildConnectCommand(vpnType, configPath) {
    const safe = sanitizePath(configPath);
    const log = path.join(ensureLogDir(), `${path.basename(safe)}.log`);
    if (process.platform === 'win32') {
        if (vpnType === 'openvpn') {
            return { cmd: 'powershell', args: ['-NoProfile', '-Command', `Start-Process -FilePath 'openvpn' -ArgumentList '--config','${safe}' -WindowStyle Hidden`] };
        } else {
            return { cmd: 'powershell', args: ['-NoProfile', '-Command', `Start-Process -FilePath 'wireguard.exe' -ArgumentList '/installtunnelservice','${safe}' -WindowStyle Hidden`] };
        }
    } else {
        if (vpnType === 'openvpn') {
            return { cmd: 'sh', args: ['-c', `nohup openvpn --config '${safe}' > '${log}' 2>&1 &`] };
        } else {
            return { cmd: 'sh', args: ['-c', `nohup wg-quick up '${safe}' > '${log}' 2>&1 &`] };
        }
    }
}

function buildDisconnectCommand(vpnType, configPath) {
    const safe = sanitizePath(configPath);
    if (process.platform === 'win32') {
        return { cmd: 'powershell', args: ['-NoProfile', '-Command', `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match '${safe.replace(/\\/g, '\\\\')}' } | ForEach-Object { Stop-Process -Id $_.ProcessId }`] };
    } else {
        if (vpnType === 'openvpn') {
            return { cmd: 'sh', args: ['-c', `pkill -f "openvpn.*${path.basename(safe)}" || true`] };
        } else {
            return { cmd: 'sh', args: ['-c', `wg-quick down '${safe}' || true`] };
        }
    }
}

function runCmd(cmdObj) {
    return new Promise((resolve) => {
        const p = spawn(cmdObj.cmd, cmdObj.args, { detached: true, stdio: 'ignore', shell: false });
        p.unref();
        resolve({ ok: true });
    });
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && (req.url === '/connect' || req.url === '/disconnect')) {
        const token = req.headers['x-vpn-token'];
        const real = readToken();
        if (!real || token !== real) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'invalid token' }));
            return;
        }
        let body = '';
        req.on('data', (d) => body += d);
        req.on('end', async () => {
            try {
                const j = JSON.parse(body || '{}');
                const type = j.type;
                const configPath = j.configPath;
                if (!type || !configPath) throw new Error('missing fields');
                const cmdObj = req.url === '/connect' ? buildConnectCommand(type, configPath) : buildDisconnectCommand(type, configPath);
                const out = await runCmd(cmdObj);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, result: out }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: String(err) }));
            }
        });
        return;
    }
    if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, pid: process.pid }));
        return;
    }
    res.writeHead(404);
    res.end();
});

server.listen(PORT, HOST, () => {
    console.log(`Privileged helper listening at http://${HOST}:${PORT}/ (token file: ${TOKEN_FILE})`);
});
