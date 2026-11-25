# Publication environment and connection diagnostics

Use this reference only for ZIP publication. Remote MCP queries can work from web clients without local execution. Do not run shell, DNS, or upload preflights for ordinary customer, product, sales, or company lookups. A successful MCP call does not establish that the command runner can reach the upload endpoint.

## Check the execution capabilities

Before requesting an upload grant, identify the available command runner and its effective file and network permissions. Verify that it can read the ZIP and use curl, a checksum tool, and HTTPS to `api.insitusales.com:443`. The [upload procedure](upload.md) supports a direct header when protected stdin is unavailable. Continue to the HEAD check without troubleshooting stdin.

ZIP publication usually needs Codex desktop, command-line, or IDE execution, or Claude Code, with those capabilities enabled. A web or mobile client with only remote MCP tools can query inSitu but cannot upload a local ZIP through this procedure. Explain the missing capability and preserve the prepared project for an execution-capable client. Continue unrelated MCP queries; do not ask the user to reconnect the plugin to repair command-runner networking.

Run the credential-free HEAD check in [the upload procedure](upload.md#check-the-connection) using the same command runner, curl executable, and permission context intended for upload. Retain its exit code, HTTP status, attempt time, and `x-request-id` when returned. Report only the relevant diagnostics, not raw headers or credentials. HTTP 2xx permits continuing to artifact authorization; it does not establish publication success.

## Diagnose before asking the user

When the check fails, use the observed tool denial, curl result, and effective host policy to choose the next action. Inspect only relevant, accessible settings; do not dump environment variables, proxy credentials, or entire client configuration files. Check the existing proxy or host allowlist when relevant. An OS DNS lookup is optional: it may use a different route from curl through a proxy, so it cannot replace the actual HEAD check.

| Evidence | Conclusion and next action |
| --- | --- |
| Command runner, ZIP access, curl, or checksum tool unavailable | Publication is unavailable in this execution context. State the missing capability and how to resume. |
| Explicit sandbox, network, host, or file denial | An execution permission blocks publication. Use the host's native approval mechanism if policy permits it. |
| curl 5 | The command runner could not resolve its configured proxy. Check the existing proxy route without exposing or changing credentials. |
| curl 6, ENOTFOUND, or EAI_AGAIN | Name resolution failed in this execution context. This alone does not prove a permission denial or a global inSitu DNS outage. Check the host policy and permitted DNS/proxy path. |
| curl 7 or 28 | The connection failed or timed out. Check the observed network/proxy restriction; do not infer a company authorization error. |
| curl 35 or 60 | TLS negotiation or certificate validation failed. Use the client's supported network configuration; never turn off TLS verification. |
| HTTP 407 or an explicit proxy rejection | The execution network or proxy requires access. Route the action to the user's network administrator, not inSitu account support. |
| HTTP 401 or 403 from the inSitu endpoint | HTTP was reached. Inspect the returned service message and reference; do not classify it as a local sandbox denial without evidence. |
| Other non-2xx HTTP from the inSitu endpoint | Report a remote preflight failure with the available reference. Do not request a grant or start an upload. |

## Use the current host's permission flow

- **Codex:** read the session's effective sandbox, network, and approval constraints. If allowed, request native approval for the HEAD check to `api.insitusales.com:443`. Reuse existing approval. If approvals are unavailable or managed policy denies the host, stop with that specific restriction and one action for the user or workspace administrator. Do not assume a particular permission menu or configuration key exists in every version.
- **Claude Code:** distinguish permission to execute Bash/curl from permission to reach the host through the sandbox proxy. If available and allowed, use the native command/domain approval flow for `api.insitusales.com`. A Bash approval alone does not prove network access. If managed restrictions deny access or prompts are unavailable, explain the blocked capability and the administrator action required.
- **Other clients:** use only the execution and approval mechanisms actually exposed by the host. If no suitable mechanism exists, stop publication and explain the execution requirement.

Do not grant yourself broader access, edit global or managed configuration, turn off the sandbox, request full access by default, bypass a proxy, substitute an IP address, or change DNS, hosting, or certificates. Do not promise that the skill can enable permissions. Current host policy takes precedence over this procedure.

After an approved permission change or a confirmed network correction, repeat only the credential-free HEAD check. Continue the original publication workflow on HTTP 2xx if its other requirements still hold. Recompute the artifact identity and request a fresh grant when needed. This diagnostic recheck does not authorize automatic upload retries, concurrent uploads, or reuse of a consumed grant.

## Give a specific handoff

Report in the user's language: the blocked capability or observed failure, whether the cause is confirmed or unresolved, what you checked, and one concrete next action. If stopped at preflight, say that no upload grant was requested and no upload started in this attempt. If no HTTP response arrived, say that no service reference was returned; do not invent one.

For a confirmed permission restriction, explain that the current execution environment lacks access and that the plugin's remote queries can remain available. Route local permission, proxy, and DNS issues to the user's client or network administrator. Do not send these automatically to inSitu support or label them as an inSitu outage. For an unresolved DNS failure, report that uncertainty instead of asserting missing permissions. Escalate a remote service failure through the existing support channel with the HTTP status and request reference when available.

Host references: [the Codex sandbox and permissions](https://learn.chatgpt.com/docs/agent-approvals-security), [Claude Code sandbox networking](https://code.claude.com/docs/en/sandboxing#network-isolation), and [Claude Code permissions](https://code.claude.com/docs/en/permissions). Apply the current session's capabilities rather than assuming these interfaces are identical across versions.
