---
name: insitu-workspace
description: Open or use the inSitu Sales desktop home page, sidebar app, or conversation panel. Use for interface navigation and suggested prompts; direct B2B creation or redesign requests use insitu-storefront-authoring.
---

# Use the inSitu Sales interface

Use this skill when the user asks to open inSitu Sales, navigate its home page, or work with its conversation panel. Ordinary customer, order, invoice, inventory, and sales questions use the authenticated business tools directly; opening the interface is optional.

## Open and use the home page

Discover `openInsituWorkspace` and call it to open the prompt directory. The remote MCP owns its sidebar and conversation entrypoints. The local companion can open the directory through a tool call but does not register another navigation entry.

The directory offers prompts for customers, sales orders, invoices, sales insights, and catalog lookup. Expand the B2B group to choose between creating a portal and sending a project ZIP. Each suggestion adds an editable, unsent draft to the native chat input. The user edits and sends it there. Expanding a group does not add a prompt. Selecting a suggestion does not approve or execute its operation.

The interface does not read company data or local project records, display website previews, or run publication tools. Business operations start from the user's sent message and use the available authenticated tools. Opening the interface does not establish account identity or permission.

If the host cannot insert a draft, explain the limitation. Do not submit the prompt as a fallback.

## Route B2B work

Use `insitu-storefront-authoring` for B2B creation, changes, source selection, verification, and ZIP publication. A direct request in chat starts the same workflow without opening the directory. Show working previews through the available browser or preview links. Report publication results and errors in the chat.
