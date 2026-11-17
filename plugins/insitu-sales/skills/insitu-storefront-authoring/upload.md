# Upload procedure

This is the only supported way to publish a storefront ZIP from chat. Every rule in the skill applies: explicit publication approval, an artifact-scoped grant from `authorizeStorefrontUpload`, the fixed endpoint, no automatic retry, and no credentials in command arguments, logs, or files. The steps need `curl` 7.55 or later and a SHA-256 tool. If either is missing, or the shell cannot feed standard input to a command, explain the missing capability and stop before requesting a grant.

The only endpoint is `https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases`. Never send the grant anywhere else, follow redirects, or turn off TLS verification.

## Prepare

The ZIP must be a regular file of at most 10 MiB with `index.html` at its root. Compute the lowercase hexadecimal SHA-256 digest and the exact byte size:

```text
shasum -a 256 <ZIP>      (or: sha256sum <ZIP>)
wc -c < <ZIP>
```

These are the `digest` and `size` for `authorizeStorefrontUpload`.

## Check the connection

```text
curl --silent --show-error --head --max-time 15 --output /dev/null --write-out "%{http_code}" https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases
```

Continue only on HTTP 2xx. Any other status or a transport error stops preparation; no upload was attempted.

## Publish

Before sending, confirm that the grant's `uploadUrl` equals the endpoint above, `expiresAt` is in the future, and `digest` and `size` equal a fresh digest and size of the ZIP. Otherwise stop: no upload was attempted, and a new preparation and authorization are needed.

Send one multipart request. The authorization travels as a header read from standard input, never as a command argument:

```text
curl --silent --show-error --max-time 120 --request POST \
  --header @- \
  --form-string "hostname=<grant.hostname>" \
  --form-string "digest=<grant.digest>" \
  --form "archive=@<ZIP>;type=application/zip;filename=storefront.zip" \
  --dump-header - \
  https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases <<'GRANT'
X-Storefront-Upload-Authorization: <grant.authorization>
GRANT
```

On a shell without here-documents, pipe that single header line to `curl` through its equivalent standard-input mechanism.

## Read the result

Accept a result only when the response `hostname` and `release.digest` equal the grant's values:

| HTTP | `status`                 | Meaning                                              |
| ---- | ------------------------ | ---------------------------------------------------- |
| 200  | `active`                 | Published and active                                 |
| 202  | `activation_pending`     | Uploaded; activation is still being verified         |
| 502  | `activation_unconfirmed` | Uploaded; activation could not be confirmed          |

Report `storefrontUrl` and `customDomain.status` when present. A 4xx or 5xx response with `error.code`, `error.stage`, and `error.outcome` is a service failure: `outcome` says whether the upload did not start or is unknown. Anything else, including a timeout, a mismatch, or an unreadable body, is an unknown outcome, not a confirmed failure. Give the user the `x-request-id` response header as the support reference. Do not show the authorization value or the raw response body.
