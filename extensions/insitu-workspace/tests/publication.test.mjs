import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
test("local publication uses exact prepared identity and allows a deliberate retry with fresh authorization after an uncertain result", async () => {
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
  const retry = await api.call("publishStorefrontRelease", { ...args, grant: { ...args.grant, authorization: "c".repeat(64) } });
  assert.equal(retry.structuredContent.outcome, "unknown");
  assert.equal(uploads, 2);
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
  assert.equal(result.structuredContent.code, "LOCAL_PERMISSION_DENIED");
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

test('publication tools are available only to the agent and never open a panel', () => {
  const api = require('../server/publication.cjs').createPublicationTools({});
  assert.deepEqual(api.tools.map(tool => tool.name), ['prepareStorefrontRelease', 'publishStorefrontRelease']);
  for (const tool of api.tools) {
    assert.equal(tool._meta.ui.resourceUri, undefined);
    assert.deepEqual(tool._meta.ui.visibility, ['model']);
  }
});

test("failed preflight persists a diagnostic and cannot produce a publishable artifact", async () => {
  const { createPublicationTools } = require("../server/publication.cjs");
  for (const detail of [
    {failureStage:"network",transportCode:"ENOTFOUND"},
    {failureStage:"connection",publicationCode:"PUBLICATION_PREFLIGHT_REJECTED",httpStatus:503,requestId:"fixture-request"},
  ]) {
    const events = [];
    let uploads = 0;
    const api = createPublicationTools({
      prepareArchive:async()=>({digest:"a".repeat(64),size:12}),
      checkConnection:async()=>{throw Object.assign(Error("private detail"),detail)},
      publishArchive:async()=>{uploads++},
    }, {get:async()=>({}),recordEvent:async(_project,_attempt,result)=>events.push(result)});
    const result = await api.call("prepareStorefrontRelease", {path:"/tmp/store.zip",projectId:"a".repeat(64)});
    assert.equal(result.isError,true);
    assert.equal(result.structuredContent.outcome,"not_started");
    assert.equal(result.structuredContent.artifactId,undefined);
    assert.equal(events.at(-1).code,detail.publicationCode || "PUBLICATION_CONNECTION_FAILED");
    assert.equal(events.at(-1).requestId,detail.requestId || null);
    assert.equal(events.at(-1).transportCode,detail.transportCode || null);
    assert.equal(uploads,0);
    assert.doesNotMatch(JSON.stringify(result),/private detail/);
  }
});
