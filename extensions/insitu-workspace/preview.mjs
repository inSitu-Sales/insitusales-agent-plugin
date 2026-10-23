import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import extension from './server/workspace.cjs';
const files = { '/': 'preview.html', '/sidebar': 'preview.html', '/widget': 'workspace.html' };
const port = Number(process.env.INSITU_PREVIEW_PORT || 4317);
createServer(async (request, response) => {
  try {
    if (request.url === '/mcp' && request.method === 'POST') {
      if (request.headers.origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(request.headers.origin)) { response.writeHead(403).end(); return; }
      let size = 0; const chunks = [];
      for await (const chunk of request) { size += chunk.length; if (size > 1_000_000) { response.writeHead(413).end(); return; } chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const workspace = extension.createWorkspaceExtension(await readFile(new URL('./dist/workspace.html', import.meta.url), 'utf8'));
      const server = new Server({ name: 'insitu-workspace-development', version: '0.4.1' }, { capabilities: { tools: {}, resources: {} } });
      server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: workspace.tools }));
      server.setRequestHandler(CallToolRequestSchema, async ({ params }) => workspace.call(params.name, params.arguments));
      server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [workspace.resource] }));
      server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => workspace.read(params.uri));
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      response.on('close', () => { transport.close(); server.close(); });
      await server.connect(transport); await transport.handleRequest(request, response, body); return;
    }
    if (!Object.hasOwn(files, request.url) || request.method !== 'GET') { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    response.end(await readFile(new URL(`./dist/${files[request.url]}`, import.meta.url)));
  } catch { if (!response.headersSent) response.writeHead(400).end('Request could not be handled.'); }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}\nDevelopment MCP: http://127.0.0.1:${port}/mcp (presentation tools only)`));
