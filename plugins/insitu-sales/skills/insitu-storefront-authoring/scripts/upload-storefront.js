#!/usr/bin/env node
const fs = require("node:fs/promises");
const https = require("node:https");
const { createHash, randomBytes } = require("node:crypto");

const UPLOAD_URL = "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases";
const MAX_BYTES = 10 * 1024 * 1024;
const TRANSPORT_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "EACCES",
  "EPERM",
  "EPIPE",
  "EPROTO",
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR",
]);

async function readArchive(path) {
  const handle = await fs.open(path, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size < 1 || stat.size > MAX_BYTES) {
      throw Error("ZIP must be a regular file of at most 10 MiB");
    }

    const bytes = Buffer.alloc(stat.size);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    if (bytesRead !== bytes.length) throw Error("ZIP changed while reading");

    const extra = await handle.read(Buffer.alloc(1), 0, 1, bytes.length);
    if (extra.bytesRead) throw Error("ZIP changed while reading");

    return bytes;
  } finally {
    await handle.close();
  }
}
async function prepareArchive(path) {
  const bytes = await readArchive(path);

  return { digest: createHash("sha256").update(bytes).digest("hex"), size: bytes.length };
}
/** Pin the destination and exact artifact before sending the grant outside this process.
 * Keep this helper standalone so skill bundles need neither backend imports nor account credentials.
 */
