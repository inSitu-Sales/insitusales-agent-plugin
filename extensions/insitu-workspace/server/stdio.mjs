import { readFile } from 'node:fs/promises';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import extension from './workspace.cjs';
import publication from './publication.cjs';

// The remote connection owns account authentication; local uploads use artifact-scoped grants.
const html = await readFile(new URL('../ui/workspace.html', import.meta.url), 'utf8');
const workspace = extension.createWorkspaceExtension(html);
const releases = publication.createPublicationTools();
const server = new Server({ name: 'insitu-sales-presentation', version: '0.4.1', icons: [extension.BRAND_ICON] }, { capabilities: { tools: {}, resources: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...workspace.tools, ...releases.tools] }));
server.setRequestHandler(CallToolRequestSchema, async ({ params }) => releases.handles(params.name) ? releases.call(params.name, params.arguments) : workspace.call(params.name, params.arguments));
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [workspace.resource] }));
server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => workspace.read(params.uri));
await server.connect(new StdioServerTransport());
