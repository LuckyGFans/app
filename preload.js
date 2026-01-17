const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getConfig: () => ipcRenderer.invoke('vpn-get-config'),
    saveConfig: (cfg) => ipcRenderer.invoke('vpn-save-config', cfg),
    connect: (args) => ipcRenderer.invoke('vpn-connect', args),
    disconnect: (args) => ipcRenderer.invoke('vpn-disconnect', args),
    onLog: (cb) => ipcRenderer.on('vpn-log', (e, data) => cb(data)),
    onExit: (cb) => ipcRenderer.on('vpn-exit', (e, data) => cb(data))
});
