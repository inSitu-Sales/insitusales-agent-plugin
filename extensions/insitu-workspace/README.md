# Prompt directory

The interface is a directory of editable prompts. It includes suggestions for customer accounts, sales orders, invoices, sales analysis, and catalog lookup. The B2B card opens a modal with **Create a B2B portal** and **Send the project ZIP**.

Selecting a prompt adds it to the active native composer with `send: false`. The user edits and sends it. Opening the directory or the B2B modal does not call business tools. Selecting a B2B prompt closes the modal. The close button, Escape, and the backdrop dismiss it without selecting a prompt. The interface does not read projects, display website previews, track publication, or send ZIP files. Business workflows run through the agent after the user sends a request.

The authenticated remote MCP owns the global and thread entrypoints. The local MCP serves the same prompt directory on an explicit tool call and retains the agent's project and ZIP tools. It does not register navigation entries. This avoids two sidebar icons when both connections are installed.

## Build and verify

Requires Node.js 22 or later. Run these commands from this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run package:plugin
npm test
npm run preview
```

The preview at `http://127.0.0.1:4317/` simulates the native composer and loads the directory in an iframe. It rejects automatic submission and business-tool calls. It has no account connection. `/widget` serves the component, and `/mcp` exposes its read-only opener for development.

`package:plugin` builds the HTML and local server into `plugins/insitu-sales/`. Include these generated files with the source when releasing the plugin. Installation does not compile the source. Rebuild and update the installed plugin through the host before restarting it; a restart alone does not replace an installed version.

The local connection retains `prepareStorefrontRelease`, `publishStorefrontRelease`, `registerStorefrontProject`, and `listStorefrontProjects` for agent use. These tools do not open the directory. Existing project records stay in `PLUGIN_DATA/storefronts-v1`.

## Update the remote interface

Build the plugin, then sync the shared presentation module and HTML to the backend checkout:

```sh
node install-backend.mjs /absolute/path/to/st_backend_insitusales_b2bportal --update --apply
```

The remote interface requires `MCP_WORKSPACE_EXTENSION_ENABLED=true`. The installer changes source files only; it does not enable the feature, restart a service, or deploy. Deploy the backend through its release process, then refresh plugin discovery. Verify draft insertion and the single sidebar entry in the actual host.

Both MCP servers previously advertised the same global entrypoint while serving different HTML versions. The local server now omits entrypoint metadata. Updating only the local source does not change the remote interface or an installed plugin cache.

## Optional development package

For an isolated package, run `node prepare-dev-plugin.mjs` after building. It includes the same prompt directory and registered account dependency without copying credentials. The local package has no sidebar entrypoint; open it through `openInSituWorkspace` in its conversation.

Use the host's supported plugin installation flow. `node verify-install.mjs` checks the installed local server and resource; host rendering and remote deployment remain separate acceptance checks.
