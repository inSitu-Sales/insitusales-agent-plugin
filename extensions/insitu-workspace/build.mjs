import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));
const logo = `data:image/png;base64,${(await readFile('assets/insitu-mark.png')).toString('base64')}`;
// Navigation uses MCP tool icons, independently of the plugin directory logo.
await writeFile('server/workspace-brand.cjs', `'use strict';\nmodule.exports = ${JSON.stringify({ src: logo, mimeType: 'image/png', sizes: ['120x120'] })};\n`);
await mkdir('dist', { recursive: true });
for (const [entry, output, host] of [['web/app.jsx', 'workspace.html', false], ['web/host.jsx', 'preview.html', true]]) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', target: 'es2022', minify: true, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } });
  const script = result.outputFiles[0].text.replaceAll('__INSITU_LOGO__', logo).replace(/<\/script/gi, '<\\/script');
  const css = await readFile('web/style.css', 'utf8') + (host ? await readFile('web/host.css', 'utf8') : '');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>inSitu Sales ${host ? 'Chat Extension Preview' : 'Workspace'}</title><style>${css}</style></head><body><div id="root"></div><script type="module">${script}</script></body></html>`;
  await writeFile(`dist/${output}`, html);
  console.log(`Built dist/${output}`);
}
