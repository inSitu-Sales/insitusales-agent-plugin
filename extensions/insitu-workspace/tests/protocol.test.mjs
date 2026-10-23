import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'node:fs/promises';
import extension from '../server/workspace.cjs';
import { fixtures } from '../web/fixtures.mjs';

test('a real MCP client discovers the UI, receives a render result, and reads bundled HTML', async () => {
  const html = await readFile(new URL('../dist/workspace.html', import.meta.url), 'utf8');
  const workspace = extension.createWorkspaceExtension(html, { companyId: 123 });
  const server = new Server({ name: 'workspace-test', version: '1' }, { capabilities: { tools: {}, resources: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: workspace.tools }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => workspace.call(params.name, params.arguments));
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [workspace.resource] }));
  server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => workspace.read(params.uri));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'workspace-client', version: '1' });
  try {
    await server.connect(serverTransport); await client.connect(clientTransport);
    const list = await client.listTools();
    assert.equal(list.tools.length, 2);
    assert.deepEqual(list.tools.find((tool) => tool.name === extension.TOOL_NAME)._meta['openai/ui'].entrypoints, [{ type: 'global' }, { type: 'thread' }]);
    const result = await client.callTool({ name: 'renderInsituPortalPlan', arguments: fixtures.portal });
    assert.equal(result.structuredContent.data.hostname, 'acme.example.com');
    assert.equal(result.structuredContent.scope.companyId, '123');
    const resources = await client.listResources();
    assert.equal(resources.resources[0].uri, extension.RESOURCE_URI);
    const resource = await client.readResource({ uri: extension.RESOURCE_URI });
    assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
    assert.match(resource.contents[0].text, /inSitu Sales/);
    assert.doesNotMatch(resource.contents[0].text, /__INSITU_LOGO__|localhost:4317/);
    const invalid = await client.callTool({ name: 'renderInsituPortalPlan', arguments: { ...fixtures.portal, hostname: 'invalid' } });
    assert.equal(invalid.isError, true);
    await assert.rejects(() => client.readResource({ uri: 'file:///etc/passwd' }));
  } finally { await client.close(); await server.close(); }
});
