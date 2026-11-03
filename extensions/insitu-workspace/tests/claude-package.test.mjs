import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('the Claude package transfers a ZIP through its configured local MCP outside the plugin directory', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'insitu claude '));
  t.after(() => rm(temporary, {recursive:true, force:true}));
  const installed = join(temporary, 'installed plugin');
  const dataRoot = join(temporary, 'plugin data');
  await cp(new URL('../../../plugins/insitu-sales/', import.meta.url), installed, {recursive:true});
  const manifest = JSON.parse(await readFile(join(installed, '.claude-plugin/plugin.json'), 'utf8'));
  const remote = JSON.parse(await readFile(join(installed, '.mcp.json'), 'utf8'));
  assert.equal(remote.mcpServers.insitu_sales.url, 'https://api.insitusales.com/mcp');
  const server = manifest.mcpServers?.insitu_home;
  assert.ok(server, 'Claude must declare the local MCP in its own manifest');
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/server/server.mjs']);
  assert.deepEqual(server.env, {PLUGIN_DATA:'${CLAUDE_PLUGIN_DATA}'});
  const expand = value => value.replaceAll('${CLAUDE_PLUGIN_ROOT}', installed).replaceAll('${CLAUDE_PLUGIN_DATA}', dataRoot);
  const archive = Buffer.from('synthetic ZIP transport fixture');
  const zipPath = join(temporary, 'storefront.zip');
  await writeFile(zipPath, archive);
  const digest = createHash('sha256').update(archive).digest('hex');
  const preload = join(temporary, 'publication-fixture.mjs');
  await writeFile(preload, `
    import https from 'node:https';
    import assert from 'node:assert/strict';
    import {EventEmitter} from 'node:events';
    let uploads = 0;
    https.request = (url, options, callback) => {
      assert.equal(url, 'https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases');
      const request = new EventEmitter();
      request.setTimeout = () => {};
      request.end = body => {
        const response = Object.assign(new EventEmitter(), {headers:{},resume(){}});
        if(options.method === 'HEAD') {
          assert.equal(options.headers, undefined);
          assert.equal(body, undefined);
          response.statusCode = 204;
          callback(response);
        } else {
          assert.equal(options.method, 'POST');
          assert.equal(++uploads, 1);
          assert.equal(options.headers['X-Storefront-Upload-Authorization'], 'b'.repeat(64));
          assert.ok(body.includes(Buffer.from('synthetic ZIP transport fixture')));
          response.statusCode = 200;
          callback(response);
          response.emit('data', Buffer.from(JSON.stringify({status:'active',stage:'complete',hostname:'fixture.example.com',release:{digest:'${digest}',siteId:'c'.repeat(32)}})));
          response.emit('end');
        }
      };
      return request;
    };
  `);
  const transport = new StdioClientTransport({
    command:server.command, args:['--import',preload,...server.args.map(expand)],
    cwd:tmpdir(), stderr:'pipe', env:{...process.env,...Object.fromEntries(Object.entries(server.env).map(([key,value])=>[key,expand(value)]))},
  });
  const client = new Client({name:'claude-package-test', version:'1'});
  try {
    await client.connect(transport);
    const {tools} = await client.listTools();
    for(const name of ['prepareStorefrontRelease','publishStorefrontRelease','registerStorefrontProject','listStorefrontProjects']) {
      const tool = tools.find(tool=>tool.name === name);
      assert.ok(tool, name);
      assert.equal(tool._meta.ui.resourceUri, undefined);
    }
    const registered = await client.callTool({name:'registerStorefrontProject', arguments:{companyId:'1',name:'Fixture',path:temporary}});
    assert.equal(registered.isError, undefined);
    const projectId = registered.structuredContent.projects[0].id;
    const prepared = await client.callTool({name:'prepareStorefrontRelease', arguments:{path:zipPath,projectId}});
    assert.equal(prepared.isError, undefined);
    assert.equal(prepared.structuredContent.digest, digest);
    const artifactId = prepared.structuredContent.artifactId;
    const grant = {uploadUrl:'https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases',authorization:'b'.repeat(64),hostname:'fixture.example.com',digest,size:archive.length,expiresAt:new Date(Date.now()+60000).toISOString()};
    const published = await client.callTool({name:'publishStorefrontRelease',arguments:{artifactId,grant}});
    assert.equal(published.isError, undefined);
    assert.equal(published.structuredContent.status, 'active');
    assert.equal((await client.callTool({name:'publishStorefrontRelease',arguments:{artifactId,grant}})).isError, true);
    const saved = await client.callTool({name:'listStorefrontProjects',arguments:{}});
    assert.equal(saved.structuredContent.projects[0].lastConfirmedPublication.hostname, grant.hostname);
    assert.doesNotMatch(JSON.stringify(saved), /bbbbbbbb|authorization/);
  } finally { await client.close(); await transport.close(); }
});
