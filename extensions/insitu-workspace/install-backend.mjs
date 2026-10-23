import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Provide the backend repository path.');
const apply = process.argv.includes('--apply');
const root = fileURLToPath(new URL('.', import.meta.url));
const target = join(backend, 'mcp/graphql-mcp.http.js');
let source = await readFile(target, 'utf8');
if (source.includes('MCP_WORKSPACE_EXTENSION_ENABLED') && !process.argv.includes('--update')) {
  throw new Error('Workspace integration already exists; review it before changing it.');
}
function replaceOnce(before, after) {
  if (source.split(before).length !== 2) throw new Error(`Backend source changed; inspect integration anchor: ${before.slice(0, 80)}`);
  source = source.replace(before, after);
}
if (!source.includes('MCP_WORKSPACE_EXTENSION_ENABLED')) {
replaceOnce("const { randomUUID } = require('crypto');", "const { randomUUID } = require('crypto');\nconst { readFileSync } = require('fs');\nconst { join } = require('path');\nconst { createWorkspaceExtension, TOOL_NAME: WORKSPACE_TOOL_NAME } = require('./workspace-extension');");
replaceOnce('  CallToolRequestSchema,\n  isInitializeRequest', '  CallToolRequestSchema,\n  ListResourcesRequestSchema,\n  ReadResourceRequestSchema,\n  isInitializeRequest');
replaceOnce('function createMcpServer(options = {}) {', `function createMcpServer(options = {}) {
  // Opt in on a development endpoint before refreshing ChatGPT discovery.
  const workspace = process.env.MCP_WORKSPACE_EXTENSION_ENABLED === 'true'
    ? createWorkspaceExtension(readFileSync(join(__dirname, 'ui/insitu-workspace.html'), 'utf8'))
    : null;`);
replaceOnce('{ capabilities: { tools: {} }, instructions: MCP_SERVER_INSTRUCTIONS }', '{ capabilities: { tools: {}, ...(workspace ? { resources: {} } : {}) }, instructions: MCP_SERVER_INSTRUCTIONS }');
replaceOnce('      return action ? { ...tool, name: action } : tool;\n    })', '      return action ? { ...tool, name: action } : tool;\n    }).concat(workspace ? [workspace.tool] : [])');
replaceOnce('  server.setRequestHandler(CallToolRequestSchema, async (request) => {\n    const toolName = request.params.name;', `  if (workspace) {
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [workspace.resource] }));
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => workspace.read(request.params.uri));
  }

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    if (workspace && toolName === WORKSPACE_TOOL_NAME) {
      return workspace.call(request.params.arguments);
    }`);
}
if (!source.includes('workspaceCompanyId')) {
replaceOnce("  const workspace = process.env.MCP_WORKSPACE_EXTENSION_ENABLED === 'true'\n    ? createWorkspaceExtension(readFileSync(join(__dirname, 'ui/insitu-workspace.html'), 'utf8'))\n    : null;", "  let workspaceCompanyId = null;");
replaceOnce('    storefrontPilot = isPublicationPilot(jwt.verify(token, CONFIG.jwt_encryption));', '    const claims = jwt.verify(token, CONFIG.jwt_encryption);\n    storefrontPilot = isPublicationPilot(claims);\n    workspaceCompanyId = claims.company_id ?? null;');
replaceOnce("  const queryFields = process.env.MCP_ALLOWED_QUERY_FIELDS || DEFAULT_ALLOWED_QUERY_FIELDS;", "  const workspace = process.env.MCP_WORKSPACE_EXTENSION_ENABLED === 'true'\n    ? createWorkspaceExtension(readFileSync(join(__dirname, 'ui/insitu-workspace.html'), 'utf8'), { companyId: workspaceCompanyId })\n    : null;\n  const queryFields = process.env.MCP_ALLOWED_QUERY_FIELDS || DEFAULT_ALLOWED_QUERY_FIELDS;");
replaceOnce('.concat(workspace ? [workspace.tool] : [])', '.concat(workspace ? workspace.tools : [])');
replaceOnce('if (workspace && toolName === WORKSPACE_TOOL_NAME) {\n      return workspace.call(request.params.arguments);', 'if (workspace && workspace.handles(toolName)) {\n      return workspace.call(toolName, request.params.arguments);');
replaceOnce('createWorkspaceExtension, TOOL_NAME: WORKSPACE_TOOL_NAME', 'createWorkspaceExtension');
}
const moduleTarget = join(backend, 'mcp/workspace-extension.js');
const brandTarget = join(backend, 'mcp/workspace-brand.cjs');
const assetTarget = join(backend, 'mcp/ui/insitu-workspace.html');
for (const path of process.argv.includes('--update') ? [] : [moduleTarget, brandTarget, assetTarget]) {
  try { await access(path); throw new Error(`Refusing to overwrite existing file: ${path}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const [moduleSource, brandSource, html] = await Promise.all([
  readFile(join(root, 'server/workspace.cjs'), 'utf8'),
  readFile(join(root, 'server/workspace-brand.cjs'), 'utf8'),
  readFile(join(root, 'dist/workspace.html'), 'utf8')
]);
if (!apply) {
  console.log('Validated integration anchors. No files changed.');
  console.log('Would add mcp/workspace-extension.js, mcp/workspace-brand.cjs and mcp/ui/insitu-workspace.html, and update mcp/graphql-mcp.http.js.');
  console.log('Run again with --apply to install; the feature remains disabled until MCP_WORKSPACE_EXTENSION_ENABLED=true.');
} else {
  await mkdir(join(backend, 'mcp/ui'), { recursive: true });
  await writeFile(moduleTarget, moduleSource, { flag: process.argv.includes('--update') ? 'w' : 'wx' });
  await writeFile(brandTarget, brandSource, { flag: process.argv.includes('--update') ? 'w' : 'wx' });
  await writeFile(assetTarget, html, { flag: process.argv.includes('--update') ? 'w' : 'wx' });
  await writeFile(target, source);
  console.log('Installed workspace integration. Feature flag is off by default. No service restarted or deployed.');
}
