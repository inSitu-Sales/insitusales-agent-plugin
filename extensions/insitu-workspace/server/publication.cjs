"use strict";
const { randomUUID } = require("node:crypto");
const { isAbsolute, basename } = require("node:path");
const { validate, RESOURCE_URI } = require("./workspace.cjs");
const uploader = require("../../../plugins/insitu-sales/skills/insitu-storefront-authoring/scripts/upload-storefront.js");
const text = (maxLength) => ({ type: "string", minLength: 1, maxLength });
const object = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const tools = [
  {
    name: "prepareStorefrontRelease",
    description:
      "Prepare a local static ZIP and check publication connectivity from the local MCP process. Returns artifact identity for review and authorization; does not upload. Use an absolute path to the user-approved ZIP.",
    inputSchema: object({ path: text(4096) }),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
      idempotentHint: false,
    },
  },
  {
    name: "publishStorefrontRelease",
    description:
      "Publish the exact prepared ZIP after explicit user approval of hostname and artifact. Obtain a short-lived grant from authorizeStorefrontUpload; never supply the general OAuth token. Do not repeat an uncertain attempt. Return the message, next action and support reference to the user.",
    inputSchema: object({
      artifactId: text(36),
      grant: object({
        uploadUrl: text(200),
        authorization: { type: "string", pattern: "^[a-f0-9]{64}$" },
        hostname: text(253),
        digest: { type: "string", pattern: "^[a-f0-9]{64}$" },
        size: { type: "integer", minimum: 1, maximum: 10485760 },
        expiresAt: text(40),
      }),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
      idempotentHint: false,
    },
  },
];
tools.push(
  {
    name: "authorizeLocalStorefrontRelease",
    description: "Retain a short-lived upload grant after the user has approved the exact artifact and hostname and remote authorization has been obtained. Does not open a panel or upload. Then call reviewStorefrontRelease using only the artifact identity. Do not also call publishStorefrontRelease.",
    inputSchema: tools[1].inputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: false },
  },
  {
    name: "reviewStorefrontRelease",
    description: "Show the ZIP and destination authorized by authorizeLocalStorefrontRelease. Does not upload. The user can send the ZIP from this panel; do not also call publishStorefrontRelease.",
    inputSchema: object({ artifactId: text(36) }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: "confirmStorefrontRelease",
    description: "Send the reviewed ZIP using the authorization retained by this local MCP. Called by the publication panel after the user presses Send ZIP. Never automatically retry.",
    inputSchema: object({ artifactId: text(36) }),
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true, idempotentHint: false },
  },
);
for (const tool of tools) tool._meta = { ui: { ...(tool.name === "publishStorefrontRelease" || tool.name === "authorizeLocalStorefrontRelease" ? {} : { resourceUri: RESOURCE_URI }), visibility: tool.name === "confirmStorefrontRelease" ? ["app"] : ["model"] } };
const support =
  "Contact inSitu Sales support with the reference, hostname, ZIP digest and attempt time. Do not retry automatically; support must check an uncertain publication first.";
