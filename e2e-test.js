const { spawn } = require('child_process');
const http = require('http');
const path = require('path');











































































































































}) (); process.exit(0); fs.writeFileSync(path.join(ROOT, 'e2e-results.xml'), xml, 'utf8'); const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n  <testsuite name="e2e" tests="1" failures="0">\n    <testcase classname="e2e" name="ui-flow"/>\n  </testsuite>\n</testsuites>`; const fs = require('fs');    // write JUnit result    child.kill();
n    console.log('Shutting down app');  }    process.exit(8); child.kill(); console.error('Log assertion failed'); fs.writeFileSync(path.join(ROOT, 'e2e-results.xml'), failXml, 'utf8'); const failXml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n  <testsuite name="e2e" tests="1" failures="1">\n    <testcase classname="e2e" name="ui-flow">\n      <failure>Logs response invalid or missing</failure>\n    </testcase>\n  </testsuite>\n</testsuites>`; const fs = require('fs');    // write junit with failure  if (!logs || !logs.ok || !Array.isArray(logs.logs)) {
n  // Assertions for logs: expect a valid response with logs array  console.log('logs:', logs);  });      let out=''; res.on('data', d=>out+=d); res.on('end', ()=>resolve(JSON.parse(out))); }).on('error', reject);    http.get({ hostname: '127.0.0.1', port: 43124, path: '/e2e/logs' }, (res) => {  const logs = await new Promise((resolve, reject) => {
n  console.log('E2E UI assertions passed. Fetching logs...'); if (evalValue(disconnected) !== 'Disconnected') { console.error('Expected status to be Disconnected'); child.kill(); process.exit(6); } console.log('status after disconnect:', disconnected); const disconnected = await postJson(43124, '/e2e/eval', { expression: "(function(){const el=document.querySelector('#status'); return el?el.textContent:null})()" }); await new Promise(r => setTimeout(r, 500)); await postJson(43124, '/e2e/click', { selector: '#toggle' });
n  // Click Disconnect  if (!connectedVal.startsWith('Connected')) { console.error('Expected status to start with Connected'); child.kill(); process.exit(5); }  const connectedVal = evalValue(connected) || '';  console.log('status after connect:', connected);  const connected = await postJson(43124, '/e2e/eval', { expression: "(function(){const el=document.querySelector('#status'); return el?el.textContent:null})()" });  await new Promise(r => setTimeout(r, 800));  await postJson(43124, '/e2e/click', { selector: '#toggle' });
n  // Click Connect (toggle button)  console.log('configPath set');  if (evalValue(cfgVal) !== samplePath) { console.error('Failed to set configPath'); child.kill(); process.exit(4); }  const cfgVal = await postJson(43124, '/e2e/eval', { expression: "(function(){const el=document.querySelector('#configPath'); return el?el.value:null})()" });  await postJson(43124, '/e2e/set', { selector: '#configPath', value: samplePath });  const samplePath = process.platform === 'win32' ? 'C:\\temp\\wg0.conf' : '/tmp/wg0.conf';
n  // Set a sample configPath and verify  console.log('mode set to mock');  if (evalValue(modeVal) !== 'mock') { console.error('Failed to set mode to mock'); child.kill(); process.exit(3); }  const modeVal = await postJson(43124, '/e2e/eval', { expression: "(function(){const el=document.querySelector('#mode'); return el?el.value:null})()" });  await postJson(43124, '/e2e/set', { selector: '#mode', value: 'mock' });
n  // Set mode to mock via the renderer  if (initialVal !== 'idle' && initialVal !== 'Disconnected') { console.error('Expected initial status to be "idle" or "Disconnected"'); child.kill(); process.exit(2); }  const initialVal = evalValue(initial);  console.log('initial status:', initial);  const initial = await postJson(43124, '/e2e/eval', { expression: "(function(){const el=document.querySelector('#status'); return el?el.textContent:null})()" });
n  // Assert initial status is 'idle'  }    return undefined;    if (typeof r.result === 'string') return r.result;    if (typeof r.value !== 'undefined') return r.value;    if (r.result && typeof r.result === 'object' && ('value' in r.result)) return r.result.value;    const r = resp.result;    if (!resp || !resp.result) return undefined;
n  function evalValue(resp) {
n  console.log('E2E server up — running UI-driven assertions');
} process.exit(1); child.kill(); console.error('E2E server did not start:', err);  } catch (err) { await waitForServer(43124, 10000); try { }); console.log(`electron exited code=${code} signal=${sig}`); errStream.end(); outStream.end(); child.on('exit', (code, sig) => { }); errStream.write(s); process.stderr.write('[electron] ' + s); const s = d.toString(); child.stderr.on('data', d => { }); outStream.write(s); process.stdout.write('[electron] ' + s); const s = d.toString(); child.stdout.on('data', d => { const child = spawn(ELECTRON, ['.'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] }); const errStream = require('fs').createWriteStream(errLog, { flags: 'a' }); const outStream = require('fs').createWriteStream(outLog, { flags: 'a' }); const errLog = path.join(ROOT, 'e2e-electron-stderr.log'); const outLog = path.join(ROOT, 'e2e-electron-stdout.log'); const env = Object.assign({}, process.env, { E2E: '1' }); console.log('Starting Electron in E2E mode...'); (async () => { }  }); req.write(data); req.end(); req.on('error', reject); }); res.on('end', () => resolve(JSON.parse(out))); res.on('data', d => out += d); let out = ''; const req = http.request(opts, (res) => { const opts = { hostname: '127.0.0.1', port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }; const data = JSON.stringify(body || {}); return new Promise((resolve, reject) => { function postJson(port, path, body) { } }); })(); req.end();      }); setTimeout(poll, 200); if (Date.now() - start > timeoutMs) return reject(new Error('timeout')); req.on('error', (e) => { const req = http.request({ hostname: '127.0.0.1', port, path: '/e2e/logs', method: 'GET', timeout: 1000 }, (res) => { resolve(); }); (function poll() { return new Promise((resolve, reject) => { const start = Date.now(); function waitForServer(port, timeoutMs = 30000) { } ELECTRON = path.join(ROOT, 'node_modules', '.bin', 'electron'); } else {}    ELECTRON = path.join(ROOT, 'node_modules', '.bin', 'electron.cmd'); } else { ELECTRON = distExe; if (fs.existsSync(distExe)) { const distExe = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe'); if (process.platform === 'win32') { let ELECTRON; const fs = require('fs');nconst ROOT = path.resolve(__dirname);