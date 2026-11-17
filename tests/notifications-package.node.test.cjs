const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

test('notification instructions are discoverable and complete in the distributed plugin', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'insitu-notifications-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const archive = path.join(directory, 'plugin.zip');
  execFileSync(process.execPath, [path.resolve(__dirname, '../extensions/insitu-workspace/package-openai.mjs'), archive]);
  const entries = new Set(execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n'));
  const root = 'skills/insitu-storefront-authoring/';
  const read = file => execFileSync('unzip', ['-p', archive, file], { encoding: 'utf8' });
  assert(entries.has(root + 'notifications.md'));
  assert(read(root + 'SKILL.md').includes('(notifications.md)'));
  assert.equal(read(root + 'notifications.md'), fs.readFileSync(path.resolve(__dirname, '../plugins/insitu-sales/' + root + 'notifications.md'), 'utf8'));
  for (const [, target] of read(root + 'notifications.md').matchAll(/\[[^\]]+\]\(([^)]+\.md)(?:#[^)]*)?\)/g)) {
    if (/^https?:/.test(target)) continue;
    assert(entries.has(path.posix.normalize(path.posix.join(root, target))), `Missing reference: ${target}`);
  }
});
