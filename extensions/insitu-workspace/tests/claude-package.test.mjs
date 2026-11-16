import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const plugin = new URL('../../../plugins/insitu-sales/', import.meta.url);

test('Claude connects only to the production HTTPS MCP', async () => {
  const manifest = JSON.parse(await readFile(new URL('.claude-plugin/plugin.json', plugin), 'utf8'));
  assert.equal(manifest.mcpServers, undefined, 'Use the default remote .mcp.json without inline local servers');
  const config = JSON.parse(await readFile(new URL('.mcp.json', plugin), 'utf8'));
  assert.deepEqual(Object.keys(config.mcpServers), ['insitu_sales']);
  assert.equal(config.mcpServers.insitu_sales.type, 'http');
  assert.equal(config.mcpServers.insitu_sales.url, 'https://api.insitusales.com/mcp');
  assert.doesNotMatch(JSON.stringify(config), /"command"|"stdio"/);
});

test('Claude ZIP publication uses the packaged helper without local MCP tools or a project registry', async () => {
  const skill = await readFile(new URL('skills/insitu-storefront-authoring/SKILL.md', plugin), 'utf8');
  assert.match(skill, /OpenAI and Claude installations use the bundled upload script/);
  assert.match(skill, /scripts\/upload-storefront\.js/);
  assert.match(skill, /Do not start or install a local MCP/);
  assert.match(skill, /--prepare/);
  assert.match(skill, /--check-connection/);
  assert.match(skill, /--publish/);
  assert.match(skill, /JSON on stdin/);
  assert.doesNotMatch(skill, /prepareStorefrontRelease|publishStorefrontRelease|registerStorefrontProject|listStorefrontProjects|local MCP transport/);
});
