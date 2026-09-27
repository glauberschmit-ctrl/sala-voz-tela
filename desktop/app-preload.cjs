const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('salaDesktop', {
 getSettings: () => ipcRenderer.invoke('program:settings'),
 setCloseToTray: value => ipcRenderer.invoke('program:close-to-tray', value)
});
