const { app, BrowserWindow, session, desktopCapturer, ipcMain, dialog, Menu, clipboard, Tray, nativeImage } = require('electron');
const path = require('node:path');
const { installTray } = require('./tray.cjs');
const ownsInstance = app.requestSingleInstanceLock();
if (!ownsInstance) app.quit();
let trayControls;
app.on('second-instance', () => trayControls?.show());
const { SITE, trusted, allowedPermission } = require('./policy.cjs');
let main;
let pending;
function chooseSource(request, callback) {
  if (pending || !request.userGesture || !trusted(request.frame?.url) || request.frame !== main.webContents.mainFrame) return callback({});
  const picker = new BrowserWindow({ parent: main, modal: true, width: 820, height: 620, title: 'O que você quer compartilhar?', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'picker-preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false } });
  let done = false;
  const finish = selection => {
    if (done) return;
    done = true;
    pending = null;
    try { callback(selection); } catch { /* A página pode ter sido fechada durante a seleção. */ }
    if (!picker.isDestroyed()) picker.close();
  };
  pending = { picker, request, sources: [], finish };
  picker.on('closed', () => finish({}));
  picker.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  picker.webContents.on('will-navigate', event => event.preventDefault());
  picker.loadFile('picker.html').catch(() => finish({}));
}
app.whenReady().then(() => {
  if (!ownsInstance) return;
  app.setAppUserModelId('br.com.sala.desktop');
  const ses = session.fromPartition('persist:sala');
  ses.setPermissionCheckHandler((contents, permission, origin) => contents === main?.webContents && allowedPermission(permission, origin));
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(contents === main?.webContents && allowedPermission(permission, details.requestingUrl) && trusted(contents.getURL()));
  });
  ses.setDisplayMediaRequestHandler(chooseSource);
  main = new BrowserWindow({ width: 1280, height: 820, minWidth: 700, minHeight: 540, title: 'Sala', icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'app-preload.cjs'), session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  try {
    trayControls = installTray({ app, window: main, Tray, Menu, nativeImage, dialog, iconPath: path.join(__dirname, 'icon.png'), preferencesPath: path.join(app.getPath('userData'), 'desktop-preferences.json'), onHide: () => pending?.finish({}) });
  } catch {
    void dialog.showMessageBox(main, { type: 'warning', message: 'A bandeja não está disponível. Fechar a janela encerrará o Sala.' });
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Sala', submenu: [{ label: 'Início', click: () => main.loadURL(SITE) }, { label: 'Abrir convite copiado', click: async () => { const url = clipboard.readText().trim(); if (trusted(url) && /^[a-f0-9]{32}$/.test(new URLSearchParams(new URL(url).hash.slice(1)).get('sala') || '')) { await main.loadURL(url).then(() => main.webContents.reload()).catch(() => {}); } else dialog.showMessageBox(main, { message: 'Copie um link de convite do Sala e tente novamente.' }); } }, { type: 'separator' }, ...(trayControls ? [{ label: 'Minimizar para a bandeja', click: trayControls.hide }, { ...trayControls.preferenceItem(), id: 'close-to-tray' }, { type: 'separator' }] : []), { role: 'quit', label: 'Sair do Sala' }] },
    { label: 'Editar', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'Exibir', submenu: [{ role: 'reload', label: 'Recarregar' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] }
  ]));
  main.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  main.webContents.on('will-navigate', (event, url) => { if (!trusted(url)) event.preventDefault(); pending?.finish({}); });
  main.webContents.on('will-redirect', (event, url) => { if (!trusted(url)) event.preventDefault(); });
  main.webContents.on('will-attach-webview', event => event.preventDefault());
  main.webContents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
    if (isMainFrame && code !== -3) dialog.showMessageBox(main, { type: 'warning', message: 'Não foi possível conectar ao Sala.', detail: 'Verifique sua internet e use Exibir → Recarregar para tentar novamente.' });
  });
  main.on('closed', () => { pending?.finish({}); main = null; });
  main.loadURL(SITE).catch(() => {});
});
ipcMain.handle('capture:list', async event => {
  const current = pending;
  if (!current || event.sender !== current.picker.webContents || event.senderFrame !== current.picker.webContents.mainFrame) throw new Error('Solicitação inválida');
  const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 }, fetchWindowIcons: false });
  if (pending !== current) return [];
  current.sources = sources;
  return sources.map(source => ({ id: source.id, name: source.name, thumbnail: source.thumbnail.toDataURL() }));
});
ipcMain.on('capture:choose', (event, choice) => {
  const current = pending;
  if (!current || event.sender !== current.picker.webContents || event.senderFrame !== current.picker.webContents.mainFrame) return;
  const source = current.sources.find(item => item.id === choice?.id);
  if (!source || !trusted(current.request.frame?.url)) return current.finish({});
  current.finish({ video: source, ...(choice.audio === true && current.request.audioRequested ? { audio: 'loopback' } : {}) });
});
ipcMain.on('capture:cancel', event => { if (event.sender === pending?.picker.webContents) pending.finish({}); });
app.on('window-all-closed', () => app.quit());

function verifySettingsSender(event) {
 if (!main || event.sender !== main.webContents || event.senderFrame !== main.webContents.mainFrame || !trusted(event.senderFrame.url)) throw new Error('Solicitação inválida');
}
ipcMain.handle('program:settings', event => {
 verifySettingsSender(event);
 return { closeToTray: trayControls?.getCloseToTray() ?? false, trayAvailable: !!trayControls, version: app.getVersion() };
});
ipcMain.handle('program:close-to-tray', (event, value) => {
 verifySettingsSender(event);
 if(typeof value !== 'boolean' || !trayControls) throw new Error('Bandeja indisponível');
 if(!trayControls.setCloseToTray(value)) throw new Error('Não foi possível salvar a preferência');
 return { closeToTray: trayControls.getCloseToTray(), trayAvailable: true, version: app.getVersion() };
});
