import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const procedure = new URL('../../../plugins/insitu-sales/skills/insitu-storefront-authoring/upload.md', import.meta.url);

test('the documented curl request sends the ZIP and reads authorization from caller stdin', async t => {
  const root = await mkdtemp(join(tmpdir(), 'insitu upload '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const archive = Buffer.from('synthetic ZIP bytes');
  const zip = join(root, 'storefront.zip');
  await writeFile(zip, archive);
  const digest = createHash('sha256').update(archive).digest('hex');
  const authorization = 'synthetic-artifact-authorization';
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({ headers: request.headers, method: request.method, body: Buffer.concat(chunks) });
    response.setHeader('x-request-id', 'fixture-request');
    response.end(JSON.stringify({ status: 'active', hostname: 'fixture.example.com', release: { digest } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const manual = await readFile(procedure, 'utf8');
  const command = manual.split('## Publish\n')[1].match(/```(?:text|sh)\n([\s\S]*?)```/)[1]
    .replaceAll('https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases', `http://127.0.0.1:${server.address().port}/upload`)
    .replaceAll('<grant.hostname>', 'fixture.example.com')
    .replaceAll('<grant.digest>', digest)
    .replaceAll('<ZIP>', zip);
  assert.ok(!command.includes(authorization));
  const child = spawn('/bin/sh', ['-c', command], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  const completed = new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
  child.stdin.end(`X-Storefront-Upload-Authorization: ${authorization}\n`);
  assert.equal(await completed, 0, stderr);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers['x-storefront-upload-authorization'], authorization);
  assert.equal(requests[0].headers.authorization, undefined);
  assert.equal(requests[0].method, 'POST');
  assert.ok(requests[0].body.includes(archive));
  assert.match(requests[0].body.toString(), /name="hostname"\r\n\r\nfixture.example.com/);
  assert.ok(requests[0].body.includes(Buffer.from(digest)));
  assert.match(stdout, /fixture-request/);
  assert.equal(JSON.parse(stdout.slice(stdout.indexOf('{'))).release.digest, digest);
  assert.ok(!(stdout + stderr).includes(authorization));
});

for (const status of [204, 302, 401, 500]) {
  test(`the documented connection check returns HTTP ${status} without credentials, upload, redirects or retries`, async t => {
    const requests = [];
    const server = createServer((request, response) => {
      requests.push({ method: request.method, headers: request.headers });
      response.writeHead(status, { location: '/redirect-target', 'x-request-id': 'fixture-preflight-reference' });
      response.end();
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const manual = await readFile(procedure, 'utf8');
    const command = manual.split('## Check the connection\n')[1].match(/```(?:text|sh)\n([\s\S]*?)```/)[1]
      .replaceAll('https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases', `http://127.0.0.1:${server.address().port}/upload`);
    const child = spawn('/bin/sh', ['-c', command], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.stdin.end();
    const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
    assert.equal(code, 0, stderr);
    assert.match(stdout, new RegExp(`HTTP_STATUS=${status}\\b`));
    assert.match(stdout, /x-request-id: fixture-preflight-reference/i);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'HEAD');
    assert.equal(requests[0].headers.authorization, undefined);
    assert.equal(requests[0].headers['x-storefront-upload-authorization'], undefined);
  });
}

test('a preflight transport failure retains the curl exit code and reports no HTTP response or reference', async t => {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({ method: request.method, headers: request.headers });
    response.destroy();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const manual = await readFile(procedure, 'utf8');
  const command = manual.split('## Check the connection\n')[1].match(/```(?:text|sh)\n([\s\S]*?)```/)[1]
    .replaceAll('https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases', `http://127.0.0.1:${server.address().port}/upload`);
  const child = spawn('/bin/sh', ['-c', command], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  child.stdin.end();
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
  assert.equal(code, 52);
  assert.match(stderr, /curl: \(52\)/);
  assert.match(stdout, /HTTP_STATUS=000\b/);
  assert.doesNotMatch(stdout, /x-request-id/i);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'HEAD');
  assert.equal(requests[0].headers.authorization, undefined);
  assert.equal(requests[0].headers['x-storefront-upload-authorization'], undefined);
});
