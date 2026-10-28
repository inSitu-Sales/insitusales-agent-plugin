---
name: insitu-workspace
description: Open or use the inSitu Sales desktop home page, sidebar app, or conversation panel. Use for interface navigation and suggested prompts; direct B2B creation or redesign requests use insitu-storefront-authoring.
---

# Use the inSitu Sales interface

Use this skill when the user asks to open inSitu Sales, navigate its home page, or work with its conversation panel. Ordinary customer, order, invoice, inventory, and sales questions use the authenticated business tools directly; opening the interface is optional.

## Open and use the home page

Discover `openInsituWorkspace` and call it to open the home page. Its MCP metadata provides the global sidebar and conversation-panel entrypoints. The global entrypoint has its own host conversation on desktop; the thread entrypoint uses the current conversation.

The home page offers suggestions for customers, sales orders, invoices, sales insights, catalog lookup, and B2B creation or redesign. Selecting a card appends an editable, unsent draft to the native composer. The user edits and sends it there. Selecting a suggestion alone does not authorize creating a business record or starting a storefront build. Continue the workflow represented by the user's sent message without asking them to choose a separate workflow tab or repeat details already provided.

The bundled local MCP serves the interface, local project references, and authorized ZIP transfer. Account data and business operations use the authenticated remote inSitu tools. Opening the home page does not establish authentication, account identity, or authoring permission. If the local presentation tools or host draft capability are unavailable, explain the specific limit and continue through chat with supported tools and preview links.

## Route B2B work

When the user asks to create, remix, improve, resume, or register a local B2B storefront, use the packaged `insitu-storefront-authoring` skill. It owns company discovery, source selection, building, verification, and publication. A direct B2B request can begin that workflow without first opening the home page.

For a website preview alongside the conversation, discover `renderInsituPortalPlan` and follow its input schema. When company discovery returns no registered storefront address, omit the optional hostname from the preview call; never supply a made-up domain. Prefer a real built HTTPS preview URL when available. Label a supplied catalog layout as illustrative; displaying it does not build or publish a storefront. Supply artifact identity only from an actual prepared artifact. The preview's Review changes action requests review; it does not approve publication. Leave publication decisions and checks to the authoring workflow.

## Resolve company context before saving a project

For requests such as “save this skin folder” or “load my project in the panel,” follow the company-discovery step in `insitu-storefront-authoring` before registering the folder. Discover and call `getStorefrontCompany` without identity arguments. Use the authenticated response for the company ID, company name, registered hostname, and URL. Do not ask the user to provide or confirm these technical values. A project display name can come from the existing project; it is not a company selector.

Use the known, user-approved absolute project path and the discovered company ID with `registerStorefrontProject`. Read the saved result to confirm registration. Saved local metadata is not proof of the current account or a live publication. Do not infer the company from a previous incident, another chat, a folder name, or an old JSON record.

If the remote company tool is unavailable, explain that company discovery is unavailable in this chat and guide the user to check the remote inSitu connection. If the service explicitly requires authentication, guide the user through the host sign-in flow. Do not claim that the user is signed out merely because a tool is missing. Preserve the known folder path while registration is pending; do not substitute user-entered identity values or request an OAuth token. Ask only about project choices that the available company data and conversation cannot resolve.