function validatePreparedGrant(grant, artifact) {
  if (
    !grant ||
    grant.uploadUrl !== UPLOAD_URL ||
    typeof grant.authorization !== "string" ||
    !/^[a-f0-9]{64}$/.test(grant.authorization)
  ) {
    throw Error("Invalid upload authorization");
  }
  if (typeof grant.hostname !== "string" || !/^[a-z0-9.-]{1,253}$/.test(grant.hostname)) {
    throw Error("Invalid upload hostname");
  }
  if (!(Date.parse(grant.expiresAt) > Date.now())) {
    throw Error("Upload authorization expired");
  }
  if (grant.size !== artifact.size || artifact.digest !== grant.digest) {
    throw Error("ZIP does not match upload authorization");
  }
}
function multipart(grant, bytes) {
  const boundary = `insitu-${randomBytes(16).toString("hex")}`;
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="hostname"\r\n\r\n${grant.hostname}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="digest"\r\n\r\n${grant.digest}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="archive"; filename="storefront.zip"\r\nContent-Type: application/zip\r\n\r\n`,
  );

  return { boundary, body: Buffer.concat([prefix, bytes, Buffer.from(`\r\n--${boundary}--\r\n`)]) };
}
function uploadFailure(failureStage, httpStatus = null, code = null) {
  const status = httpStatus === null ? "HTTP status unavailable" : `HTTP ${httpStatus}`;
  const transportCode = TRANSPORT_CODES.has(code) ? code : null;
  const transport = ["network", "response-stream"].includes(failureStage)
    ? `; ${transportCode || "transport code unavailable"}`
    : "";
  const error = Error(
    `Upload outcome could not be confirmed (${failureStage}; ${status}${transport}); do not retry automatically`,
  );
  error.failureStage = failureStage;
  error.httpStatus = httpStatus;
  error.transportCode = transportCode;

  return error;
}
/** Return only a recognized outcome for this artifact; never echo a server payload containing secrets.
 * Unexpected responses remain uncertain, not permission to submit the upload again.
 */
const PUBLIC_FAILURES = {
  PUBLICATION_UNCONFIRMED: "The server could not confirm publication. The website may have changed.",
  PUBLICATION_UNAVAILABLE: "The publication service is unavailable.",
  UPLOAD_AUTHORIZATION_INVALID: "The upload authorization has expired, was already used, or is invalid.",
  PUBLICATION_FORBIDDEN: "The account is not allowed to publish this storefront.",
  INVALID_ARCHIVE: "The ZIP or manifest is invalid. Check index.html at the ZIP root and the 10 MiB limit.",
  PUBLICATION_REJECTED: "The server rejected the publication request or storefront configuration.",
};
function safeRequestId(value) {
  return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)
    ? value
    : null;
}
function throwPublicationFailure(status, data) {
  const detail = data?.error;
  if (
    status >= 400 &&
    detail &&
    Object.hasOwn(PUBLIC_FAILURES, detail.code) &&
    ["authorization", "validation", "upload", "request"].includes(detail.stage) &&
    ["unknown", "not_started"].includes(detail.outcome)
  ) {
    const error = uploadFailure(detail.stage, status);
    error.message = PUBLIC_FAILURES[detail.code];
    error.publicationCode = detail.code;
    error.outcome = detail.outcome;
    error.requestId = safeRequestId(detail.requestId);
    throw error;
  }
}
function publicationResult(status, data, grant) {
  throwPublicationFailure(status, data);
  const outcomes = {
    200: ["active", ["complete"]],
    202: ["activation_pending", ["verification"]],
    502: ["activation_unconfirmed", ["route", "selection"]],
  };
  const expected = outcomes[status];
  if (!expected || !data || data.status !== expected[0] || !expected[1].includes(data.stage)) {
    throw uploadFailure("response-contract", status);
  }
  if (
    data.hostname !== grant.hostname ||
    data.release?.digest !== grant.digest ||
    !/^[a-f0-9]{32}$/.test(data.release?.siteId)
  ) {
    throw uploadFailure("artifact-mismatch", status);
  }

  return {
    httpStatus: status,
    status: data.status,
    stage: data.stage,
    hostname: data.hostname,
    release: { siteId: data.release.siteId, digest: data.release.digest },
  };
}
function sendUpload(transport, grant, upload) {
  return new Promise((resolve, reject) => {
    let httpStatus = null;
    let requestId = null;
    const fail = (stage, error) => reject(Object.assign(uploadFailure(stage, httpStatus, error?.code), { requestId }));
    const request = transport.request(
      UPLOAD_URL,
      {
        method: "POST",
        headers: {
          "X-Storefront-Upload-Authorization": grant.authorization,
          "Content-Type": `multipart/form-data; boundary=${upload.boundary}`,
          "Content-Length": upload.body.length,
        },
      },
      (response) => {
        httpStatus = response.statusCode;
        requestId = safeRequestId(response.headers?.["x-request-id"]);
        const chunks = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 65536) {
            fail("response-size");
            response.destroy();

            return;
          }

          chunks.push(chunk);
        });
        response.on("error", (error) => fail("response-stream", error));
        response.on("aborted", () => fail("response-stream"));
        response.on("end", () => {
          let data;
          try {
            data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            fail("response-format");

            return;
          }
          try {
            const result = publicationResult(httpStatus, data, grant);
            if (requestId) result.requestId = requestId;

            resolve(result);
          } catch (error) {
            error.requestId ||= requestId;
            reject(error);
          }
        });
      },
    );
    request.setTimeout(120000, () => {
      fail("timeout");
      request.destroy();
    });
    request.on("error", (error) => fail("network", error));
    request.end(upload.body);
  });
}
async function publishArchive(path, grant, transport = https) {
  let bytes;
  try {
    bytes = await readArchive(path);
  } catch {
    throw Object.assign(Error("The ZIP could not be read; no upload was attempted"), {
      localBeforeSend: true,
      outcome: "not_started",
      failureStage: "file",
    });
  }
  try {
    validatePreparedGrant(grant, { size: bytes.length, digest: createHash("sha256").update(bytes).digest("hex") });
  } catch {
    throw Object.assign(
      Error("Upload authorization is invalid, expired or does not match the ZIP; no upload was attempted"),
      { localBeforeSend: true, outcome: "not_started", failureStage: "authorization" },
    );
  }

  return sendUpload(transport, grant, multipart(grant, bytes));
}

function checkConnection(transport = https) {
  return new Promise((resolve, reject) => {
    const signal = AbortSignal.timeout(15000);
    const fail = (error) => {
      const failureStage = signal.aborted ? "timeout" : "network";
      const transportCode = !signal.aborted && TRANSPORT_CODES.has(error?.code) ? error.code : null;
      const failure = Error(
        `Publication connection check failed (${failureStage}; ${transportCode || "transport code unavailable"}); no upload was attempted`,
      );
      failure.failureStage = failureStage;
      failure.httpStatus = null;
      failure.transportCode = transportCode;
      reject(failure);
    };

    try {
      const request = transport.request(UPLOAD_URL, { method: "HEAD", signal }, (response) => {
        response.on("error", fail);
        response.resume();
        resolve({ status: "reachable", httpStatus: response.statusCode });
      });
      request.on("error", fail);
      request.end();
    } catch (error) {
      fail(error);
    }
  });
}
async function readGrant() {
  let text = "";
  for await (const chunk of process.stdin) {
    text += chunk;
    if (Buffer.byteLength(text) > 4096) throw Error("Upload authorization input too large");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Error("Invalid upload authorization input");
  }
}
async function main() {
  const [mode, path, ...extra] = process.argv.slice(2);
  if (mode === "--check-connection" && path === undefined && !extra.length) {
    process.stdout.write(`${JSON.stringify(await checkConnection())}\n`);

    return;
  }
  if (!path || extra.length || !["--prepare", "--publish"].includes(mode)) {
    throw Error("Usage: upload-storefront.js --check-connection | --prepare ZIP | --publish ZIP (grant JSON on stdin)");
  }

  const result = mode === "--prepare" ? await prepareArchive(path) : await publishArchive(path, await readGrant());
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
if (require.main === module) {
  main().catch((error) => {
    // Do not print wire errors, request options, server payloads or the grant.
    process.stderr.write(
      `${JSON.stringify({ message: error.message, stage: error.failureStage || "local-validation", code: error.publicationCode || null, requestId: error.requestId || null, httpStatus: error.httpStatus || null, outcome: error.outcome || (error.failureStage ? "unknown" : "not_started"), nextAction: "Do not retry automatically. For uncertain publication, contact inSitu Sales support with this reference and the attempt time." })}\n`,
    );
    process.exitCode = 1;
  });
}

module.exports = { prepareArchive, publishArchive, checkConnection, validatePreparedGrant };
