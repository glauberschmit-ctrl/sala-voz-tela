const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('capture', {
  list: () => ipcRenderer.invoke('capture:list'),
  choose: choice => ipcRenderer.send('capture:choose', choice),
  cancel: () => ipcRenderer.send('capture:cancel')
});
