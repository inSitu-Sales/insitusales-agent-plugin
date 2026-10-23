import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('the standalone development package launches outside the source tree and pairs native UI with the registered inSitu connection', async (t) => {
  const root = new URL('../local-marketplace/plugins/insitu-home-dev/', import.meta.url);
  let manifest;
  try { manifest = JSON.parse(await readFile(new URL('.codex-plugin/plugin.json', root), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') { t.skip('Run node prepare-dev-plugin.mjs first.'); return; } throw error; }
  assert.equal(manifest.apps, './.app.json');
  assert.equal(manifest.mcpServers, './.mcp.json');
  const config = JSON.parse(await readFile(new URL('.mcp.json', root), 'utf8'));
  const server = config.mcpServers.insitu_home;
  assert.equal(server.command, 'node', 'Use a bare executable name accepted by both plugin loaders');
  const configuredClient = new Client({ name: 'development-config-test', version: '1' });
  const configuredTransport = new StdioClientTransport({
    command: server.command, args: server.args,
    cwd: resolve(fileURLToPath(root), server.cwd), stderr: 'pipe',
  });
  try {
    await configuredClient.connect(configuredTransport);
    const result = await configuredClient.callTool({ name: 'openInsituWorkspace', arguments: {} });
    assert.equal(result.isError, undefined);
  } finally { await configuredClient.close(); await configuredTransport.close(); }
  const mapping = JSON.parse(await readFile(new URL('.app.json', root), 'utf8'));
  assert.equal(mapping.apps['app-6a7ca3b899bc81918a6ab1af007a82d6'].id, 'asdk_app_6a7ca3b899bc81918a6ab1af007a82d6');
  const client = new Client({ name: 'development-install-test', version: '1' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('server/server.mjs', root))], cwd: tmpdir(), stderr: 'pipe' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 2);
    const launcher = tools.find((tool) => tool.name === 'openInsituWorkspace');
    const logo = await readFile(new URL('../assets/insitu-mark.png', import.meta.url));
    assert.deepEqual(launcher.icons, [{ src: `data:image/png;base64,${logo.toString('base64')}`, mimeType: 'image/png', sizes: ['120x120'] }]);
    assert.deepEqual(client.getServerVersion().icons, launcher.icons);
    assert.deepEqual(launcher._meta['openai/ui'].entrypoints, [{ type: 'global' }, { type: 'thread' }]);
    const result = await client.callTool({ name: launcher.name, arguments: {} });
    assert.equal(result.isError, undefined);
    assert.equal(result.structuredContent.data, null);
    assert.equal(result.structuredContent.scope.companyId, null);
    const ui = await client.readResource({ uri: launcher._meta.ui.resourceUri });
    assert.match(ui.contents[0].text, /Redesign your B2B eCommerce storefront/);
    assert.doesNotMatch(ui.contents[0].text, /home-composer|insitu-prompt/);
    assert.doesNotMatch(ui.contents[0].text, /Local sidebar simulator/);
  } finally { await client.close(); await transport.close(); }
});