function reply(data, isError = false) {
  return {
    ...(isError ? { isError: true } : {}),
    structuredContent: { ...data, kind: "storefrontPublication" },
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}
function failure(error, stage, attempted, attemptId) {
  let code = "LOCAL_PUBLICATION_FAILED";
  let message = "The publication operation could not be completed.";
  let nextAction = support;
  if (stage === "input" || stage === "authorization") {
    code = "INVALID_PUBLICATION_INPUT";
    message = "The publication input or authorization is invalid or expired.";
    nextAction =
      "Check the prepared artifact and request fresh authorization for the approved ZIP if no earlier upload is uncertain. No upload was attempted.";
  } else if (stage === "file") {
    code = "LOCAL_FILE_ACCESS";
    message =
      "The local MCP could not read the ZIP. It must be a regular file within the 10 MiB limit.";
    nextAction =
      "Verify the ZIP path and file permissions. If the app denies file access, grant access only to the artifact location when permitted, then prepare again. No upload was attempted.";
  } else if (stage === "connection") {
    code = "PUBLICATION_CONNECTION_FAILED";
    message = "The local MCP could not reach the publication service.";
    nextAction =
      "Check network connectivity and app network permissions. Request narrowly scoped access when supported; if policy denies it, stop and contact support. No upload was attempted.";
  } else if (error.publicationCode) {
    code = error.publicationCode;
    message = error.message;
    if (code === "INVALID_ARCHIVE")
      nextAction =
        "Check the static build, ZIP entrypoint and size; prepare and review a corrected artifact before requesting fresh authorization.";
    if (code === "PUBLICATION_FORBIDDEN" && error.outcome === "not_started")
      nextAction =
        "Ask the company administrator to verify account access and storefront ownership.";
  } else if (attempted) {
    code = "PUBLICATION_UNCONFIRMED";
    message =
      "The upload outcome could not be confirmed. The website may have changed.";
  }
  return reply(
    {
      code,
      message,
      stage: error.failureStage || stage,
      outcome: attempted ? error.outcome || "unknown" : "not_started",
      httpStatus: error.httpStatus || null,
      transportCode: error.transportCode || null,
      requestId: error.requestId || null,
      attemptId,
      nextAction,
    },
    true,
  );
}
function createPublicationTools(helper = uploader) {
  const prepared = new Map();
  const attempts = new Set();
  return {
    tools,
    handles: (name) => tools.some((tool) => tool.name === name),
    async call(name, args = {}) {
      const attemptId = randomUUID();
      let stage = "input";
      let attempted = false;
      let publicationKey;
      try {
        const tool = tools.find((tool) => tool.name === name);
        if (!tool) throw new Error("Invalid tool");
        validate(tool.inputSchema, args);
        if (name === "confirmStorefrontRelease") {
          const artifact = prepared.get(args.artifactId);
          if (!artifact?.grant) throw new Error("No reviewed authorization");
          const grant = artifact.grant;
          delete artifact.grant;
          return this.call("publishStorefrontRelease", { artifactId: args.artifactId, grant });
        }
        if (name === "authorizeLocalStorefrontRelease") {
          stage = "authorization";
          const artifact = prepared.get(args.artifactId);
          if (!artifact || artifact.grant || attempts.has(`${args.grant.hostname}:${artifact.digest}`)) throw new Error("Prepare a fresh review");
          uploader.validatePreparedGrant(args.grant, artifact);
          artifact.grant = { ...args.grant };
          return reply({ status: "authorized", artifactId: args.artifactId, message: "Authorization retained locally. Call reviewStorefrontRelease with this artifactId to open the upload panel." });
        }
        if (name === "reviewStorefrontRelease") {
          stage = "authorization";
          const artifact = prepared.get(args.artifactId);
          if (!artifact?.grant) throw new Error("No reviewed authorization");
          uploader.validatePreparedGrant(artifact.grant, artifact);
          return reply({ status: "ready", artifactId: args.artifactId, filename: basename(artifact.path), digest: artifact.digest, size: artifact.size, hostname: artifact.grant.hostname, expiresAt: artifact.grant.expiresAt, message: "Review the ZIP and destination, then send it from this panel." });
        }
        if (name === "prepareStorefrontRelease") {
          if (
            Object.keys(args).some((k) => k !== "path") ||
            typeof args.path !== "string" ||
            !isAbsolute(args.path)
          )
            return reply(
              {
                code: "INVALID_INPUT",
                message: "Use an absolute path to the reviewed ZIP.",
                outcome: "not_started",
              },
              true,
            );
          stage = "file";
          const artifact = await helper.prepareArchive(args.path);
          stage = "connection";
          await helper.checkConnection();
          if (prepared.size >= 100)
            return reply(
              {
                code: "PREPARATION_LIMIT",
                message:
                  "Too many prepared artifacts in this session. Finish the current publication before starting more.",
                outcome: "not_started",
              },
              true,
            );
          const artifactId = randomUUID();
          prepared.set(artifactId, { ...artifact, path: args.path });
          return reply({
            artifactId,
            filename: basename(args.path),
            ...artifact,
            status: "prepared",
            message:
              "ZIP read and service reachable. Review the artifact and hostname before authorizing publication.",
          });
        }
        const artifact = prepared.get(args.artifactId);
        if (
          name !== "publishStorefrontRelease" ||
          Object.keys(args).some((k) => !["artifactId", "grant"].includes(k)) ||
          !artifact ||
          !args.grant
        )
          return reply(
            {
              code: "INVALID_INPUT",
              message: "Prepare the ZIP in this MCP session before publishing.",
              outcome: "not_started",
            },
            true,
          );
        const key = `${args.grant.hostname}:${artifact.digest}`;
        if (attempts.has(key))
          return reply(
            {
              code: "PUBLICATION_ALREADY_ATTEMPTED",
              message:
                "This artifact already has a publication attempt in this session.",
              outcome: "unknown",
              nextAction: support,
            },
            true,
          );
        stage = "file";
        const current = await helper.prepareArchive(artifact.path);
        if (
          current.digest !== artifact.digest ||
          current.size !== artifact.size ||
          args.grant.digest !== artifact.digest ||
          args.grant.size !== artifact.size
        )
          return reply(
            {
              code: "ARTIFACT_CHANGED",
              message:
                "The ZIP or authorization does not match the reviewed artifact. Prepare and review it again.",
              outcome: "not_started",
            },
            true,
          );
        stage = "authorization";
        uploader.validatePreparedGrant(args.grant, artifact);
        stage = "upload";
        if (attempts.has(key))
          return reply(
            {
              code: "PUBLICATION_ALREADY_ATTEMPTED",
              message:
                "This artifact already has a publication attempt in this session.",
              outcome: "unknown",
              nextAction: support,
            },
            true,
          );
        publicationKey = key;
        attempts.add(key);
        attempted = true;
        const result = await helper.publishArchive(artifact.path, args.grant);
        return reply({
          ...result,
          attemptId,
          message:
            result.status === "active"
              ? "Publication confirmed active."
              : "Publication activation is not confirmed.",
          nextAction:
            result.status === "active"
              ? "Open the storefront and verify the agreed buyer journey."
              : support,
        });
      } catch (error) {
        if (
          error.localBeforeSend === true &&
          error.outcome === "not_started" &&
          ["file", "authorization"].includes(error.failureStage)
        ) {
          if (publicationKey) attempts.delete(publicationKey);
          attempted = false;
          stage = error.failureStage;
        }
        return failure(error, stage, attempted, attemptId);
      }
    },
  };
}
module.exports = { createPublicationTools };
