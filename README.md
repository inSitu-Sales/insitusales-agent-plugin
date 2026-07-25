# inSitu Sales Agent Plugin

This repository contains the inSitu Sales plugin and MCP configuration for Codex and Claude Code.

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
codex plugin add insitu-sales@insitu-sales
```

For Claude Code, register this repository as a plugin marketplace and install the inSitu Sales plugin:

```bash
claude plugin marketplace add /path/to/insitusales-agent-plugin
claude plugin install insitu-sales@insitu-sales
```

For other MCP clients, add the MCP server directly:

```bash
claude mcp add --transport http insitu_sales https://api.insitusales.com/mcp
```

After the server is added, instruct the user to authenticate with their inSitu Sales credentials. The MCP server requires OAuth, so it may appear disconnected or return `401 Authentication required` until the user logs in.

## Install In Codex

Clone this repository, then register its marketplace with Codex:

```bash
codex plugin marketplace add /path/to/insitusales-agent-plugin
codex plugin add insitu-sales@insitu-sales
```

After installing, start a new Codex thread so the plugin tools are loaded.

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

## Contents

```text
.mcp.json
.claude-plugin/marketplace.json
.agents/plugins/marketplace.json
plugins/insitu-sales/.claude-plugin/plugin.json
plugins/insitu-sales/.codex-plugin/plugin.json
plugins/insitu-sales/.mcp.json
plugins/insitu-sales/assets/
```

## Legal

Privacy policy and terms are available at:

```text
https://www.insitusales.com/end-user-license-agreement
```
