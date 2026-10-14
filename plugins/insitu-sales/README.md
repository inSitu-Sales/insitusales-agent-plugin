# inSitu Sales

inSitu Sales helps manufacturers, wholesalers, and distributors run field sales, van sales, and DSD operations from a conversation with your AI assistant. Find customers and products; review pricing, inventory, visits, orders, estimates, and invoices; generate customer statements; get order recommendations; and create or update sales records.

inSitu Sales connects with ERP and accounting systems, including QuickBooks Enterprise, QuickBooks Online, Odoo, NetSuite, SAP Business One, Xero, and Microsoft Dynamics 365 Business Central, so sales and operational data come together in one workflow.

## Use it

1. Add the **inSitu Sales** plugin.
2. Connect the **inSitu Sales** MCP server and sign in with your existing inSitu Sales credentials. Until you sign in, the server may show as disconnected or needing authentication.
3. Ask your assistant about your sales data, for example:
   - "Show me today's invoices"
   - "What were my top-selling products last week?"
   - "Create an order for this customer with last month's items"

You need an inSitu Sales account. Each organization sees only the business data and workflows its users are authorized to access.

## Data

The plugin connects your AI assistant to the inSitu Sales MCP server at `https://api.insitusales.com/mcp` over HTTPS. Your requests, and the customer, product, and sales records needed to answer them, are exchanged with your inSitu Sales account through that server. Sign-in uses OAuth with your inSitu Sales credentials. The sales tools run remotely. The optional storefront-authoring skill includes a local Node.js upload helper and creates source files, test artifacts, and ZIP archives in the workspace you approve. The helper receives only a short-lived authorization for one exact ZIP, not your general account token. Keep that authorization out of source files and generated storefronts.

See the inSitu Sales privacy policy and terms: https://www.insitusales.com/end-user-license-agreement

## Local storefront authoring pilot

In a coding environment that supports packaged skills, use `insitu-storefront-authoring` to create a static B2B buyer storefront. This pilot requires the authenticated MCP tools `getStorefrontCompany` and `authorizeStorefrontUpload`. If either tool is missing from the authenticated tool list, your account is not enabled for storefront authoring yet. Existing sales tools remain available.

The workflow needs filesystem access, Node.js, ZIP creation, and outbound HTTPS. Installing the plugin does not supply these capabilities in ChatGPT web or mobile. The skill checks access and local capabilities before creating files. Plain HTML/CSS/JavaScript needs no package installation. Publication requires explicit approval of the hostname and reviewed ZIP; missing or uncertain results must not trigger automatic retries.

The skill is included in the public package, but the backend enforces pilot eligibility and publication permissions. A locally packaged skill is not proof that an approved ChatGPT listing has imported that version.

## Support

Visit https://www.insitusales.com/ for help with your inSitu Sales account.
