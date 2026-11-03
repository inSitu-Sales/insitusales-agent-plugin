import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Commit these generated files: marketplace installation does not run npm or
// compile source outside plugins/insitu-sales. No node_modules are needed at runtime.
await import('./build.mjs');
const plugin = new URL('../../plugins/insitu-sales/', import.meta.url);
await mkdir(new URL('ui/', plugin), { recursive: true });
await mkdir(new URL('server/', plugin), { recursive: true });
await cp(new URL('./dist/workspace.html', import.meta.url), new URL('ui/workspace.html', plugin));
await build({
  entryPoints: [fileURLToPath(new URL('./server/stdio.mjs', import.meta.url))],
  outfile: fileURLToPath(new URL('server/server.mjs', plugin)),
  bundle: true, platform: 'node', format: 'esm', target: 'node22', minify: true,
  legalComments: 'linked',
  banner: { js: 'import { createRequire as _createRequire } from "node:module"; const require = _createRequire(import.meta.url);' },
});
console.log('Prepared the main inSitu Sales plugin: local presentation MCP and compiled home page.');
