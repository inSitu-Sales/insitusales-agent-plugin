# inSitu Sales Agent Plugin

This repository contains the inSitu Sales plugin and MCP configuration for Codex, Claude Code, Cursor, GitHub Copilot, and Microsoft 365 Copilot.

The plugin connects agents to the inSitu Sales MCP server:

```text
https://api.insitusales.com/mcp
```

## Install In Claude / Cowork (for inSitu Sales customers)

Customers connecting their own inSitu Sales data don't need to clone this repository or use a CLI. Any paid Claude plan (Pro, Max, Team, or Enterprise) can add it directly from the app:

1. Open **Customize** (in the left sidebar, or under the **Cowork** tab in Claude Cowork) and go to the **Plugins** tab.
2. In the **Personal plugins** section, click the **+** button and choose **Add marketplace**.
3. Select **Add from a repository** and enter:

   ```text
   inSitu-Sales/insitusales-agent-plugin
   ```

4. Once the marketplace loads, click **Install** on the **inSitu Sales** plugin.
5. When prompted, authenticate with your inSitu Sales credentials. The connection may show as failed or disconnected until you complete sign-in — this is expected, since the MCP server requires OAuth.

After installing, the inSitu Sales skills and MCP tools are available in chat and in Cowork.

<!--
Maintainers: this repository must stay public for the flow above to work.
Customers add the marketplace directly from the GitHub repo, and Claude/Cowork's
"Add from a repository" and community-marketplace submission paths both require
a public repo. Making this repo private restricts it to internal, org-admin-managed
distribution only (see "Manage plugins for your organization" in the Claude Help Center)
and breaks self-service install for customers.
-->

## Agent Instructions

When helping a user install this plugin, use the plugin marketplace flow when the client supports plugins.

For Codex, register this repository as a plugin marketplace and install the inSitu Sales plugin:

```bash
codex plugin marketplace add /path/to/insitusales-agent-plugin
codex plugin add app-6a7ca3b899bc81918a6ab1af007a82d6@insitu-sales
```

For Claude Code, register this repository as a plugin marketplace and install the inSitu Sales plugin:

```bash
claude plugin marketplace add /path/to/insitusales-agent-plugin
claude plugin install insitu-sales@insitu-sales
```

For Cursor, install the plugin from **Customize** after it is available in the public or team marketplace. During local development, load `plugins/insitu-sales` from Cursor's local plugin directory as described below.

For other MCP clients, add the MCP server directly:

```bash
claude mcp add --transport http insitu_sales https://api.insitusales.com/mcp
```

After the server is added, instruct the user to authenticate with their inSitu Sales credentials. The MCP server requires OAuth, so it may appear disconnected or return `401 Authentication required` until the user logs in.

## Install In Codex

Clone this repository, then register its marketplace with Codex:

```bash
codex plugin marketplace add /path/to/insitusales-agent-plugin
codex plugin add app-6a7ca3b899bc81918a6ab1af007a82d6@insitu-sales
```

The desktop plugin includes a local home-page MCP and the production sales connection. Node.js 22+ must be available as `node` on the desktop app's PATH. After updating, restart the desktop app to reload navigation and start a new chat. Open **inSitu Sales** from the sidebar, or ask directly in chat to create your B2B storefront. Selecting a home-page suggestion prepares a draft in the native composer; send it to begin.

## Install In Claude Code

Claude Code can install this repository as a plugin marketplace from `.claude-plugin/marketplace.json`.

Clone this repository, then register and install the plugin:

```bash
claude plugin marketplace add /path/to/insitusales-agent-plugin
claude plugin install insitu-sales@insitu-sales
```

Reload plugins or start a new Claude Code session after installing:

```text
/reload-plugins
```

Claude Code can also read the shared project MCP config from `.mcp.json`.

Clone this repository, then start Claude Code from the repository root:

```bash
cd /path/to/insitusales-agent-plugin
claude
```

Claude Code will ask you to approve the project-scoped MCP server before using it.
Because the inSitu Sales MCP server requires OAuth, open Claude Code's MCP menu and authenticate the server:

```text
/mcp
```

Before authentication, Claude may show the server as failed or disconnected. That is expected: the server returns `401 Authentication required` until the user signs in.

You can also install the same server directly in Claude Code:

```bash
claude mcp add --transport http insitu_sales https://api.insitusales.com/mcp
```

For a team-shared Claude Code config, run this from the repository root instead:

```bash
claude mcp add --transport http --scope project insitu_sales https://api.insitusales.com/mcp
```

Check that Claude sees the server:

```bash
claude mcp get insitu_sales
```

## Install In Cursor

Cursor can read this repository as a multi-plugin marketplace from `.cursor-plugin/marketplace.json`. The plugin uses Cursor's `mcp.json` format and prompts users to authenticate with their inSitu Sales credentials when the MCP server is first used.

For a public Marketplace installation after the plugin is approved:

1. Open **Customize** in Cursor.
2. Search for **inSitu Sales**.
3. Click **Install** and choose a user or project scope.
4. Complete the inSitu Sales sign-in when prompted.

Teams and Enterprise administrators can import this GitHub repository from **Dashboard → Plugins → Add Marketplace → Import from Repo**, then make the plugin available to their team.

To test the plugin from a local checkout before publishing, link the plugin package into Cursor's local plugin directory:

```bash
mkdir -p ~/.cursor/plugins/local
ln -s /path/to/insitusales-agent-plugin/plugins/insitu-sales ~/.cursor/plugins/local/insitu-sales
```

