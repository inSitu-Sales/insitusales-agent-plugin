import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { join } from 'node:path';
import extension from '../server/workspace.cjs';
import { fixtures } from '../web/fixtures.mjs';

test('backend registration preserves legacy tools, scopes display results, and obeys the feature flag', async (t) => {
  const backendUrl = process.env.INSITU_BACKEND_ROOT
    ? new URL(`file://${process.env.INSITU_BACKEND_ROOT}/mcp/graphql-mcp.http.js`)
    : new URL('../../../../st_backend_insitusales_b2bportal/mcp/graphql-mcp.http.js', import.meta.url);
  let source;
  try { source = await readFile(backendUrl, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') { t.skip('Backend checkout is not present; set INSITU_BACKEND_ROOT to test integration.'); return; } throw error; }
  const start = source.indexOf('function createMcpServer(options = {}) {');
  const end = source.indexOf('// Validate that a session ID', start);
  assert.ok(start >= 0 && end > start);
  let graphqlCalls = 0;
  class FakeServer {
    constructor(identity, options) { this.options = options; this.handlers = new Map(); }
    setRequestHandler(schema, callback) { this.handlers.set(schema, callback); }
  }
  function make(enabled) {
    const context = {
      process: { env: { MCP_WORKSPACE_EXTENSION_ENABLED: String(enabled) } },
      Server: FakeServer, readFileSync: () => '<!doctype html><title>Workspace</title>', join, __dirname: '/mcp',
      createWorkspaceExtension: extension.createWorkspaceExtension,
      jwt: { verify: (token) => ({ company_id: token === 'account-two' ? 2 : 1 }) }, CONFIG: { jwt_encryption: 'test-only' },
      isPublicationPilot: () => false, storefrontQueries: {}, storefrontMutations: {}, storefrontActions: {}, storefrontTools: new Set(),
      DEFAULT_ALLOWED_QUERY_FIELDS: ['getAllCustomer'], DEFAULT_ALLOWED_MUTATION_FIELDS: ['createOrUpdateOrder'], DEFAULT_ALLOWED_OPERATION_TYPES: ['query', 'mutation'],
      schema: {}, MCP_NAME: 'test', MCP_VERSION: '1', MCP_SERVER_INSTRUCTIONS: 'test',
      ListToolsRequestSchema: 'list', CallToolRequestSchema: 'call', ListResourcesRequestSchema: 'resources', ReadResourceRequestSchema: 'read',
      buildToolRegistry: () => ({ tools: [{ name: 'graphql_query_getAllCustomer' }, { name: 'graphql_mutation_createOrUpdateOrder' }], buildOperation: () => { graphqlCalls++; throw new Error('legacy-dispatch-reached'); } }),
      createApolloClient: () => ({}), toolError: (error) => ({ isError: true, content: [{ type: 'text', text: error.message }] })
    };
    return vm.runInNewContext(`(${source.slice(start, end).trim()})`, context);
  }
  const disabled = make(false)({ transportAuthToken: 'account-one' });
  assert.equal((await disabled.handlers.get('list')()).tools.length, 2);
  assert.equal(disabled.handlers.has('resources'), false);
  const a = make(true)({ transportAuthToken: 'account-one' });
  const b = make(true)({ transportAuthToken: 'account-two' });
  assert.equal((await a.handlers.get('list')()).tools.length, 4);
  assert.equal((await a.handlers.get('resources')()).resources[0].uri, extension.RESOURCE_URI);
  const request = { params: { name: 'renderInsituPortalPlan', arguments: fixtures.portal } };
  assert.equal((await a.handlers.get('call')(request)).structuredContent.scope.companyId, '1');
  assert.equal((await b.handlers.get('call')(request)).structuredContent.scope.companyId, '2');
  assert.equal(graphqlCalls, 0);
  const legacy = await a.handlers.get('call')({ params: { name: 'graphql_query_getAllCustomer', arguments: {} } });
  assert.equal(graphqlCalls, 1);
  assert.match(legacy.content[0].text, /legacy-dispatch-reached/);
});
