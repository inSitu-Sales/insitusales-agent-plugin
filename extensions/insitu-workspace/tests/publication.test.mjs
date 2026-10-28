import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
test("local publication uses exact prepared identity and refuses repeated uncertain writes", async () => {
  const { createPublicationTools } = require("../server/publication.cjs");
  let uploads = 0;
  const helper = {
    prepareArchive: async () => ({ digest: "a".repeat(64), size: 12 }),
    checkConnection: async () => ({ status: "reachable" }),
    publishArchive: async () => {
      uploads++;
      throw Object.assign(Error("private-token"), { failureStage: "timeout" });
    },
  };
  const api = createPublicationTools(helper);
  const prepared = (
    await api.call("prepareStorefrontRelease", { path: "/tmp/storefront.zip" })
  ).structuredContent;
  assert.equal(prepared.digest, "a".repeat(64));
  const args = {
    artifactId: prepared.artifactId,
    grant: {
      uploadUrl:
        "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases",
      authorization: "b".repeat(64),
      hostname: "fixture.example.com",
      digest: prepared.digest,
      size: 12,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    },
  };
  const failure = await api.call("publishStorefrontRelease", args);
  assert.equal(failure.isError, true);
  assert.equal(failure.structuredContent.outcome, "unknown");
  assert.doesNotMatch(JSON.stringify(failure), /private-token/);
  const repeated = await api.call("publishStorefrontRelease", args);
  assert.equal(repeated.isError, true);
  assert.equal(uploads, 1);
});
test("local preparation explains file permission failure without exposing paths or attempting upload", async () => {
  const { createPublicationTools } = require("../server/publication.cjs");
  const api = createPublicationTools({
    prepareArchive: async () => {
      throw Object.assign(Error("/private/file"), { code: "EACCES" });
    },
  });
  const result = await api.call("prepareStorefrontRelease", {
    path: "/private/file",
  });
  assert.equal(result.structuredContent.code, "LOCAL_FILE_ACCESS");
  assert.equal(result.structuredContent.outcome, "not_started");
  assert.doesNotMatch(JSON.stringify(result), /\/private\/file/);
});

