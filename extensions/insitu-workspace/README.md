# Prompt directory

The interface is a directory of editable prompts. It includes suggestions for customer accounts, sales orders, invoices, sales analysis, and catalog lookup. The B2B card opens a modal with **Create a B2B portal** and **Send the project ZIP**.

Selecting a prompt adds it to the active native composer with `send: false`. The user edits and sends it. Opening the directory or the B2B modal does not call business tools. Selecting a B2B prompt closes the modal. The close button, Escape, and the backdrop dismiss it without selecting a prompt. The interface does not read projects, display website previews, track publication, or send ZIP files. Business workflows run through the agent after the user sends a request.

The authenticated remote MCP serves the prompt directory and owns the global and thread entrypoints. OpenAI and Claude production plugins connect only to that remote MCP. ZIP publication uses the script bundled with the storefront skill.

## Build and verify

Requires Node.js 22 or later. Run these commands from this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run package:plugin
npm test
npm run preview
```

The preview at `http://127.0.0.1:4317/` simulates the native composer and loads the directory in an iframe. It rejects automatic submission and business-tool calls. It has no account connection. `/widget` serves the component, and `/mcp` exposes its read-only opener for development.

`package:plugin` builds the shared HTML into `plugins/insitu-sales/ui/`. It does not bundle a local MCP server. Include the generated HTML when updating the remote presentation. Rebuild and update the installed plugin through the host before testing skill changes; a restart alone does not replace an installed version.

## Package for OpenAI

```sh
npm run package:openai -- /absolute/path/to/insitu-sales-openai.zip
```

Requires the `zip` command and a new output path. The archive includes the OpenAI manifests, HTTPS MCP configuration, skills, and assets. It excludes other hosts' manifests and the local server. OpenAI connects only to the backend MCP; the authoring skill retains its upload helper for clients with local execution. The backend cannot read a user's filesystem path. Remote sales and the prompt directory do not require the helper.

## Update the remote interface

Build the plugin, then sync the shared presentation module and HTML to the backend checkout:

```sh
node install-backend.mjs /absolute/path/to/st_backend_insitusales_b2bportal --update --apply
```

The remote interface requires `MCP_WORKSPACE_EXTENSION_ENABLED=true`. The installer changes source files only; it does not enable the feature, restart a service, or deploy. Deploy the backend through its release process, then refresh plugin discovery. Verify draft insertion and the single sidebar entry in the actual host.

Updating only the local source does not change the remote interface or an installed plugin cache.

## Optional development package

For an isolated package, run `node prepare-dev-plugin.mjs` after building. It includes the same prompt directory and registered account dependency without copying credentials. The local package has no sidebar entrypoint; open it through `openInSituPromptDirectory` in its conversation.

Use the host's supported plugin installation flow. `node verify-install.mjs` checks the installed local server and resource; host rendering and remote deployment remain separate acceptance checks.
