import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const plugin = new URL('../../../plugins/insitu-sales/', import.meta.url);

test('Claude connects only to the production HTTPS MCP', async () => {
  const manifest = JSON.parse(await readFile(new URL('.claude-plugin/plugin.json', plugin), 'utf8'));
  assert.equal(manifest.mcpServers, undefined, 'Use the default remote .mcp.json without inline local servers');
  const config = JSON.parse(await readFile(new URL('.mcp.json', plugin), 'utf8'));
  assert.deepEqual(Object.keys(config.mcpServers), ['insitu_sales']);
  assert.deepEqual(Object.keys(config.mcpServers.insitu_sales).sort(), ['type', 'url'], 'Claude directory accepts only documented server fields');
  assert.equal(config.mcpServers.insitu_sales.type, 'http');
  assert.equal(config.mcpServers.insitu_sales.url, 'https://api.insitusales.com/mcp');
  assert.doesNotMatch(JSON.stringify(config), /"command"|"stdio"/);
});

test('Claude ZIP publication uses documented steps without a script, local MCP tools or a project registry', async () => {
  const skill = await readFile(new URL('skills/insitu-storefront-authoring/SKILL.md', plugin), 'utf8');
  assert.match(skill, /Publish with \[the upload procedure\]\(upload\.md\)/);
  assert.doesNotMatch(skill, /upload-storefront|node <helper-path>|bundled script/);
  const manual = await readFile(new URL('skills/insitu-storefront-authoring/upload.md', plugin), 'utf8');
  assert.match(manual, /https:\/\/api\.insitusales\.com\/api\/v1\/b2b-ecommerce\/authorized-releases/);
  assert.match(manual, /--header @-/);
  assert.match(manual, /X-Storefront-Upload-Authorization/);
  assert.match(skill, /Do not start or install a local MCP/);
  assert.match(manual, /## Check the connection/);
  assert.match(manual, /--header 'X-Storefront-Upload-Authorization: <grant.authorization>'/);
  assert.doesNotMatch(skill, /prepareStorefrontRelease|publishStorefrontRelease|registerStorefrontProject|listStorefrontProjects|local MCP transport/);
});
