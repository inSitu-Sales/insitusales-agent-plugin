import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('the installed plugin ships skills and a helper without a local MCP bundle', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'insitu-plugin-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const installed = join(temporary, 'plugin');
  await cp(new URL('../../../plugins/insitu-sales/', import.meta.url), installed, { recursive: true });
  assert.deepEqual(await readdir(join(installed, 'skills')), ['insitu-storefront-authoring', 'insitu-workspace']);
  await access(join(installed, 'skills/insitu-storefront-authoring/scripts/upload-storefront.js'));
  await assert.rejects(access(join(installed, 'server')), { code: 'ENOENT' });
  const html = await readFile(join(installed, 'ui/workspace.html'), 'utf8');
  assert.match(html, /Help me create my B2B portal with inSitu Sales/);
  assert.doesNotMatch(html, /Local sidebar simulator|localhost:4317|__INSITU_LOGO__/);
});
