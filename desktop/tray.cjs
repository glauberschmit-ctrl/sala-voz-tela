const fs = require('node:fs');
const { trusted } = require('./policy.cjs');
function readPreferences(file) {
  try { const data = JSON.parse(fs.readFileSync(file, 'utf8')); return { closeToTray: data.closeToTray !== false }; }
  catch { return { closeToTray: true }; }
}
function micScript(desired = null) {
  return `(() => {
    const button = [...document.querySelectorAll('button.control[aria-pressed]')].find(el => ['Silenciar', 'Ligar microfone'].includes(el.textContent.trim()));
    if (!button || button.disabled) return null;
    const enabled = button.getAttribute('aria-pressed') === 'true';
    const desired = ${JSON.stringify(desired)};
    if (desired !== null && enabled !== desired) button.click();
    return enabled;
  })()`;
}
function installTray({ app, window, Tray, Menu, nativeImage, dialog, iconPath, preferencesPath, onHide = () => {} }) {
  const preferences = readPreferences(preferencesPath);
  let quitting = false;
  const tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 32, height: 32 }));
  tray.setToolTip('Sala — voz e tela');
  const show = () => {
    if (window.isDestroyed()) return;
    if (window.isMinimized()) window.restore();
    window.show(); window.focus();
  };
  const hide = () => { onHide(); window.hide(); };
  const quit = () => { quitting = true; app.quit(); };
  const report = () => { show(); void dialog.showMessageBox(window, { type: 'warning', message: 'Não foi possível controlar o microfone.', detail: 'Abra a sala e confira o microfone e as permissões em Configurações.' }); };
  const setCloseToTray = value => {
    try {
      fs.writeFileSync(preferencesPath, JSON.stringify({ closeToTray: value }));
      preferences.closeToTray = value;
    } catch { void dialog.showMessageBox(window, { type: 'warning', message: 'Não foi possível salvar essa preferência.' }); }
    updateAppMenu();
  };
  function preferenceItem() { return { label: 'Ao fechar, minimizar para a bandeja', type: 'checkbox', checked: preferences.closeToTray, click: item => setCloseToTray(item.checked) }; }
  function updateAppMenu() {
    const item = Menu.getApplicationMenu()?.getMenuItemById('close-to-tray');
    if (item) item.checked = preferences.closeToTray;
  }
  async function microphone(desired = null) {
    if (window.isDestroyed() || !trusted(window.webContents.getURL())) return null;
    return window.webContents.executeJavaScript(micScript(desired), desired !== null);
  }
  async function openMenu() {
    let state = null;
    let timer;
    try { state = await Promise.race([microphone(), new Promise(resolve => { timer = setTimeout(() => resolve(null), 1500); })]); }
    catch {} finally { clearTimeout(timer); }
    if (tray.isDestroyed()) return;
    tray.popUpContextMenu(Menu.buildFromTemplate([
      { label: 'Abrir Sala', click: show },
      { label: state === true ? 'Silenciar microfone' : state === false ? 'Ligar microfone' : 'Microfone indisponível — abra uma sala', enabled: state !== null, click: () => {
        // Show the app before acquiring a microphone so permission/error prompts are visible.
        if (!state) show();
        void microphone(!state).then(result => { if (result === null) report(); }).catch(report);
      } },
      { type: 'separator' }, preferenceItem(),
      { type: 'separator' }, { label: 'Sair do Sala', click: quit }
    ]));
  }
  tray.on('click', show);
  tray.on('double-click', show);
  tray.on('right-click', () => { void openMenu(); });
  window.on('close', event => {
    if (!quitting && preferences.closeToTray && !tray.isDestroyed()) { event.preventDefault(); hide(); }
  });
  window.on('query-session-end', () => { quitting = true; });
  window.on('session-end', () => { quitting = true; });
  app.on('before-quit', () => { quitting = true; });
  window.on('closed', () => { if (!tray.isDestroyed()) tray.destroy(); });
  return { show, hide, quit, preferenceItem, openMenu };
}
module.exports = { installTray, readPreferences, micScript };
