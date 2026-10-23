# Simplified chat and website preview QA

## Dark mode and native composer revision

Version `0.4.1-dev.1` removes the custom message form from the native home page. A card uses the negotiated OpenAI message extension with `target: "active", send: false`, appending an editable draft in the host composer. Missing draft support reports a limit and never falls back to automatically submitting a prompt. Verified in the bridge simulator that a card fills the host composer without generating a chat response, and preserves an existing draft. The native widget contains no textboxes on its home screen.

Theme initialization and subsequent host-context changes now apply the host theme and style variables. Neutral surfaces, text, borders, hover/focus colors, and icon tints have explicit light/dark values; storefront preview styling remains independent. Verified initial dark mode and a live change to light mode. Evidence: `evidence/home-dark-native-composer.png` is the local simulator. The simulator was updated to preserve `openai/message` metadata so it exercises draft behavior rather than stripping those options.

Installed the updated development package and retained the existing registered inSitu connection. Desktop runtime/server verification and nine extension checks pass; direct interaction with Codex's own native composer remains a user acceptance check because computer use cannot control that app.

## Local Codex installation

Correction after desktop restart: the shell CLI (0.146.0) loaded the bundled server, but the desktop CLI (0.163.0-alpha.11.2) skipped it. Removing the generated portable root manifest and using the compatibility layout restored server discovery in the desktop runtime. Version `0.4.0-dev.2` was installed with the desktop's own CLI. `verify-install.mjs` now checks that exact runtime's resolved configuration, launches the installed server, confirms global/thread entrypoints, and reads the current home page. Native sidebar visibility remains a visual acceptance step after app reload. The prior install checks below did not establish desktop discovery.

Installed and enabled `insitu-home-dev@insitu-development` version `0.4.0-dev.1`. The generated package contains the native home page, standalone presentation server, packaged skills and registered inSitu app mapping. No credentials are copied. Verified the installed server using the actual command, arguments and working directory returned by `codex mcp list`; it starts, advertises global/thread entrypoints and serves the current home-page resource. The resolved compatibility configuration uses `cwd: "."` and a relative script path because this installed Codex build leaves `${PLUGIN_ROOT}` literal in that configuration.

Nine extension/package checks pass. An authenticated company lookup and a filtered customer search reached the live inSitu service. The user chose to keep the current connected account. The installed desktop sidebar still requires an app reload and a visual acceptance check; native computer use cannot control the Codex app itself. Earlier references to installation being pending below describe previous iterations.

## Capability home page

The current home page introduces six suggested tasks: customers, sales orders, invoice drafts, sales insights, catalog lookup and website redesign. Each card fills an editable prompt and focuses the message box. No prompt is sent until the user submits it. Order and invoice prompts ask for a review before record creation. The header hides preview-size controls until a website proposal is displayed.

Verified in the local browser: select an order suggestion, edit it, send it through the bridge, and reach the website suggestion and composer at a 390px mobile width without horizontal overflow. The simulator does not fabricate business results or switch business questions into website previews. Current evidence: `evidence/capability-home.png`. Native installation and live-data checks remain pending.

## Native extension correction

The latest requirement explicitly targets OpenAI Plugin Extensions. Version 0.4.0 registers **global** and **thread** entrypoints, titled **inSitu Sales**, with inline/fullscreen display modes. The sidebar landing screen sends a user-authored prompt to its native conversation. It does not infer the entrypoint type from fullscreen mode: both entrypoints can be fullscreen. On desktop the global app has its own conversation, as defined in the official extension specification.

Current browser evidence: `evidence/native-sidebar-launch.png`. This is a labeled local simulator, not evidence of installation in the actual Codex sidebar. The launch message was delivered through the SDK bridge, and the local host displayed the requested dark sample layout beside the conversation. Eight extension tests and eighteen existing package tests pass. The updated module and built UI were synced to the local backend; the flag remains disabled and nothing was deployed.

Native plugin installation, sidebar discovery and authenticated real-data acceptance remain pending. Earlier screenshots and checks below document the previous conversation-only iteration.

## Previous conversation-only iteration

The earlier simplification replaced the multi-workflow design with an existing conversation and a contextual website preview.

## Scope and evidence

The previous implementation and chat/portal concept provide the visual context. This scoped revision removes tabs, customer/sales/dashboard screens, standalone navigation and brief forms. The superseded combined mockup is no longer the visual acceptance target.

Browser evidence: `evidence/simple-chat-preview.png`. The local host shows a conversation beside the website preview. The native MCP widget contains only the preview; ChatGPT/Codex supplies the actual chat.

## Checks

- The actual MCP Apps bridge receives results and sends chat messages.
- Asking “make it dark” changes the sample layout. The response explicitly identifies this as a local deterministic demonstration, not a live AI website build.
- Typography, spacing and contrast are readable. The actual inSitu logo and library icons remain; no placeholder image assets were added.
- Desktop/mobile controls are contextual to the preview. No separate workflow forms or management screens remain.
- Sample layouts are labeled illustrative and unpublished. Review actions require an actual built-preview link or prepared artifact.
- Browser console inspection returned no errors or warnings in the checked flow.
- Five protocol, registration and scope checks pass; the original business-tool dispatch remains intact.

## Limits

Native host installation, live OAuth, actual website generation and publication still require the existing authoring environment and staging acceptance. Previous sales/dashboard screenshots are historical evidence only.

No actionable P0/P1/P2 issue was found in the simplified checked interaction. Broader responsive/host acceptance remains pending.

final result: passed
