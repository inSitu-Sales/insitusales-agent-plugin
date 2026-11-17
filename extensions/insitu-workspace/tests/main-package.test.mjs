import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('the shared plugin folder ships skills without scripts or a local MCP bundle', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'insitu-plugin-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const installed = join(temporary, 'plugin');
  await cp(new URL('../../../plugins/insitu-sales/', import.meta.url), installed, { recursive: true });
  assert.deepEqual(await readdir(join(installed, 'skills')), ['insitu-storefront-authoring', 'insitu-workspace']);
  await access(join(installed, 'skills/insitu-storefront-authoring/upload.md'));
  await assert.rejects(access(join(installed, 'skills/insitu-storefront-authoring/scripts')), { code: 'ENOENT' });
  await assert.rejects(access(join(installed, 'server')), { code: 'ENOENT' });
  await assert.rejects(access(join(installed, 'ui')), { code: 'ENOENT' });
  await assert.rejects(access(join(installed, 'plugin.json')), { code: 'ENOENT' });
});
