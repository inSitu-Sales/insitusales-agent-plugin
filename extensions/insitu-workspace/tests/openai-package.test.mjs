import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const plugin = new URL('../../../plugins/insitu-sales/', import.meta.url);
const packager = fileURLToPath(new URL('../package-openai.mjs', import.meta.url));

test('OpenAI installations connect through HTTPS without starting a local MCP', async () => {
  for (const file of ['mcp.json', '.codex-mcp.json']) {
    const config = JSON.parse(await readFile(new URL(file, plugin), 'utf8'));
    assert.deepEqual(Object.keys(config.mcpServers), ['insitu_sales']);
    const server = config.mcpServers.insitu_sales;
    assert.equal(server.url, 'https://api.insitusales.com/mcp');
    assert.ok(['http', 'streamable-http'].includes(server.type));
    assert.equal(server.command, undefined);
  }
});

test('the OpenAI archive contains skills and the upload helper without command MCP manifests', async t => {
  const root = await mkdtemp(join(tmpdir(), 'insitu-openai-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const archive = join(root, 'plugin.zip');
  execFileSync(process.execPath, [packager, archive]);
  const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
  assert.ok(entries.includes('.codex-plugin/plugin.json'));
  assert.ok(entries.includes('plugin.json'));
  for (const skill of ['insitu-storefront-authoring', 'insitu-workspace']) {
    assert.ok(entries.includes(`skills/${skill}/SKILL.md`));
  }
  assert.ok(entries.includes('skills/insitu-storefront-authoring/scripts/upload-storefront.js'));
  assert.ok(entries.every(file => !/^(server|ui|\.claude-plugin|\.cursor-plugin|node_modules)\//.test(file)));
  const readJson = file => JSON.parse(execFileSync('unzip', ['-p', archive, file], { encoding: 'utf8' }));
  const manifest = readJson('.codex-plugin/plugin.json');
  const original = JSON.parse(await readFile(new URL('.codex-plugin/plugin.json', plugin), 'utf8'));
  assert.equal(manifest.name, original.name);
  assert.equal(manifest.version, original.version);
  for (const file of ['mcp.json', manifest.mcpServers.replace(/^\.\//, '')]) {
    assert.deepEqual(Object.keys(readJson(file).mcpServers), ['insitu_sales']);
    assert.doesNotMatch(JSON.stringify(readJson(file)), /"command"|"stdio"/);
  }
});

test('packaging preserves an existing archive instead of overwriting it', async t => {
  const root = await mkdtemp(join(tmpdir(), 'insitu-openai-existing-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const archive = join(root, 'plugin.zip');
  await writeFile(archive, 'existing release');
  const result = spawnSync(process.execPath, [packager, archive], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(await readFile(archive, 'utf8'), 'existing release');
  assert.match(result.stderr, /already exists/);
});

test('the OpenAI skill routes ZIP requests to its script without requiring local MCP tools', async () => {
  const skill = await readFile(new URL('skills/insitu-storefront-authoring/SKILL.md', plugin), 'utf8');
  const description = skill.split('\n').find(line => line.startsWith('description:'));
  assert.match(description, /publish.*ZIP/i);
  assert.match(description, /subir.*ZIP/i);
  assert.match(skill, /OpenAI installations use the bundled upload script/);
  assert.match(skill, /Do not start or install a local MCP/);
  assert.match(skill, /If the selected transport is the script.*--publish/s);
  assert.doesNotMatch(skill, /then call publishStorefrontRelease/);
});

test('the packaged script prepares, checks and publishes a ZIP using an artifact grant on stdin', async t => {
  const root = await mkdtemp(join(tmpdir(), 'insitu-script-publication-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const archive = join(root, 'plugin.zip');
  execFileSync(process.execPath, [packager, archive]);
  execFileSync('unzip', ['-q', archive, '-d', join(root, 'installed')]);
  const helper = join(root, 'installed/skills/insitu-storefront-authoring/scripts/upload-storefront.js');
  await writeFile(join(root, 'index.html'), '<!doctype html><title>Storefront fixture</title>');
  const zip = join(root, 'storefront.zip');
  execFileSync('zip', ['-q', zip, 'index.html'], { cwd: root });
  const bytes = await readFile(zip);
  const prepared = JSON.parse(execFileSync(process.execPath, [helper, '--prepare', zip], { encoding: 'utf8' }));
  assert.deepEqual(prepared, { size: bytes.length, digest: createHash('sha256').update(bytes).digest('hex') });
  const grant = {
    ...prepared, hostname: 'fixture.b2becommerce.store', authorization: 'b'.repeat(64),
    uploadUrl: 'https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
  const preload = join(root, 'https-fixture.cjs');
  await writeFile(preload, `
    const https = require('node:https');
    const assert = require('node:assert/strict');
    const { EventEmitter } = require('node:events');
    const { readFileSync } = require('node:fs');
    const grant = ${JSON.stringify(grant)};
    https.request = (url, options, callback) => {
      assert.equal(url, grant.uploadUrl);
      assert.equal(options.headers?.Authorization, undefined);
      const request = new EventEmitter();
      request.setTimeout = () => {};
      request.end = body => {
        const response = Object.assign(new EventEmitter(), { headers: {}, resume() {} });
        if (options.method === 'HEAD') {
          assert.equal(body, undefined);
          assert.equal(options.headers, undefined);
          response.statusCode = 204;
          callback(response);
        } else {
          assert.equal(options.method, 'POST');
          assert.equal(options.headers['X-Storefront-Upload-Authorization'], grant.authorization);
          assert.ok(body.includes(readFileSync(${JSON.stringify(zip)})));
          response.statusCode = 200;
          callback(response);
          response.emit('data', Buffer.from(JSON.stringify({status:'active',stage:'complete',hostname:grant.hostname,release:{digest:grant.digest,siteId:'c'.repeat(32)}})));
          response.emit('end');
        }
      };
      return request;
    };
  `);
  const check = JSON.parse(execFileSync(process.execPath, ['--require', preload, helper, '--check-connection'], { encoding: 'utf8' }));
  assert.deepEqual(check, { status: 'reachable', httpStatus: 204 });
  const run = input => spawnSync(process.execPath, ['--require', preload, helper, '--publish', zip], { input: JSON.stringify(input), encoding: 'utf8' });
  const published = run(grant);
  assert.equal(published.status, 0, published.stderr);
  assert.equal(JSON.parse(published.stdout).hostname, grant.hostname);
  assert.equal(JSON.parse(published.stdout).release.digest, prepared.digest);
  assert.doesNotMatch(published.stdout + published.stderr, new RegExp(grant.authorization));
  await writeFile(zip, 'changed after preparation');
  const changed = run(grant);
  assert.equal(changed.status, 1);
  assert.equal(JSON.parse(changed.stderr).outcome, 'not_started');
  assert.equal(JSON.parse(changed.stderr).stage, 'authorization');
  assert.doesNotMatch(changed.stdout + changed.stderr, new RegExp(grant.authorization));
});
