# inSitu Sales for Microsoft 365 Copilot

This project packages the existing inSitu Sales MCP as a Microsoft 365 Copilot
declarative agent. Users open **inSitu Sales** in Copilot, sign in with their
inSitu credentials when prompted, and ask questions about their account.

The remote endpoint is `https://api.insitusales.com/mcp`. Authentication uses
Microsoft's Dynamic Client Registration configuration and `OAuthPluginVault`.
Microsoft manages the OAuth client credentials; users do not enter client IDs or
secrets. Our backend continues to require PKCE S256. No backend settings, ngrok
exceptions, database configuration or production deployment changes are included.

## Prepare and validate

Requires Node.js 22 or later and a Microsoft 365 tenant where you can use Copilot
and upload custom apps. Microsoft 365 Agents Toolkit CLI 1.1.17 is pinned in this
project; the corresponding VS Code extension is recommended by `.vscode`.

```sh
cd microsoft-365-copilot
npm ci
cp env/.env.dev.example env/.env.dev
npm run validate
```

`validate` checks the official Microsoft schemas for the app, declarative agent,
MCP plugin and provisioning lifecycle; file references; DCR wiring; dynamic tool
discovery; publisher metadata; and PNG icon dimensions. It downloads the pinned
schema versions on first use and caches them in the ignored `.validation` folder.
It uses synthetic IDs only in memory to check template syntax. It does not
create a deployable ZIP, register a Microsoft app or access account data.

## Install in your test tenant

```sh
npm run signin
npm run provision
npm run package
```

Sign in with the work account for the tenant where you want to test. Provisioning
creates a Microsoft app, registers its DCR authentication configuration, validates
the package, and makes the test agent available to the signed-in user. It uses
the normal Microsoft Toolkit lifecycle and requires tenant permissions. The DCR
configuration is scoped to this app and the home tenant. The test name is
**inSitu Sales (Test)**.

Actual app and OAuth configuration IDs are written to ignored `env/.env.dev`.
Leave them empty in the example file; do not substitute placeholder values.
`npm run package` rejects missing IDs instead of producing an apparently
installable package with fake authentication. The provisioned package is under
`appPackage/build/appPackage.dev.zip`. Do not copy this test-tenant auth config
into another customer's package.

Open <https://m365.cloud.microsoft/chat>, select **inSitu Sales (Test)** in Agents,
and ask:

> Show my latest five sales orders from inSitu Sales, with customer, date, status
> and total. Use actual connected data and tell me if a tool call fails.

Select the inSitu sign-in prompt when it appears. Complete sign-in in that
window. Do not put passwords or tokens into Copilot chat. Confirm that a real
MCP tool executes and returns expected records for the connected account.

You can also open this directory as its own VS Code workspace, install the
recommended Microsoft 365 Agents Toolkit extension, select the `dev` environment,
and use its **Provision** and **Preview in Copilot** actions. No local backend
server is needed: this agent uses the existing production MCP endpoint.

## Initial behavior and checks

The agent discovers the server's tools dynamically. It retrieves customers,
sales, product pricing, inventory, visits and statements as supported by those
tools. It asks for clarification when records or required inputs are ambiguous.
Its instructions require explicit confirmation before writes or document-number
allocation. These are agent instructions; backend authorization remains the
authority for data access and tool permissions.

The scenarios in `evals/prompts.json` cover live retrieval, customer disambiguation,
warehouse inputs, write confirmation, company boundaries and statement delivery.
They have not been executed in Copilot. Before broader distribution, verify:

- First-time inSitu sign-in, returning-user access and token refresh.
- Correct customer/company records and a real tool call, rather than sign-in alone.
- Ambiguous records and unavailable fields are handled without invented data.
- Writes require confirmation; uncertain results are not blindly retried.
- Customer statement delivery works in Copilot's actual file UI.

## Microsoft tenant sign-in blocker

During setup on September 30, 2026, Microsoft's Toolkit sign-in returned
**AADSTS500014** for the resource `https://api.spaces.skype.com`: its service
principal is disabled in the selected tenant. Microsoft's message says this can
mean the subscription has lapsed or an administrator disabled the application.
This prevents Toolkit authentication and tenant installation. The tenant
administrator needs to check the relevant service and subscription, or use a
different enabled test tenant. No tenant policies, subscriptions or service
principals were changed by this project.

After that is resolved, retry `npm run signin`, then the provision/package steps.
Keep PKCE enabled; changing inSitu OAuth does not fix this Microsoft tenant error.

## Distribution after testing

`npm run provision` installs the development agent for testing. The separately
defined `publish` lifecycle submits the agent to the tenant catalog and should
be run only when the tested version is ready for organizational distribution.
For customers in other organizations, prepare their supported installation and
authentication configuration, or pursue Microsoft Marketplace certification.
Public Marketplace publication has not been performed.

## Evidence as of September 30, 2026

- Local app, agent, plugin and lifecycle schema validation: passed.
- Production OAuth discovery and protected-resource metadata: HTTP 200.
- Unauthenticated production MCP: HTTP 401 with the correct discovery challenge.
- Microsoft tenant provisioning, inSitu login from Copilot, token refresh and
  real tool execution: not verified; blocked by the Microsoft sign-in error.

## References

- [Build a Copilot agent from an MCP server](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/build-mcp-plugins)
- [Configure dynamic client registration](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-dynamic-client-registration)
- [Microsoft 365 Agents Toolkit CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/microsoft-365-agents-toolkit-cli)
- [Publishing and distribution](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/publish)
