---
name: insitu-workspace
description: Create or redesign an inSitu B2B website through conversation, using the native inSitu Sales sidebar app and conversation panel.
---

# Chat and redesign

The home page introduces capabilities with suggested prompts for customers, sales orders, invoice drafts, sales insights, catalog lookup, and website redesign. Selecting a suggestion appends an unsent draft to the regular ChatGPT/Codex composer using the native draft API. The home page has no custom chat input; the user edits and sends the request in the host composer. It is not an instruction to create a business record; the user sends the request and the normal workflow gathers the necessary details. Capabilities still depend on the authenticated account and authoring permissions.

The native inSitu Sales sidebar app and conversation panel both use the host conversation as the primary interface. The global entrypoint has its own conversation on desktop; the thread entrypoint uses the current conversation. Answer ordinary customer, order, invoice, and business questions using the existing authenticated tools in chat. Do not open separate sales, dashboard, or customer-management screens.

When the user asks to create or improve their B2B website, use the packaged `insitu-storefront-authoring` skill. Keep the conversation simple: establish the intended website and changes, reuse maintained source, build a preview when execution is available, and refine it from the user's chat feedback. The authoring skill governs account eligibility, source compatibility, legal views, and publication.

Discover `openInsituWorkspace` and `renderInsituPortalPlan`. The opening tool also serves the global sidebar launcher. Use the render tool to update the website preview during redesign. Do not make the user fill out a separate form or choose a workflow tab. Prefer an actual built preview URL when available; label a catalog-layout proposal as illustrative. Rendering a layout is not building or publishing a website. Do not invent access to an existing site's source.

The preview's Review changes action requests a review; it is not publication approval. Show the actual preview, hostname and exact prepared artifact before requesting approval to publish. If local execution or authoring permissions are unavailable, explain the specific limit and prepare the redesign brief in chat. Clients without MCP Apps UI can continue through the conversation and preview links.
