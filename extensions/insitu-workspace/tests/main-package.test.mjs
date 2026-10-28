import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fixtures } from '../web/fixtures.mjs';

test('the main plugin runs its bundled UI without the repository or node_modules', async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), 'insitu-plugin-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const installed = join(temporary, 'plugin');
  await cp(new URL('../../../plugins/insitu-sales/', import.meta.url), installed, { recursive: true });
  const readJson = async (path) => JSON.parse(await readFile(join(installed, path), 'utf8'));
  const manifest = await readJson('.codex-plugin/plugin.json');
  const config = await readJson(manifest.mcpServers);
  assert.equal(config.mcpServers.insitu_sales.url, 'https://api.insitusales.com/mcp');
  assert.deepEqual(await readdir(join(installed, 'skills')), ['insitu-storefront-authoring', 'insitu-workspace']);
  const server = config.mcpServers.insitu_home;
  assert.equal(server.command, 'node');
  const transport = new StdioClientTransport({
    command: server.command, args: server.args,
    cwd: resolve(installed, server.cwd), stderr: 'pipe',
  });
  const client = new Client({ name: 'main-package-verification', version: '1' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name), ['openInsituWorkspace', 'renderInsituPortalPlan', 'prepareStorefrontRelease', 'publishStorefrontRelease', 'authorizeLocalStorefrontRelease', 'reviewStorefrontRelease', 'confirmStorefrontRelease']);
    const blocked = await client.callTool({name:'prepareStorefrontRelease',arguments:{path:join(temporary,'missing.zip')}});
    assert.equal(blocked.isError,true);
    assert.equal(blocked.structuredContent.code,'LOCAL_FILE_ACCESS');
    assert.equal(blocked.structuredContent.outcome,'not_started');
    const launcher = tools[0];
    assert.deepEqual(launcher._meta['openai/ui'].entrypoints, [{ type: 'global' }, { type: 'thread' }]);
    const result = await client.callTool({ name: launcher.name, arguments: {} });
    assert.equal(result.isError, undefined);
    const resource = await client.readResource({ uri: launcher._meta.ui.resourceUri });
    assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
    assert.match(resource.contents[0].text, /Help me create my B2B storefront with inSitu Sales/);
    assert.doesNotMatch(resource.contents[0].text, /Local sidebar simulator|localhost:4317|__INSITU_LOGO__/);
    const preview = await client.callTool({ name: 'renderInsituPortalPlan', arguments: fixtures.portal });
    assert.equal(preview.isError, undefined);
    assert.equal(preview.structuredContent.data.hostname, fixtures.portal.hostname);
    assert.equal(preview.structuredContent.scope.companyId, null);
  } finally { await client.close(); await transport.close(); }
});
