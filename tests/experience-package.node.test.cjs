const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

test('the packaged authoring entrypoint can resolve its buyer experience and layout guidance', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'insitu-experience-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const archive = path.join(directory, 'plugin.zip');
  execFileSync(process.execPath, [path.resolve(__dirname, '../extensions/insitu-workspace/package-openai.mjs'), archive]);
  const entries = new Set(execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n'));
  const entrypoint = 'skills/insitu-storefront-authoring/SKILL.md';
  const experience = 'skills/insitu-storefront-authoring/experience.md';
  const read = (file) => execFileSync('unzip', ['-p', archive, file], { encoding: 'utf8' });
  assert(entries.has(experience));
  assert(read(entrypoint).includes('(experience.md)'));
  assert.equal(read(experience), fs.readFileSync(path.resolve(__dirname, '../plugins/insitu-sales/skills/insitu-storefront-authoring/experience.md'), 'utf8'));
  for (const file of [entrypoint, experience]) {
    for (const [, target] of read(file).matchAll(/\[[^\]]+\]\(([^)]+\.md)(?:#[^)]*)?\)/g)) {
      if (/^https?:/.test(target)) continue;
      assert(entries.has(path.posix.normalize(path.posix.join(path.posix.dirname(file), target))), `${file}: missing ${target}`);
    }
  }
});
