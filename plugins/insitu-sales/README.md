# inSitu Sales

inSitu Sales helps manufacturers, wholesalers, and distributors run field sales, van sales, and DSD operations from a conversation with your AI assistant. Find customers and products; review pricing, inventory, visits, orders, estimates, and invoices; generate customer statements; get order recommendations; and create or update sales records.

inSitu Sales connects with ERP and accounting systems, including QuickBooks Enterprise, QuickBooks Online, Odoo, NetSuite, SAP Business One, Xero, and Microsoft Dynamics 365 Business Central, so sales and operational data come together in one workflow.

## Use it

1. Add the **inSitu Sales** plugin.
2. Connect the **inSitu Sales** MCP server and sign in with your existing inSitu Sales credentials. Until you sign in, the server may show as disconnected or needing authentication.
3. Ask your assistant about your sales data, for example:
   - "Show me today's invoices"
   - "What were my top-selling products last week?"
   - "Create an order for this customer with last month's items"

You need an inSitu Sales account. Each organization sees only the business data and workflows its users are authorized to access.

## Data

The plugin connects your AI assistant to the inSitu Sales MCP server at `https://api.insitusales.com/mcp` over HTTPS. Your requests, and the customer, product, and sales records needed to answer them, are exchanged with your inSitu Sales account through that server. Sign-in uses OAuth with your inSitu Sales credentials. The sales tools run remotely. The optional storefront-authoring skill includes a local Node.js upload helper and creates source files, test artifacts, and ZIP archives in the workspace you approve. The local uploader receives only a short-lived authorization for one exact ZIP, not your general account token. Keep that authorization out of source files and generated storefronts.

See the inSitu Sales privacy policy and terms: https://www.insitusales.com/en/end-user-license-agreement/

## Desktop home page

The Codex desktop package includes a local companion MCP (`insitu_home`) for agent tools and explicit prompt-directory calls. It requires Node.js 22 or later on the desktop app's PATH. The remote MCP serves the sidebar and conversation entrypoints. Updating the local plugin does not update the remote interface; deploy that presentation through the backend release process.

The interface is a prompt directory. Its B2B group offers two suggestions: create a portal and send a project ZIP. Selecting a suggestion adds an editable, unsent draft to the native composer. It does not read projects, display website previews, or run uploads. The remote MCP owns the sidebar entrypoint; the local companion does not register a duplicate. Business tools and authentication continue through `https://api.insitusales.com/mcp`. The local MCP retains the agent's project and ZIP tools. Use `insitu-workspace` for directory navigation and `insitu-storefront-authoring` for B2B creation, verification, and publication. Clients without local execution can use the remote tools and the supported helper workflow.

## Publish a ZIP from chat

The Claude plugin manifest adds the local `insitu_home` MCP alongside the remote sales connection from `.mcp.json`. Claude starts the bundled server with `${CLAUDE_PLUGIN_ROOT}`; it needs Node.js 22 or later on PATH. Project and publication records use `${CLAUDE_PLUGIN_DATA}` through the server's `PLUGIN_DATA` variable, outside the installed plugin files.

Ask the assistant to publish your storefront ZIP in chat. It prepares the local file, requests a temporary artifact-scoped grant through the authenticated remote connection, and sends the ZIP with the local MCP. This flow does not require a visual plugin interface or a second account sign-in. The local server does not receive the general OAuth token. Update the installed plugin and reload it before testing. File and network access remain subject to the host's permissions.

## Local storefront authoring

In a coding environment that supports packaged skills, use `insitu-storefront-authoring` to create a static B2B buyer storefront. Company-user accounts can use `getStorefrontCompany` and `authorizeStorefrontUpload` without a company allowlist. Existing sales tools remain available. Call `getStorefrontCompany` without identity arguments to discover the authenticated company's registered URL and authoring context; users do not need to supply technical hostnames. The service checks current administrator permission. Registration is not proof of publication.

In Codex, mention **@inSitu Sales** and ask to create your B2B storefront in English or Spanish. You do not need to name the skill. The Codex manifest includes bilingual storefront starters in `interface.defaultPrompt`, alongside the existing sales suggestions. They request a preview before publication approval; they do not start work automatically. Display depends on the host and installed package. See [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins#add-openai-specific-metadata).

Business tool definitions come from the connected remote server. The desktop presentation tools come from the bundled local MCP. If company discovery still requires a hostname, refresh the connection and test in a new conversation. The current operation accepts no identity selectors. An argument-free `Company unavailable` response is a separate backend access denial; support must verify the authenticated company and its eligibility. Do not supply a guessed hostname or treat a package update as an authorization fix.

The workflow needs filesystem access, Node.js, ZIP creation, and outbound HTTPS. Installing the plugin does not supply these capabilities in ChatGPT web or mobile. The skill checks local execution capabilities, not account eligibility. Plain HTML/CSS/JavaScript needs no package installation. Publication requires explicit approval to publish the selected project to its authenticated storefront; missing or uncertain results must not trigger automatic retries.

The skill is included in the public package, but the backend still enforces administrator permission and hostname ownership for publication. A locally packaged skill is not proof that an approved ChatGPT listing has imported that version.

## Support

Visit https://www.insitusales.com/ for help with your inSitu Sales account.