test("changed files and expired grants fail before upload, while concurrent uploads execute once", async () => {
  const { createPublicationTools } = require("../server/publication.cjs");
  let digest = "a".repeat(64),
    uploads = 0;
  let finish;
  const api = createPublicationTools({
    prepareArchive: async () => ({ digest, size: 12 }),
    checkConnection: async () => ({ status: "reachable" }),
    publishArchive: async () => {
      uploads++;
      await new Promise((r) => {
        finish = r;
      });
      return { status: "active" };
    },
  });
  const prepared = (
    await api.call("prepareStorefrontRelease", { path: "/tmp/storefront.zip" })
  ).structuredContent;
  const grant = {
    uploadUrl:
      "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases",
    authorization: "b".repeat(64),
    hostname: "fixture.example.com",
    digest,
    size: 12,
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
  digest = "c".repeat(64);
  assert.equal(
    (
      await api.call("publishStorefrontRelease", {
        artifactId: prepared.artifactId,
        grant,
      })
    ).structuredContent.code,
    "ARTIFACT_CHANGED",
  );
  digest = grant.digest;
  assert.equal(
    (
      await api.call("publishStorefrontRelease", {
        artifactId: prepared.artifactId,
        grant: { ...grant, expiresAt: "2000-01-01" },
      })
    ).structuredContent.outcome,
    "not_started",
  );
  assert.equal(uploads, 0);
  const first = api.call("publishStorefrontRelease", {
    artifactId: prepared.artifactId,
    grant,
  });
  const second = await api.call("publishStorefrontRelease", {
    artifactId: prepared.artifactId,
    grant,
  });
  assert.equal(second.isError, true);
  assert.equal(uploads, 1);
  finish();
  await first;
});

test("a helper failure before sending remains recoverable without an uncertain retry guard", async () => {
  const { createPublicationTools } = require("../server/publication.cjs");
  let uploads = 0;
  const api = createPublicationTools({
    prepareArchive: async () => ({ digest: "a".repeat(64), size: 12 }),
    checkConnection: async () => ({ status: "reachable" }),
    publishArchive: async () => {
      uploads++;
      throw Object.assign(Error("private file"), {
        localBeforeSend: true,
        outcome: "not_started",
        failureStage: "file",
      });
    },
  });
  const prepared = (
    await api.call("prepareStorefrontRelease", { path: "/tmp/site.zip" })
  ).structuredContent;
  const args = {
    artifactId: prepared.artifactId,
    grant: {
      uploadUrl:
        "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases",
      authorization: "b".repeat(64),
      hostname: "fixture.example.com",
      digest: prepared.digest,
      size: 12,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    },
  };
  const first = await api.call("publishStorefrontRelease", args);
  assert.equal(first.structuredContent.code, "LOCAL_FILE_ACCESS");
  assert.equal(first.structuredContent.outcome, "not_started");
  const second = await api.call("publishStorefrontRelease", args);
  assert.equal(second.structuredContent.code, "LOCAL_FILE_ACCESS");
  assert.equal(uploads, 2);
});

test("remote authorization rejection retains the administrator action rather than becoming local input failure", async () => {
  const { createPublicationTools } = require("../server/publication.cjs");
  const api = createPublicationTools({
    prepareArchive: async () => ({ digest: "a".repeat(64), size: 12 }),
    checkConnection: async () => ({ status: "reachable" }),
    publishArchive: async () => {
      throw Object.assign(
        Error("The account is not allowed to publish this storefront."),
        {
          publicationCode: "PUBLICATION_FORBIDDEN",
          httpStatus: 403,
          outcome: "not_started",
          failureStage: "authorization",
        },
      );
    },
  });
  const prepared = (
    await api.call("prepareStorefrontRelease", { path: "/tmp/site.zip" })
  ).structuredContent;
  const result = await api.call("publishStorefrontRelease", {
    artifactId: prepared.artifactId,
    grant: {
      uploadUrl:
        "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases",
      authorization: "b".repeat(64),
      hostname: "fixture.example.com",
      digest: prepared.digest,
      size: 12,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    },
  });
  assert.equal(result.structuredContent.code, "PUBLICATION_FORBIDDEN");
  assert.match(result.structuredContent.nextAction, /company administrator/);
});

test('visual review exposes only artifact metadata and confirmation uploads once', async () => {
  const { createPublicationTools } = require('../server/publication.cjs');
  let uploads = 0;
  const api = createPublicationTools({
    prepareArchive: async () => ({ digest: 'a'.repeat(64), size: 12 }),
    checkConnection: async () => {},
    publishArchive: async () => { uploads++; return { status: 'active', hostname: 'fixture.example.com' }; },
  });
  const prepared = (await api.call('prepareStorefrontRelease', { path: '/private/site.zip' })).structuredContent;
  const grant = { uploadUrl: 'https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases', authorization: 'b'.repeat(64), hostname: 'fixture.example.com', digest: prepared.digest, size: 12, expiresAt: new Date(Date.now()+60000).toISOString() };
  assert.equal((await api.call('authorizeLocalStorefrontRelease', {artifactId: prepared.artifactId, grant})).isError, undefined);
  const review = await api.call('reviewStorefrontRelease', { artifactId: prepared.artifactId });
  assert.equal(api.tools.find(t => t.name === 'authorizeLocalStorefrontRelease')._meta.ui.resourceUri, undefined);
  assert.equal(review.structuredContent.status, 'ready');
  assert.equal(review.structuredContent.filename, 'site.zip');
  assert.equal(review.structuredContent.hostname, grant.hostname);
  assert.doesNotMatch(JSON.stringify(review), /bbbbbbbb|\/private\//);
  assert.equal(uploads, 0);
  assert.ok(api.tools.find(t => t.name === 'reviewStorefrontRelease')._meta.ui.resourceUri);
  assert.deepEqual(api.tools.find(t => t.name === 'confirmStorefrontRelease')._meta.ui.visibility, ['app']);
  const sent = await api.call('confirmStorefrontRelease', { artifactId: prepared.artifactId });
  assert.equal(sent.structuredContent.status, 'active');
  assert.equal(uploads, 1);
  assert.equal((await api.call('confirmStorefrontRelease', { artifactId: prepared.artifactId })).isError, true);
  assert.equal(uploads, 1);
});

test('visual confirmation requires an exact valid grant and never uploads an unreviewed artifact', async () => {
  const { createPublicationTools } = require('../server/publication.cjs');
  const api = createPublicationTools({prepareArchive: async () => ({digest:'a'.repeat(64),size:12}),checkConnection:async()=>{},publishArchive:async()=>{throw Error('must not upload')}});
  const p=(await api.call('prepareStorefrontRelease',{path:'/tmp/site.zip'})).structuredContent;
  assert.equal((await api.call('confirmStorefrontRelease',{artifactId:p.artifactId})).isError,true);
  const grant={uploadUrl:'https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases',authorization:'b'.repeat(64),hostname:'fixture.example.com',digest:'c'.repeat(64),size:12,expiresAt:new Date(Date.now()+60000).toISOString()};
  assert.equal((await api.call('authorizeLocalStorefrontRelease',{artifactId:p.artifactId,grant})).isError,true);
  assert.equal((await api.call('confirmStorefrontRelease',{artifactId:p.artifactId})).isError,true);
});

test('a visual review cannot change destination and expiry is rechecked at send time', async () => {
  const { createPublicationTools } = require('../server/publication.cjs');
  let uploads = 0;
  const api = createPublicationTools({prepareArchive:async()=>({digest:'a'.repeat(64),size:12}),checkConnection:async()=>{},publishArchive:async()=>{uploads++;return {status:'active'}}});
  const p=(await api.call('prepareStorefrontRelease',{path:'/tmp/site.zip'})).structuredContent;
  const grant={uploadUrl:'https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases',authorization:'b'.repeat(64),hostname:'fixture.example.com',digest:p.digest,size:12,expiresAt:new Date(Date.now()+60000).toISOString()};
  assert.equal((await api.call('authorizeLocalStorefrontRelease',{artifactId:p.artifactId,grant})).isError,undefined);
  assert.equal((await api.call('authorizeLocalStorefrontRelease',{artifactId:p.artifactId,grant:{...grant,hostname:'other.example.com'}})).isError,true);
  const review=await api.call('reviewStorefrontRelease',{artifactId:p.artifactId});
  assert.equal(review.structuredContent.hostname,grant.hostname);
  const original=Date.now;
  try {
    Date.now=()=>Date.parse(grant.expiresAt)+1;
    const expired=await api.call('confirmStorefrontRelease',{artifactId:p.artifactId});
    assert.equal(expired.isError,true);
    assert.equal(expired.structuredContent.outcome,'not_started');
    assert.equal(uploads,0);
  } finally { Date.now=original; }
});
