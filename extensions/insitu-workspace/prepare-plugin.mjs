import { cp, mkdir } from 'node:fs/promises';

await import('./build.mjs');
const plugin = new URL('../../plugins/insitu-sales/', import.meta.url);
await mkdir(new URL('ui/', plugin), { recursive: true });
await cp(new URL('./dist/workspace.html', import.meta.url), new URL('ui/workspace.html', plugin));
console.log('Prepared the shared inSitu Sales home page. Production plugins use the remote MCP.');
