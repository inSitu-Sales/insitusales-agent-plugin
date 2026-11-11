"use strict";
const { randomUUID } = require("node:crypto");
const { isAbsolute, basename } = require("node:path");
const { validate } = require("./workspace.cjs");
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
      "Prepare a local static ZIP and check publication connectivity from the local MCP process. Returns artifact identity for review and authorization; does not upload. Use an absolute ZIP path from the selected project. Does not open a panel.",
    inputSchema: { ...object({ path: text(4096) }), properties: { path: text(4096), projectId: { type: "string", pattern: "^[a-f0-9]{64}$" } } },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
      idempotentHint: false,
    },
  },
  {
    name: "publishStorefrontRelease",
    description:
      "Publish the prepared ZIP after explicit user approval to publish the selected project to its authenticated destination. A clear publication request is approval; do not ask again unless scope or destination changes. Obtain a short-lived grant from authorizeStorefrontUpload; never supply the general OAuth token. A user-requested retry requires fresh authorization. Return the message, next action and support reference to the user.",
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
for (const tool of tools) tool._meta = { ui: { visibility: ['model'] } };
const support =
  "You can request another upload with fresh authorization. If the problem persists, contact inSitu Sales support with the reference and attempt time.";
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
      "Check the prepared artifact and request fresh authorization for the approved ZIP. No upload was attempted.";
  } else if (stage === "file") {
    code = ["EACCES", "EPERM"].includes(error.code) ? "LOCAL_PERMISSION_DENIED" : "LOCAL_FILE_ACCESS";
    message =
      "The local MCP could not read the ZIP. It must be a regular file within the 10 MiB limit.";
    nextAction =
      "Verify the ZIP path and file permissions. If the app denies file access, grant access only to the artifact location when permitted, then prepare again. No upload was attempted.";
  } else if (stage === "connection") {
    code = error.publicationCode || "PUBLICATION_CONNECTION_FAILED";
    message = error.httpStatus ? "The publication service rejected the connection check. No upload was attempted." : "The local MCP could not reach the publication service.";
    nextAction = error.httpStatus
      ? "Review the HTTP status and request reference with support. No upload was attempted. Do not change DNS or hosting to work around this response."
      : "Check network connectivity and app network permissions. Request narrowly scoped access when supported; if policy denies it, stop and contact support. No upload was attempted.";
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
function createPublicationTools(helper = uploader, registry) {
  const prepared = new Map();
  const attempts = new Set();
  const inFlight = new Set();
  return {
    tools,
    handles: (name) => tools.some((tool) => tool.name === name),
    async call(name, args = {}) {
      const attemptId = randomUUID();
      let stage = "input";
      let attempted = false;
      let publicationKey;
      let savedArtifactId;
      let linkedProjectId;
      let saveWarning;
      async function remember(result) {
        if (savedArtifactId && registry) {
          try { await registry.recordResult(savedArtifactId, { ...result, hostname: result.hostname || args.grant?.hostname }); }
          catch { saveWarning = "The local record could not be updated. Keep this result for reference."; }
        }
        if (!savedArtifactId && linkedProjectId && registry) {
          try { await registry.recordEvent(linkedProjectId, attemptId, { ...result, attemptId }); }
          catch { saveWarning = "The local record could not be updated. Keep this result for reference."; }
        }
        return { ...result, ...(saveWarning ? { saveWarning } : {}) };
      }
      try {
        const tool = tools.find((tool) => tool.name === name);
        if (!tool) throw new Error("Invalid tool");
        validate(tool.inputSchema, args);
        if (name === "prepareStorefrontRelease") {
          if (
            Object.keys(args).some((k) => !["path", "projectId"].includes(k)) ||
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
          if (args.projectId) {
            try {
              if (!registry) throw new Error("Project storage unavailable");
              await registry.get(args.projectId);
              linkedProjectId = args.projectId;
            } catch { saveWarning = "The local project reference is unavailable. ZIP preparation can continue without saving it."; }
          }
          await remember({status:"preparing",stage:"file",outcome:"not_started",message:"Preparing the storefront files."});
          stage = "file";
          const artifact = await helper.prepareArchive(args.path);
          stage = "connection";
          await helper.checkConnection();
          if (prepared.size >= 100)
            return reply(await remember(
              {
                stage: "preparation",
                attemptId,
                code: "PREPARATION_LIMIT",
                message:
                  "Too many prepared artifacts in this session. Finish the current publication before starting more.",
                outcome: "not_started",
              }),
              true,
            );
          const artifactId = randomUUID();
          prepared.set(artifactId, { ...artifact, path: args.path, projectId: linkedProjectId });
          if (linkedProjectId) {
            try { await registry.recordPrepared(linkedProjectId, artifactId, { ...artifact, path: args.path }); }
            catch { saveWarning = "The ZIP is prepared, but its local record could not be saved."; }
          }
          await remember({status:"prepared",stage:"preparation",outcome:"not_started",message:"Files prepared. Publication continues in the chat."});
          return reply({
            artifactId,
            ...(saveWarning ? { saveWarning } : {}),
            filename: basename(args.path),
            ...artifact,
            status: "prepared",
            message:
              "ZIP read and service reachable. Review the artifact before authorizing publication for the authenticated company.",
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
        if (artifact.projectId) savedArtifactId = args.artifactId;
        const key = args.grant.hostname;
        if (inFlight.has(key) || attempts.has(args.grant.authorization))
          return reply(
            {
              code: "PUBLICATION_ALREADY_ATTEMPTED",
              message:
                "An upload is still running or this authorization was already used. Request fresh authorization for another attempt.",
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
          return reply(await remember(
            {
              attemptId,
              stage: "file",
              code: "ARTIFACT_CHANGED",
              message:
                "The ZIP or authorization does not match the reviewed artifact. Prepare and review it again.",
              outcome: "not_started",
            }),
            true,
          );
        stage = "authorization";
        uploader.validatePreparedGrant(args.grant, artifact);
        stage = "upload";
        if (inFlight.has(key) || attempts.has(args.grant.authorization))
          return reply(
            {
              code: "PUBLICATION_ALREADY_ATTEMPTED",
              message:
                "An upload is still running or this authorization was already used. Request fresh authorization for another attempt.",
              outcome: "unknown",
              nextAction: support,
            },
            true,
          );
        publicationKey = key;
        inFlight.add(key);
        attempts.add(args.grant.authorization);
        await remember({ status: "uploading", stage: "upload", outcome: "unknown", attemptId, message: "Upload started. Waiting for the publication service." });
        attempted = true;
        const result = await helper.publishArchive(artifact.path, args.grant);
        return reply(await remember({
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
        }));
      } catch (error) {
        if (
          error.localBeforeSend === true &&
          error.outcome === "not_started" &&
          ["file", "authorization"].includes(error.failureStage)
        ) {
          if (publicationKey) attempts.delete(args.grant.authorization);
          attempted = false;
          stage = error.failureStage;
        }
        const result = failure(error, stage, attempted, attemptId);
        result.structuredContent = await remember(result.structuredContent);
        return result;
      } finally {
        if (publicationKey) inFlight.delete(publicationKey);
      }
    },
  };
}
module.exports = { createPublicationTools };
