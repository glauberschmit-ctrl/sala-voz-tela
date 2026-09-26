const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SITE, trusted, allowedPermission } = require('./policy.cjs');
test('somente a origem exata do Sala recebe acesso aos dispositivos', () => {
  assert.ok(trusted(SITE + '/?room=ABC'));
  for (const url of ['https://example.com', SITE + '.evil.test', SITE.replace('https:', 'http:'), 'file:///etc/passwd', 'javascript:alert(1)', 'invalid']) {
    assert.equal(trusted(url), false);
    assert.equal(allowedPermission('media', url), false);
  }
  assert.ok(allowedPermission('media', SITE));
  assert.ok(allowedPermission('display-capture', SITE));
  assert.equal(allowedPermission('geolocation', SITE), false);
});
