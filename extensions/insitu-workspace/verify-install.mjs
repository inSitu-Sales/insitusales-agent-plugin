import { access, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const bundled = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex';
let codex = process.argv[2];
if (!codex) { try { await access(bundled); codex = bundled; } catch { codex = 'codex'; } }
const servers = JSON.parse(execFileSync(codex, ['mcp', 'list', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }));
const homeServer = servers.find((server) => server.name === 'insitu_home');
assert.ok(homeServer?.enabled, 'The selected Codex runtime does not discover the installed inSitu home server. Check the manifest and installed version.');
const { command, args, cwd } = homeServer.transport;
const client = new Client({ name: 'insitu-desktop-install-verification', version: '1' });
const transport = new StdioClientTransport({ command, args, cwd, stderr: 'pipe' });
try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const launcher = tools.find((tool) => tool.name === 'openInsituWorkspace');
  const expectedLogo = await readFile(new URL('./assets/insitu-mark.png', import.meta.url));
  assert.deepEqual(launcher?.icons, [{ src: `data:image/png;base64,${expectedLogo.toString('base64')}`, mimeType: 'image/png', sizes: ['120x120'] }], 'The installed sidebar launcher must advertise the official colored logo');
  assert.deepEqual(client.getServerVersion().icons, launcher.icons, 'Server fallback and launcher icons must agree');
  assert.deepEqual(launcher?._meta['openai/ui'].entrypoints, [{ type: 'global' }, { type: 'thread' }]);
  const resource = await client.readResource({ uri: launcher._meta.ui.resourceUri });
  assert.match(resource.contents[0].text, /Redesign your B2B eCommerce storefront/);
  assert.ok(resource.contents[0].text.includes('Help me create my B2B storefront with inSitu Sales. Guide me step by step and show me a preview'), 'The installed B2B card must use the requested prompt');
  assert.doesNotMatch(resource.contents[0].text, /home-composer|insitu-prompt/);
  const opened = await client.callTool({ name: launcher.name, arguments: {} });
  assert.equal(opened.isError, undefined);
  console.log('PASS: desktop runtime discovers the installed server, both native entrypoints, the official sidebar icon and the current home page.');
  console.log('A desktop app reload and visual sidebar acceptance are separate checks.');
} finally { await client.close(); await transport.close(); }
