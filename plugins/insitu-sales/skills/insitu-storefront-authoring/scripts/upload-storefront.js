#!/usr/bin/env node
const fs = require("node:fs/promises");
const https = require("node:https");
const { createHash, randomBytes } = require("node:crypto");

const UPLOAD_URL = "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases";
const MAX_BYTES = 10 * 1024 * 1024;

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
function validateGrant(grant, bytes) {
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
  if (grant.size !== bytes.length || createHash("sha256").update(bytes).digest("hex") !== grant.digest) {
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
/** Return only a recognized outcome for this artifact; never echo a server payload containing secrets.
 * Unexpected responses remain uncertain, not permission to submit the upload again.
 */
function publicationResult(status, data, grant) {
  const outcomes = {
    200: ["active", ["complete"]],
    202: ["activation_pending", ["verification"]],
    502: ["activation_unconfirmed", ["route", "selection"]],
  };
  const expected = outcomes[status];
  if (!expected || !data || data.status !== expected[0] || !expected[1].includes(data.stage)) {
    throw Error("Upload outcome could not be confirmed; do not retry automatically");
  }
  if (
    data.hostname !== grant.hostname ||
    data.release?.digest !== grant.digest ||
    !/^[a-f0-9]{32}$/.test(data.release?.siteId)
  ) {
    throw Error("Upload outcome could not be confirmed; do not retry automatically");
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
    const fail = () => reject(Error("Upload outcome could not be confirmed; do not retry automatically"));
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
        const chunks = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 65536) {
            response.destroy();
            fail();

            return;
          }

          chunks.push(chunk);
        });
        response.on("error", fail);
        response.on("aborted", fail);
        response.on("end", () => {
          try {
            resolve(publicationResult(response.statusCode, JSON.parse(Buffer.concat(chunks).toString("utf8")), grant));
          } catch {
            fail();
          }
        });
      },
    );
    request.setTimeout(120000, () => {
      request.destroy();
      fail();
    });
    request.on("error", fail);
    request.end(upload.body);
  });
}
async function publishArchive(path, grant, transport = https) {
  const bytes = await readArchive(path);
  validateGrant(grant, bytes);

  return sendUpload(transport, grant, multipart(grant, bytes));
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
  if (!path || extra.length || !["--prepare", "--publish"].includes(mode)) {
    throw Error("Usage: upload-storefront.js --prepare ZIP | --publish ZIP (grant JSON on stdin)");
  }

  const result = mode === "--prepare" ? await prepareArchive(path) : await publishArchive(path, await readGrant());
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
if (require.main === module) {
  main().catch((error) => {
    // Do not print wire errors, request options, server payloads or the grant.
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { prepareArchive, publishArchive };
