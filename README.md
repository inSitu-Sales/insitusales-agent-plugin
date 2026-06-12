# inSitu Sales Agent Plugin

This repository contains the inSitu Sales plugin and MCP configuration for Codex and Claude.

The plugin connects agents to the inSitu Sales MCP server:

```text
https://api.insitusales.com/mcp
```

## Agent Instructions

When helping a user install this plugin, use the plugin marketplace flow when the client supports plugins.

For Codex, register this repository as a plugin marketplace and install the inSitu Sales plugin:

```bash
codex plugin marketplace add /path/to/insitusales-agent-plugin
codex plugin add insitu-sales@insitu-sales
```

For Claude Code or other MCP clients, add the MCP server directly:

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

Claude Code can read the shared project MCP config from `.mcp.json`.

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
.agents/plugins/marketplace.json
plugins/insitu-sales/.codex-plugin/plugin.json
plugins/insitu-sales/.mcp.json
plugins/insitu-sales/assets/
```

## Legal

Privacy policy and terms are available at:

```text
https://www.insitusales.com/end-user-license-agreement
```