Restart Cursor or run **Developer: Reload Window**, then verify that **inSitu Sales** and its MCP tools appear in **Customize**. Remove an existing link before recreating it.

## Install In Microsoft 365 Copilot

This repository includes a declarative agent project for Microsoft 365 Copilot. Its local templates are validated; tenant installation and live tool execution are still pending. Users need a Microsoft 365 Copilot license and an inSitu Sales account, and their Microsoft 365 administrator adds the agent for the organization.

1. After tenant testing and authentication configuration are complete, obtain the app package for the target tenant from inSitu Sales.
2. A Microsoft 365 administrator uploads it as a custom app in the Microsoft 365 admin center and assigns it to users.
3. Users open https://m365.cloud.microsoft/chat, select **inSitu Sales** under **Agents**, and sign in with their inSitu Sales credentials when prompted.

The project that builds the package is in [`microsoft-365-copilot/`](microsoft-365-copilot/README.md).

## Install In Microsoft Copilot Studio

To use inSitu Sales tools in an agent you build in Copilot Studio:

1. Open your agent and select **Tools** → **Add a tool** → **Model Context Protocol**.
2. Enter the server URL `https://api.insitusales.com/mcp`.
3. Choose OAuth 2.0 with **Dynamic discovery** as the authentication type.
4. Create the connection and sign in with your inSitu Sales credentials.

## Install In GitHub Copilot CLI

GitHub Copilot CLI reads this repository's plugin marketplace. Register it and install the plugin:

```bash
copilot plugin marketplace add inSitu-Sales/insitusales-agent-plugin
copilot plugin install insitu-sales@insitu-sales
```

Start a new Copilot CLI session, then authenticate the inSitu Sales MCP server with your inSitu Sales credentials when prompted.

## Install In VS Code

[Install the inSitu Sales MCP server in VS Code](https://vscode.dev/redirect/mcp/install?name=insitu_sales&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fapi.insitusales.com%2Fmcp%22%7D), or add it from the command line:

```bash
code --add-mcp '{"name":"insitu_sales","type":"http","url":"https://api.insitusales.com/mcp"}'
```

VS Code prompts you to sign in with your inSitu Sales credentials the first time GitHub Copilot uses the server.

## Contents

```text
.mcp.json
.claude-plugin/marketplace.json
.agents/plugins/marketplace.json
.cursor-plugin/marketplace.json
plugins/insitu-sales/.claude-plugin/plugin.json
plugins/insitu-sales/.codex-plugin/plugin.json
plugins/insitu-sales/.cursor-plugin/plugin.json
plugins/insitu-sales/.mcp.json
plugins/insitu-sales/.codex-mcp.json
plugins/insitu-sales/mcp.json
plugins/insitu-sales/README.md
plugins/insitu-sales/assets/
plugins/insitu-sales/skills/insitu-storefront-authoring/SKILL.md
plugins/insitu-sales/skills/insitu-storefront-authoring/scripts/upload-storefront.js
chatgpt-app-submission.json
microsoft-365-copilot/
```

## Storefront authoring

The package includes `plugins/insitu-sales/skills/insitu-storefront-authoring/SKILL.md` and its standalone Node.js upload helper. Use this workflow in a local coding environment with file access, Node.js, ZIP creation, and outbound HTTPS. The skill has no company allowlist or account-eligibility preflight. Backend administrator permission and hostname ownership remain authoritative for publication.

The existing sales connection stays unchanged. ChatGPT web/mobile execution and Claude/Cursor skill discovery need separate acceptance testing. Updating this repository does not establish that an approved ChatGPT listing has imported the new skill package.

Run the dependency-free package checks from the repository root:

```bash
node --test tests/*.node.test.cjs
```

These checks cover package paths, access instructions, connection/version consistency, the submission tool catalog, and helper preparation/expired-grant rejection. They do not replace a fresh installed-agent authoring test or live publication acceptance.

## Chat extension development

The chat-and-website-preview extension is in [`extensions/insitu-workspace/`](extensions/insitu-workspace/README.md). It declares a native **inSitu Sales** global sidebar app and conversation-panel entrypoint using OpenAI Plugin Extensions. Users can chat with inSitu and preview website redesigns in the host. The main desktop plugin bundles its presentation MCP and HTML; maintainers rebuild both with `npm run package:plugin` in that directory and commit the generated plugin files before release. The optional remote backend integration remains behind `MCP_WORKSPACE_EXTENSION_ENABLED`; it is not needed for the bundled desktop interface.

## ChatGPT submission maintenance

`chatgpt-app-submission.json` contains tool annotations, justifications, and review scenarios. Preserve the existing sales tools when adding capabilities. The two storefront authoring actions are available to verified company-user accounts without a company allowlist; they do not expose buyer commerce through MCP. Upload authorization does not itself upload or publish content. Its destructive annotation conservatively represents delegated authority to replace a public storefront and matches the server's mutation annotation.

Before submitting an update, compare these entries with authenticated company-user discovery and verify that buyer and mobile accounts retain only the existing sales tools. Review scenarios are acceptance expectations, not evidence that live tests have passed. Updating this file, opening a PR, or installing the plugin does not submit an app update or refresh ChatGPT's imported tool catalog. Confirm the supported submission or connector-refresh process separately. The ChatGPT connector does not install the local skill or upload helper.

## Legal

Privacy policy and terms are available at:

```text
https://www.insitusales.com/en/end-user-license-agreement/
```
