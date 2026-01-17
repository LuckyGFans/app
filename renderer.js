window.addEventListener('DOMContentLoaded', async () => {
  let statusEl = document.getElementById('status');
  if (!statusEl) {
    // Ensure a visible status element exists even if the HTML changed or
    // the DOM isn't what we expect (helps E2E runs that query early).
    document.body.insertAdjacentHTML('afterbegin', '<div class="row">Status: <span id="status">idle</span></div>');
    statusEl = document.getElementById('status');
  }











































































});  });    toggleBtn.textContent = 'Connect';    connected = false;    setStatus('Process exited: ' + JSON.stringify(d));  window.electronAPI.onExit((d) => {  });    logEl.textContent += d + '\n';  window.electronAPI.onLog((d) => {  });    }      }        setStatus('Error: ' + (res.error || 'unknown'));      } else {        toggleBtn.textContent = 'Connect';        setStatus('Disconnected');        connected = false;      if (res.ok) {      }        res = await window.electronAPI.disconnect({ type: vpnType.value, configPath: cfgPath.value });      } else {        res = await window.electronAPI.disconnect();      if (cfgMode.value === 'mock') {      let res;      setStatus('Disconnecting...');    } else {      }        setStatus('Error: ' + (res.error || 'unknown'));      } else {        toggleBtn.textContent = 'Disconnect';        setStatus('Connected (' + res.mode + ')');        connected = true;      if (res.ok) {      }        res = await window.electronAPI.connect({ type: vpnType.value, configPath: cfgPath.value });      } else {        res = await window.electronAPI.connect();      if (cfgMode.value === 'mock') {      let res;      setStatus('Connecting...');    if (!connected) {  toggleBtn.addEventListener('click', async () => {  });    if (p) cfgPath.value = p;    const p = await window.electronAPI.selectConfigFile();  chooseBtn.addEventListener('click', async () => {  });    setStatus('Config saved');    await window.electronAPI.saveConfig({ mode: cfgMode.value, command: cfgCommand.value, vpnType: vpnType.value, configPath: cfgPath.value });  saveBtn.addEventListener('click', async () => {  cfgPath.value = cfg.configPath || '';  vpnType.value = cfg.vpnType || 'wireguard';  cfgCommand.value = cfg.command || '';  cfgMode.value = cfg.mode || 'mock';  const cfg = await window.electronAPI.getConfig();  }    }      console.warn('status element missing, status update:', text);      // Fallback: log when DOM is unexpectedly missing the status node    } else {      statusEl.textContent = text;    if (statusEl) {    }      statusEl = document.getElementById('status');    if (!statusEl) {  function setStatus(text) {  let connected = false;   const toggleBtn = document.getElementById('toggle');
   const cfgMode = document.getElementById('mode');
   const cfgCommand = document.getElementById('command');
   const saveBtn = document.getElementById('save');
   const vpnType = document.getElementById('vpnType');
   const cfgPath = document.getElementById('configPath');
   const chooseBtn = document.getElementById('chooseFile');
   const logEl = document.getElementById('log');