import { readFile } from 'node:fs/promises';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import extension from './workspace.cjs';

// Bundled into the local development plugin. It handles presentation only;
// the registered inSitu connection owns authentication and business operations.
const html = await readFile(new URL('../ui/workspace.html', import.meta.url), 'utf8');
const workspace = extension.createWorkspaceExtension(html);
const server = new Server({ name: 'insitu-home-development', version: '0.4.1', icons: [extension.BRAND_ICON] }, { capabilities: { tools: {}, resources: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: workspace.tools }));
server.setRequestHandler(CallToolRequestSchema, async ({ params }) => workspace.call(params.name, params.arguments));
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [workspace.resource] }));
server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => workspace.read(params.uri));
await server.connect(new StdioServerTransport());
