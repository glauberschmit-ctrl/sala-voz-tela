const SITE = 'https://sala-voz-glauber.glauberschmit.chatgpt.site';
function trusted(url) { try { return new URL(url).origin === SITE; } catch { return false; } }
function allowedPermission(permission, origin) {
  return trusted(origin) && ['media', 'display-capture', 'speaker-selection', 'clipboard-sanitized-write'].includes(permission);
}
module.exports = { SITE, trusted, allowedPermission };
