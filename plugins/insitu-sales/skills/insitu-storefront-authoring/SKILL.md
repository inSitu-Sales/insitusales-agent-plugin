---
name: insitu-storefront-authoring
description: Use when creating or revising a static InSitu B2B buyer storefront for mobile and desktop.
---

# Author an InSitu buyer storefront

Deliver a functional, branded buyer storefront, not an administration dashboard or a visual mockup. The output is a static website that uses InSitu for live commerce. Administrator MCP supplies authoring context and publication authority; buyer commerce runs directly through GraphQL, not through MCP tools.

This playbook governs intent, design, and safe decisions. Discover technical contracts from their owning sources rather than treating this file as an API reference.

## Execution and authorization guards

Before collecting the brief or creating files, discover the authenticated InSitu MCP tools. Both getStorefrontCompany and authorizeStorefrontUpload must be available. If either tool is missing from a successfully authenticated tool list, explain that the account is not enabled for storefront authoring yet and stop before creating storefront files. Publication is forbidden without the deployment tool. Authentication or connection failure is a blocker, not evidence of ineligibility. Do not bypass missing capabilities with other tools or administrator HTTP requests. Tool availability does not replace current administrator authority and hostname ownership checks.

Confirm workspace file access, Node.js, archive creation, HTTPS access and preview capabilities. Locate the [bundled upload helper](scripts/upload-storefront.js) relative to this skill. If required capabilities are unavailable, explain the blocker and stop before authoring. Do not install packages, change client configuration or export credentials without approval. Plugin installation does not supply a local execution environment.

Once these guards pass, call getStorefrontCompany using its discovered input schema. Use the returned company context to establish the intended storefront and branding before building. Ask for any necessary inputs that the author has not supplied; do not substitute another company or treat company information as publication approval.

## Confirm the storefront brief

Respect decisions already supplied. Ask focused questions about missing choices; use an adaptive interview when several choices need discussion.

Establish the intended storefront hostname, output location, audience, branding, content, and navigation. Author-approved design choices take precedence over company presentation; otherwise use discovered company branding with an accessible, restrained wholesale style.

Offer a public catalog with sign-in for product details and prices as the default experience. Explain that presentation gates do not make publicly returned data confidential. Keep private buyer information behind actual authorization.

Default to a complete journey from Store through product details, saved cart, delivery selection and checkout to meaningful confirmation. Preserve search and navigation context when buyers return. Use approved content for informational pages; never invent company policies, promises, or legal claims.

## Discover before building

Use the connected service's documentation to locate its public storefront GraphQL endpoint. If its location is unavailable, ask for the authoritative source rather than guessing a URL.

Explore introspection and descriptions for the capabilities needed by the brief. Follow relevant types, arguments, defaults, return values and deprecations. Discover authentication and transport conventions from the service documentation; a GraphQL type alone does not establish these conventions or access permission. Use MCP tool schemas for authoring inputs and the bundled helper's usage guidance for local publication.

Build queries and mutations from the discovered contract, selecting only what each view needs. Optional fields do not become mandatory interface features. Adapt to supported capabilities rather than assuming fields from an earlier storefront. If discovery fails or a required behavior is ambiguous, surface the gap before relying on it. Never invent operations, substitute legacy commerce APIs or recreate the schema in this skill.

## Shape the buyer experience

Use a simple static architecture suited to the approved brief. Company presentation establishes the storefront context; catalog, private pricing, saved cart and checkout remain live service responsibilities. Do not embed a static product database or private buyer data in the output.

Design mobile and desktop together as a coherent experience. Adapt navigation, product grids, detail views, cart review and checkout to available space. Support touch and keyboard input, visible focus, readable typography, accessible forms and dialogs, and meaningful imagery. Avoid horizontal overflow and interactions that depend on hover. Preserve browser back navigation and direct-link reloads within the hosting capabilities actually available.

Show clear loading, empty, unavailable, and disconnected states. Resume interrupted buyer intent only after current access is established. Treat service text and asset URLs as untrusted content; render them safely and use approved assets with appropriate rights.

## Keep authority and private state clear

The server owns product visibility, prices, monetary calculations, saved carts, delivery eligibility and order creation. Display authoritative results rather than deriving business rules from appearance or cached data.

Reuse presentation reads and deduplicate requests. Prefer memory caches scoped to storefront and current buyer identity. Show cached display prices with deliberate background refresh; cache failures must not become fresh-success claims. Saved cart amounts are not a client-side checkout quote.

Authentication changes clear private presentation, caches, consent, and confirmation immediately. Ignore responses belonging to an earlier account. Keep secrets and private commerce data out of shared caches, generated assets, logs, and screenshots. Follow discovered session behavior; do not invent logout, token renewal or recovery capabilities.

Require visible buyer consent before order submission. Prevent duplicate submission and do not retry automatically after an uncertain outcome. Changed prices require renewed review. A confirmed order remains confirmed if a later cleanup step fails. Never infer that a lost response means no order was created.

## Review and publish deliberately

Success means the agreed buyer journey works coherently on mobile and desktop, uses current service contracts, protects private state and presents honest outcomes. Show the author a working preview and explain what has been demonstrated and what remains unverified. A preview is not publication approval.

Publication is live. Ask for explicit approval of the intended hostname and exact reviewed artifact. Package only the approved static output and assets according to the current publication requirements. Exclude credentials, private data and development artifacts.

Use the bundled helper through Node.js to prepare the archive, then discover the authorization tool's inputs and request authorization for that artifact. Never request/export the general plugin OAuth token. Deliver only the delegated grant through a protected local channel to the helper. Do not print it, place it in command arguments or bundle it with the storefront.

Let the helper enforce the upload boundary. Report its actual outcome; pending or uncertain publication is not confirmed activation. Do not retry automatically or renew authorization without a new deliberate approval.

Hand off source, preview, and artifact locations, demonstrated behavior, unresolved gaps and publication outcome. Preserve unrelated files and processes. Installation, commits, pushes, backend changes, cloud changes, native features and live commerce actions require their own approval.
