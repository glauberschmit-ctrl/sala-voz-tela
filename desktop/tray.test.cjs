const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { installTray, readPreferences, micScript } = require('./tray.cjs');
const { SITE } = require('./policy.cjs');
test('X esconde; abrir restaura; preferência persiste; sair fecha de verdade', async () => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sala-tray-'));
 const file = path.join(dir, 'preferences.json');
 let hidden = false, minimized = true, focused = false, prevented = false, destroyed = false, menu, quitCount = 0, executeCount = 0, origin = SITE;
 const window = Object.assign(new EventEmitter(), {
  isDestroyed: () => false, isMinimized: () => minimized, restore: () => { minimized = false; },
  show: () => { hidden = false; }, hide: () => { hidden = true; }, focus: () => { focused = true; },
  webContents: { getURL: () => origin, executeJavaScript: async () => { executeCount++; return true; } }
 });
 const app = Object.assign(new EventEmitter(), { quit: () => { quitCount++; app.emit('before-quit'); } });
 class Tray extends EventEmitter { setToolTip() {} isDestroyed() { return destroyed; } destroy() { destroyed = true; } popUpContextMenu(m) { menu = m; } }
 const controls = installTray({ app, window, Tray, Menu: { buildFromTemplate: x => x, getApplicationMenu: () => null }, nativeImage: { createFromPath: () => ({ resize: () => ({}) }) }, dialog: { showMessageBox: async () => {} }, iconPath: 'icon.png', preferencesPath: file });
 const close = () => { prevented = false; window.emit('close', { preventDefault: () => { prevented = true; } }); };
 try {
  assert.equal(readPreferences(file).closeToTray, false);
  controls.preferenceItem().click({ checked: true });
  close(); assert.equal(prevented, true); assert.equal(hidden, true); assert.equal(quitCount, 0);
  controls.show(); assert.equal(hidden, false); assert.equal(minimized, false); assert.equal(focused, true);
  controls.preferenceItem().click({ checked: false }); assert.equal(readPreferences(file).closeToTray, false);
  close(); assert.equal(prevented, false);
  controls.preferenceItem().click({ checked: true }); assert.equal(readPreferences(file).closeToTray, true);
  await controls.openMenu(); assert.equal(menu[1].label, 'Silenciar microfone');
  const before = executeCount; origin = 'https://example.com'; await controls.openMenu();
  assert.equal(executeCount, before); assert.equal(menu[1].enabled, false);
  controls.quit(); close(); assert.equal(quitCount, 1); assert.equal(prevented, false);
  window.emit('closed'); assert.equal(destroyed, true);
 } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('menu não inverte um microfone que já mudou de estado; ausência de sala é tratada', () => {
 let enabled = true, clicks = 0;
 const button = { disabled: false, get textContent() { return enabled ? 'Silenciar' : 'Ligar microfone'; }, getAttribute: () => String(enabled), click: () => { enabled = !enabled; clicks++; } };
 const context = { document: { querySelectorAll: () => [button] } };
 assert.equal(vm.runInNewContext(micScript(), context), true);
 vm.runInNewContext(micScript(false), context); assert.equal(enabled, false); assert.equal(clicks, 1);
 vm.runInNewContext(micScript(false), context); assert.equal(clicks, 1);
 vm.runInNewContext(micScript(true), context); assert.equal(enabled, true); assert.equal(clicks, 2);
 button.disabled = true; assert.equal(vm.runInNewContext(micScript(), context), null);
 assert.equal(vm.runInNewContext(micScript(), { document: { querySelectorAll: () => [] } }), null);
});
