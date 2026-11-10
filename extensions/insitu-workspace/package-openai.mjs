import { constants } from 'node:fs';
import { copyFile, cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

if (!process.argv[2]?.endsWith('.zip')) throw new Error('Provide an output ZIP path.');
const output = resolve(process.argv[2]);
const plugin = new URL('../../plugins/insitu-sales/', import.meta.url);
for (const name of ['mcp.json', '.codex-mcp.json']) {
  const { mcpServers } = JSON.parse(await readFile(new URL(name, plugin), 'utf8'));
  if (Object.keys(mcpServers).length !== 1 ||
      mcpServers.insitu_sales?.url !== 'https://api.insitusales.com/mcp' ||
      !['http', 'streamable-http'].includes(mcpServers.insitu_sales?.type) ||
      Object.hasOwn(mcpServers.insitu_sales, 'command')) {
    throw new Error(`${name} must declare only the production HTTPS MCP.`);
  }
}
await mkdir(dirname(output), { recursive: true });
const temporary = await mkdtemp(join(dirname(output), '.insitu-openai-'));
try {
  const staging = join(temporary, 'package');
  await mkdir(staging);
  for (const name of ['plugin.json', 'mcp.json', '.codex-plugin', '.codex-mcp.json', 'skills', 'assets']) {
    await cp(new URL(name, plugin), join(staging, name), { recursive: true });
  }
  const archive = join(temporary, 'plugin.zip');
  execFileSync('zip', ['-q', '-r', archive, '.'], { cwd: staging });
  try { await copyFile(archive, output, constants.COPYFILE_EXCL); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Output archive already exists; choose a new path.');
    throw error;
  }
  console.log(`Prepared OpenAI plugin archive: ${output}`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
