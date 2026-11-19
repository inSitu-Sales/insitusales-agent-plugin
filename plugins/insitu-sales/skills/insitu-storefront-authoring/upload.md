# Upload procedure

This is the only supported way to publish a storefront ZIP from chat. Every rule in the skill applies: explicit publication approval, an artifact-scoped grant from `authorizeStorefrontUpload`, the fixed endpoint, no automatic retry, and no credentials in command arguments, logs, or files. The steps need `curl` 7.55 or later and a SHA-256 tool. If either is missing, or the client cannot provide a protected standard-input channel separately from command text, explain the missing capability and stop before requesting a grant.

The only endpoint is `https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases`. Never send the grant anywhere else, follow redirects, or turn off TLS verification.

## Authorization and execution boundaries

A clear request to publish the selected project authorizes preparing and uploading its current build to the verified company storefront. Respect preparation-only requests and requests to wait. If publication intent is missing, ask once using the project name and destination. Renew approval only if the destination or agreed scope changes. Package the reviewed static build rather than its source; exclude credentials and development files. The remote MCP cannot read a local filesystem path.

Before publication, read [publication environment and connection diagnostics](connection.md). Confirm file/network execution, curl, checksum tools, and the protected stdin channel before requesting a grant. Check connectivity with the same `curl` executable and execution permissions intended for upload. A successful check does not prove publication readiness. If blocked, request narrowly scoped network execution permission when allowed; stop if policy denies access. Do not bypass restrictions or turn off TLS verification.

Never switch to ChatGPT Sites or another hosting provider, change the registered domain, or modify DNS or certificates to work around publication failures. Alternative hosting needs a separate explicit user request.

## Prepare

The ZIP must be a regular file of at most 10 MiB with `index.html` at its root. Compute the lowercase hexadecimal SHA-256 digest and the exact byte size:

```text
shasum -a 256 <ZIP>      (or: sha256sum <ZIP>)
wc -c < <ZIP>
```

These are the `digest` and `size` for `authorizeStorefrontUpload`.

## Check the connection

```text
curl --silent --show-error --head --connect-timeout 10 --max-time 15 --dump-header - --output /dev/null --write-out "\nHTTP_STATUS=%{http_code}\n" https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases
```

Continue only on HTTP 2xx with curl exit code zero. For any other result, automatically follow [connection diagnostics](connection.md) before requesting user intervention. Stop before requesting a grant or uploading until the check succeeds. A permitted diagnostic recheck after a permission or network correction is separate from an upload retry.

## Authorize the prepared artifact

After publication approval and a successful connection check, request artifact-scoped authorization using authorizeStorefrontUpload with only the prepared `digest` and `size`. The server resolves the authenticated company and canonical hostname and enforces administrator permission, ownership, expiration, and artifact matching. Never request or export the general plugin OAuth token. Pass the returned grant unchanged; never ask the user to choose a hostname.

## Publish

Before sending, confirm that the grant's `uploadUrl` equals the endpoint above, `expiresAt` is in the future, and `digest` and `size` equal a fresh digest and size of the ZIP. Otherwise stop: no upload was attempted, and a new preparation and authorization are needed.

Send one multipart request. Start the command below with a client execution API that can provide stdin separately from the command. Supply exactly one header line, `X-Storefront-Upload-Authorization: ` followed by the delegated authorization and a newline, through that protected channel. Never interpolate the authorization into shell text, a here-document, an echo/printf command, a tool transcript, environment configuration, or a file. Disable shell tracing and verbose HTTP output. If the client cannot provide this channel without recording its contents, stop before requesting a grant and report that ZIP publication is unavailable in this client. Do not weaken this requirement to complete an upload.

```text
curl --silent --show-error --max-time 120 --request POST \
  --header @- \
  --form-string "hostname=<grant.hostname>" \
  --form-string "digest=<grant.digest>" \
  --form "archive=@<ZIP>;type=application/zip;filename=storefront.zip" \
  --dump-header - \
  https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases
```

The command contains only non-secret artifact metadata. Quote paths for the active shell and escape any special characters; the placeholders are not executable shell syntax. Do not enable redirect following, automatic retries, or HTTP tracing. Use the same execution permissions for the connection check and upload.

## Read the result

Accept a result only when the response `hostname` and `release.digest` equal the grant's values:

| HTTP | `status`                 | Meaning                                              |
| ---- | ------------------------ | ---------------------------------------------------- |
| 200  | `active`                 | Published and active                                 |
| 202  | `activation_pending`     | Uploaded; activation is still being verified         |
| 502  | `activation_unconfirmed` | Uploaded; activation could not be confirmed          |

Report `storefrontUrl` and `customDomain.status` when present. A pending custom domain does not mean platform publication failed. Domain and DNS configuration remain in the existing web workflow. A 4xx or 5xx response with `error.code`, `error.stage`, and `error.outcome` is a service failure: `outcome` says whether the upload did not start or is unknown. Anything else, including a timeout, a mismatch, or an unreadable body, is an unknown outcome, not a confirmed failure. Give the user the `x-request-id` response header as the support reference. Do not show the authorization value or the raw response body.

## Report failures and deliberate retries

Explain failures immediately in the user's language: what failed, whether upload started or its outcome is unknown, the available service message, the next action, and the support reference. Include HTTP or transport codes as supplemental detail, never as the whole explanation. Do not expose credentials or raw server payloads. If no reference is available, say so. Route command-runner permission, proxy, and DNS failures through [connection diagnostics](connection.md). For remote service failures, provide the available reference and attempt details through the customer's established support channel. Do not invent a contact address.

Use [connection diagnostics](connection.md) to distinguish execution restrictions, unresolved connectivity, and remote service failures. A preflight failure does not establish a publication failure or an account-permission problem. Explain the observed limitation and one next action; ordinary MCP queries can remain available.

Report the actual result without treating an unknown outcome as a confirmed failure. A failed or unconfirmed upload does not block another user-requested upload and does not require support clearance. For a deliberate retry, prepare the ZIP again, obtain fresh artifact-scoped authorization, and publish directly in chat. Never reuse a consumed grant or start concurrent uploads. Do not retry automatically. If the problem persists, offer support with the diagnostic reference. Pending publication is not confirmed activation.
