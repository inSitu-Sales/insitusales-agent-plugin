import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const marketplace = join(root, 'local-marketplace');
const plugin = join(marketplace, 'plugins/insitu-home-dev');
const sourcePlugin = fileURLToPath(new URL('../../plugins/insitu-sales/', import.meta.url));
for (const path of ['.codex-plugin', 'server', 'ui', 'assets']) await mkdir(join(plugin, path), { recursive: true });
await mkdir(join(marketplace, '.agents/plugins'), { recursive: true });
const writeJson = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n');
const ui = await readFile(join(root, 'dist/workspace.html'), 'utf8');
await writeFile(join(plugin, 'ui/workspace.html'), ui);
await cp(join(sourcePlugin, 'assets'), join(plugin, 'assets'), { recursive: true });
await cp(join(root, 'assets/insitu-mark.png'), join(plugin, 'assets/insitu-mark.png'));
await cp(join(sourcePlugin, 'skills'), join(plugin, 'skills'), { recursive: true });
await build({
  entryPoints: [join(root, 'server/stdio.mjs')], outfile: join(plugin, 'server/server.mjs'),
  bundle: true, platform: 'node', format: 'esm', target: 'node22',
  banner: { js: 'import { createRequire as _createRequire } from "node:module"; const require = _createRequire(import.meta.url);' },
});
const presentation = {
  displayName: 'inSitu Sales Home (Dev)', shortDescription: 'Chat with inSitu and redesign your B2B storefront.',
  longDescription: 'Development home page paired with your existing authenticated inSitu Sales connection.',
  developerName: 'inSitu Sales', category: 'Business & Operations', capabilities: ['MCP', 'Interactive'],
  websiteURL: 'https://www.insitusales.com/', privacyPolicyURL: 'https://www.insitusales.com/en/end-user-license-agreement/',
  termsOfServiceURL: 'https://www.insitusales.com/en/end-user-license-agreement/',
  composerIcon: './assets/insitu-mark.png', logo: './assets/insitu-mark.png', brandColor: '#2395F6',
  defaultPrompt: ['Open the inSitu Sales home page.', 'Use inSitu Sales to show my connected company and find a customer.'],
};
const manifest = {
  name: 'insitu-home-dev', version: '0.4.1-dev.5', description: presentation.longDescription,
  author: { name: 'inSitu Sales', url: 'https://www.insitusales.com/' },
};
// Use the compatibility layout supported by the desktop's local MCP loader.
// The portable root manifest took precedence over the compatibility manifest
// in desktop runtime 0.163, which skipped this bundled presentation server.
await rm(join(plugin, 'plugin.json'), { force: true });
await rm(join(plugin, 'mcp.json'), { force: true });
await writeJson(join(plugin, '.codex-plugin/plugin.json'), {
  ...manifest, apps: './.app.json', mcpServers: './.mcp.json', skills: './skills/', interface: presentation,
});
// This Codex build resolves relative cwd against the installed plugin root.
// Its compatibility loader leaves ${PLUGIN_ROOT} literal, so use that
// supported relative form for both the working directory and entry script.
// Use a bare executable name: the Agent Plugins loader rejects absolute paths.
const server = { type: 'stdio', command: 'node', args: ['./server/server.mjs'], cwd: '.' };
await writeJson(join(plugin, '.mcp.json'), { mcpServers: { insitu_home: server } });
// Same mapping as the installed public inSitu Sales plugin. No credentials are
// copied; the host resolves the user's existing account connection.
await writeJson(join(plugin, '.app.json'), {
  apps: { 'app-6a7ca3b899bc81918a6ab1af007a82d6': { id: 'asdk_app_6a7ca3b899bc81918a6ab1af007a82d6', required: true } },
});
await writeJson(join(marketplace, '.agents/plugins/marketplace.json'), {
  name: 'insitu-development', interface: { displayName: 'inSitu Development' },
  plugins: [{ name: manifest.name, source: { source: 'local', path: './plugins/insitu-home-dev' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Business & Operations' }],
});
console.log(`Prepared local marketplace: ${marketplace}`);
console.log('The home page uses local presentation tools and the existing registered inSitu connection.');
