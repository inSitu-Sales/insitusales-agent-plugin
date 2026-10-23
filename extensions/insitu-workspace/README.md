# Native inSitu Sales plugin extension

This implements OpenAI Plugin Extensions: an **inSitu Sales sidebar app** (`global`) and a **conversation panel** (`thread`) backed by the same MCP App. The sidebar opens a home page with six suggested starting points: customers, sales orders, invoices, sales insights, catalog lookup and website redesign. Choosing a card appends an editable draft to the regular ChatGPT/Codex input without submitting it. The home page has no custom chat box; the user sends from the native composer. On desktop, the global entrypoint has its own host conversation; the thread entrypoint uses its existing conversation. Customer questions and operations use the authenticated business tools. Website redesign uses the authoring skill and preview panel.

There are no customer-management screens, dashboards, sales forms or workflow tabs. The local pages simulate host surfaces for development; they do not install the native sidebar entry.

## What is implemented

- A conversational local demo with a website preview; try “make it dark” or “make it compact”. These deterministic sample changes demonstrate the interaction, not a hosted AI website builder.
- Two read-only MCP tools: `openInsituWorkspace` (the retained tool name for opening the website preview) and `renderInsituPortalPlan`.
- Global sidebar and conversation-panel entrypoints, titled **inSitu Sales**. The opening tool accepts the empty arguments required by both entrypoint types.
- OpenAI MCP Extensions SDK draft insertion into the entrypoint’s active native composer (`target: "active", send: false`). Hosts without draft support receive a clear explanation; there is no fallback that auto-submits a card prompt. Both fullscreen and inline display modes are declared.
- Host-synchronized light/dark themes, semantic colors, readable dark surfaces and dynamic theme updates. Storefront preview styling remains a separate design choice.
- Desktop/mobile preview sizes, source-scoped results, HTTPS built-preview links and optional review action when a build/artifact exists.
- Packaged skill guidance for using existing business tools in chat and the existing storefront-authoring workflow for website changes.

The native chat is provided by ChatGPT/Codex. Website creation and redesign still use the installed storefront-authoring skill and local source/build tools. A layout proposal is labeled as a proposal; publishing requires an actual reviewed build and approval of the exact artifact.

## Run locally

Requires Node 22+ (the OpenAI extension SDK requirement).

```sh
cd extensions/insitu-workspace
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm test
npm run preview
```

Conversation simulator: `http://127.0.0.1:4317/`. Sidebar simulator: `/sidebar`. Actual component: `/widget`. Presentation-only development MCP: `/mcp`. The demo uses sample data and makes no live account changes.

## Package the main desktop plugin

The main plugin now bundles the presentation server and compiled HTML alongside its production remote connection. From this directory run:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run package:plugin
node --test tests/main-package.test.mjs
```

Commit `plugins/insitu-sales/server/` and `plugins/insitu-sales/ui/` with the source changes. Marketplace installation copies only the plugin directory; it does not run a build. The bundled server needs Node.js 22+ on the desktop app's PATH, but no installed npm packages. Its configuration lives in `plugins/insitu-sales/.codex-mcp.json`; sales and account authentication stay on the production MCP. The independent `insitu-workspace` skill covers the desktop interface; `insitu-storefront-authoring` covers B2B implementation and publication.

After distributing and updating the main plugin, restart the desktop app, then run `node verify-install.mjs` to verify the runtime discovers `insitu_home` and its resources. Sidebar visibility must also be checked in the actual client. The separate development package below remains optional for isolated UI development.

## Install the development home page in Codex

For desktop testing without deploying the backend, build a separate local plugin that pairs the home page with the existing registered inSitu Sales connection:

```sh
npm run build
node prepare-dev-plugin.mjs
codex plugin marketplace add ./local-marketplace
codex plugin add insitu-home-dev@insitu-development
```

The resulting **inSitu Sales Home (Dev)** package includes a standalone stdio presentation server, the native home page, the authoring skills, and the same registered app mapping as the installed public inSitu plugin. It uses the compatibility manifest layout; this desktop runtime skipped the bundled server when the generated portable root manifest took precedence. It does not copy credentials or include the simulated chat host. Codex starts the presentation server itself; Node 22+ must be available as `node` on its PATH. The plugin uses a bare executable name because the Agent Plugins loader rejects absolute command paths. The browser demo does not need to run. Account data continues through the authenticated inSitu connection.

Run `node verify-install.mjs` after installation. On this Mac it uses the CLI bundled inside the desktop app, rather than whichever `codex` happens to be on the shell path. You can pass another executable as its first argument. It verifies the runtime discovers the server and can start it, list the global/thread entrypoints and read the current home page. A terminal CLI check alone does not establish desktop discovery.

Quit and reopen the desktop app after installation. Look for **inSitu Sales** in the sidebar, or find **inSitu Sales Home (Dev)** under **Plugins → inSitu Development**. The documented desktop deep link is `codex://plugins/insitu-home-dev@insitu-development/app/openInsituWorkspace`. Start with a read-only request to confirm the connected company and find a customer. Website authoring still depends on the account's pilot permissions and the local authoring environment.

To refresh the development install after a home-page change, rebuild, run `prepare-dev-plugin.mjs`, reinstall with the same `codex plugin add` command, then reopen the desktop app. To remove only this test install, run `codex plugin remove insitu-home-dev@insitu-development`.

The install test in `tests/dev-package.test.mjs` starts the actual packaged server from an unrelated working directory and checks native entrypoints, the home-page resource, and registered connection mapping. It skips when the generated package is absent.

## Backend integration

Build, then sync the component to the backend checkout:

```sh
node install-backend.mjs /absolute/path/to/st_backend_insitusales_b2bportal --update --apply
```

For a first installation omit `--update`. The installer copies the module and built UI and registers the preview tools in `mcp/graphql-mcp.http.js`. Existing OAuth and business tools stay in their current routes. The feature remains disabled unless `MCP_WORKSPACE_EXTENSION_ENABLED=true`; the installer does not enable, restart or deploy anything.

For native acceptance, run an authenticated staging backend with that flag enabled and connect it as a development plugin using the [official connection flow](https://developers.openai.com/plugins/deploy/connect-chatgpt). Refresh tool discovery after changing metadata. Install the complete plugin and authenticate to inSitu, then verify **inSitu Sales** appears in global navigation and as a content tab inside a conversation. A bare CLI MCP registration is not proof of native sidebar installation. Verify the launcher, sending a message, real customer lookup, and a website preview in the installed client. Local repository edits do not update a published plugin listing.

No hosted authoring service, production deployment, real mutation testing or publication is included. The existing local authoring workflow is the path for creating or improving an actual website.

[Extension reference](https://developers.openai.com/plugins/build/extensions) · [MCP UI](https://developers.openai.com/plugins/build/chatgpt-ui) · [Connect and test](https://developers.openai.com/plugins/deploy/connect-chatgpt)
