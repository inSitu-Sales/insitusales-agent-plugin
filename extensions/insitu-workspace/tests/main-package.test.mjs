import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('the Claude companion runs its bundled UI without the repository or node_modules', async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), 'insitu-plugin-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const installed = join(temporary, 'plugin');
  await cp(new URL('../../../plugins/insitu-sales/', import.meta.url), installed, { recursive: true });
  const readJson = async (path) => JSON.parse(await readFile(join(installed, path), 'utf8'));
  const manifest = await readJson('.claude-plugin/plugin.json');
  const config = await readJson('.mcp.json');
  assert.equal(config.mcpServers.insitu_sales.url, 'https://api.insitusales.com/mcp');
  assert.deepEqual(await readdir(join(installed, 'skills')), ['insitu-storefront-authoring', 'insitu-workspace']);
  const server = manifest.mcpServers.insitu_home;
  assert.equal(server.command, 'node');
  const transport = new StdioClientTransport({
    command: server.command, args: server.args.map(arg => arg.replaceAll('${CLAUDE_PLUGIN_ROOT}', installed)),
    cwd: installed, stderr: 'pipe', env: { ...process.env, PLUGIN_DATA: join(temporary,'data') },
  });
  const client = new Client({ name: 'main-package-verification', version: '1' });
  try {
    await client.connect(transport);
    assert.equal(client.getServerVersion().version, JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name), ['openInSituWorkspace', 'prepareStorefrontRelease', 'publishStorefrontRelease', 'registerStorefrontProject', 'listStorefrontProjects']);
    for (const name of ['registerStorefrontProject', 'listStorefrontProjects']) {
      const descriptor = tools.find(tool => tool.name === name);
      assert.equal(descriptor._meta?.ui?.resourceUri, undefined, `${name} must not launch a new UI`);
      assert.equal(descriptor._meta?.['openai/outputTemplate'], undefined);
    }
    assert.deepEqual(tools.find(tool => tool.name === 'listStorefrontProjects')._meta.ui.visibility, ['model']);
    const blocked = await client.callTool({name:'prepareStorefrontRelease',arguments:{path:join(temporary,'missing.zip')}});
    assert.equal(blocked.isError,true);
    assert.equal(blocked.structuredContent.code,'LOCAL_FILE_ACCESS');
    assert.equal(blocked.structuredContent.outcome,'not_started');
    const registered = await client.callTool({name:'registerStorefrontProject',arguments:{companyId:'1',name:'Fixture',path:temporary}});
    assert.equal(registered.isError,undefined);
    assert.equal(registered.structuredContent.projects.length,1);
    const launcher = tools[0];
    assert.equal(launcher._meta['openai/ui'], undefined);
    const result = await client.callTool({ name: launcher.name, arguments: {} });
    assert.equal(result.isError, undefined);
    const resource = await client.readResource({ uri: launcher._meta.ui.resourceUri });
    assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
    assert.match(resource.contents[0].text, /Help me create my B2B portal with inSitu Sales/);
    assert.doesNotMatch(resource.contents[0].text, /Local sidebar simulator|localhost:4317|__INSITU_LOGO__/);

  } finally { await client.close(); await transport.close(); }
});
