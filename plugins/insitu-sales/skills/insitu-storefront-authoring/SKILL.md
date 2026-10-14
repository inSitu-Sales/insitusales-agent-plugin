---
name: insitu-storefront-authoring
description: Use when creating or revising a static InSitu B2B buyer storefront with catalog browsing, product details, saved carts, and existing-address checkout.
---

# Build an InSitu B2B storefront

Build a functional static portal, not only a mockup. Administrator MCP provides getStorefrontCompany for authoring context and authorizeStorefrontUpload for publication. Buyer commerce runs in the generated browser application through the GraphQL endpoint below, not through MCP tools. The browser must use the typed B2B GraphQL contract below. The bundled Node helper handles binary publication; it does not receive the plugin's account token. Work locally until the intended hostname and exact artifact have explicit publication approval.

## Check access and local capabilities

Before collecting the brief or creating files, check the connected InSitu MCP tool list for both getStorefrontCompany and authorizeStorefrontUpload. If the connection needs authentication, ask the user to sign in through the plugin and then check the list again. Do not ask for their password or account token.

If the authenticated connection lists its tools but either tool is missing, explain: "Your account is not enabled for storefront authoring yet." Then stop before creating storefront files. An unavailable or failed connection is a connection blocker, not proof that the account is ineligible. Do not guess hidden tool names, use legacy tools or direct administrator HTTP requests to bypass this check. Visible tools show pilot availability, not current publication permission; the backend still checks administrator authority and hostname ownership.

This initial workflow needs a local coding environment with workspace file access, Node.js, ZIP creation, and outbound HTTPS. Check those capabilities, plus available preview and test tools, before starting. Resolve the bundled helper relative to this skill's directory and confirm that it exists. If a capability is missing, explain the blocker and ask the user to continue in a supported coding environment. Do not install packages, change client configuration or export credentials without explicit approval. Plain static HTML/CSS/JavaScript needs no npm install or framework build. Plugin installation alone does not provide a shell or filesystem in ChatGPT web or mobile.

## Confirm the storefront brief

Use a short adaptive Interview when several author choices are missing; otherwise ask only the missing question. Respect choices already supplied. Confirm these three areas, offering the defaults rather than a long technical questionnaire:

1. **Access:** default public catalog, prices hidden until sign-in, product details require sign-in. Alternatives are public catalog/public details or sign-in before catalog/details. All prices, saved carts, addresses, checkout and private confirmations require buyer authorization. These are UI access presets, not backend confidentiality: public catalog responses already include descriptions/images. Do not promise that a UI gate hides publicly returned data.
2. **Pages/navigation:** Store → product details → cart review → checkout → confirmation. Store, Privacy and Terms are required; About is optional. Offer About as a useful addition, not a requirement. Home, Contact and other pages are author choices. Support mobile navigation and returning to the prior Store search/page/scroll position.
3. **Branding:** author preferences override company presentation. Otherwise use the company name/logo and an accessible, restrained wholesale design. Ask about existing brand assets or design references, not every CSS choice.

Obtain the registered hostname and local output directory if missing. Never choose another company's hostname or assume an existing demo may be overwritten. Read public company information once at application startup, not on every client-side route transition. Use the configured hostname in loopback previews; never send localhost as tenant context. Check that production host configuration names the intended store.

Full company.settings mapping is deferred for this initial presentation skill. The company response below contains no preferred-theme or legal-content fields. Privacy and Terms remain navigation pages: show an honest unavailable-content state in this initial preview, not invented policy text or claims of legal readiness. Future company configuration mapping should supply the existing PORTAL_PRIVACY_POLICY_PAGE and PORTAL_TERMS_AND_CONDITIONS_PAGE content. Do not use legacy REST or expose raw configuration to fill the gap. Before live publication, surface missing legal content to the author for an explicit readiness decision.

## Build the buyer flow

Prefer simple HTML/CSS/JavaScript for a small portal; an existing framework is fine if its output is static. Deliver source, tests, a loopback preview and a ZIP. No storefront server runtime, browser Firebase SDK, database or administrator UI is required.

- **Store:** searchable product grid with name, SKU, image and package/unit labels when available. Name/code search and bounded pagination only initially; no facet filters or stock/minimum-order claims. Preserve search/back navigation. Use image fallbacks and lazy loading.
- **Product:** a real detail view with gallery, descriptive information, package labels and authenticated price/quantity controls. Resolve cold URLs using b2bCatalog with productId, offset: 0 and no search; do not scan every catalog page. Empty results mean unavailable, not permission to substitute another product. Under the default private-detail mode, sign in first and resolve under current buyer visibility, even if an anonymous cache contains the product.
- **Sign-in:** clear validation, password visibility control and safe focus handling. Remember navigation/add intent and resume only after current product visibility is verified. No registration/account creation is provided.
- **Cart:** separate review section with quantity editing, remove/clear and exact server totals. Join product presentation by ID; cart lines contain no names/images. Use an ID fallback for unavailable presentation. Serialize cart writes; parallel/multitab editing is unsupported.
- **Checkout:** choose an existing owned address, review saved cart/currency and delivery choice, then explicitly confirm a real order. With no valid address, block submission. No payment/address-creation screen.
- **Confirmation:** show returned order number and distinguish successful order creation from cart-cleanup warnings. Never display another buyer's confirmation after sign-out.

Use meaningful typography, spacing, and imagery rather than a generic administration dashboard. Provide keyboard navigation, labels, visible focus, readable errors, mobile tap targets, loading/empty/disconnected/unavailable states and 320px-safe layouts. Treat API text and URLs as untrusted; escape text, allow safe image/link schemes and avoid arbitrary HTML injection. Bundle the approved public logo/assets locally where practical, with attribution/license checks and safe file types. Do not bundle catalog data or private prices as a static product database.

Use root index.html and relative assets. Hash/query navigation is a practical default for product URLs; it must survive reload without assuming server SPA rewrites. Static multipage output is also valid when all entry files actually exist.

## GraphQL client contract

POST JSON `{query, variables, operationName}` to:

`https://api.insitusales.com/api/v1/b2b-ecommerce/graphql`

Use Accept/Content-Type application/json, credentials omit, cache no-store and HTTPS. Buyer requests send the session's token as the COMPLETE Authorization header value; it already contains the Bearer prefix. Do not prefix it twice. Public company/catalog and sign-in need no token. Any supplied invalid bearer is an error, never anonymous fallback. Do not use generic legacy GraphQL pricing or REST commerce routes.

HTTP 200 may contain errors. Inspect both `errors` and the requested `data` field before treating a read or mutation as successful. Service errors may carry `extensions.httpStatus`; validation errors may not. Do not cache errors as empty successful pages. Unexpected errors use safe generic messages. Never log sign-in variables, headers, tokens, or full private responses.

Send one mutation action per operation. For useful read batching, select several supported query fields in one GraphQL document—not an undocumented JSON array transport. Limit distinct reads to 12, expanded selections to 2000 and nesting depth to 20. Keep normal documents much smaller.

| Operation            | Arguments                                                                   | Selected result                                                                                               |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| b2bCompany           | `hostname: String!`                                                         | `id name hostname logoUrl locale currency contact {email phone} settings {hideCompanyPhone} links {name url}` |
| b2bCatalog           | `hostname: String!, limit: Int, offset: Int, search: String, productId: ID` | `products offset limit hasMore`                                                                               |
| b2bPrices            | `productIds: [ID!]!`                                                        | `currency items {productId status unitPrice}`                                                                 |
| b2bAddresses         | none, buyer token                                                           | list of addresses, not an addresses envelope                                                                  |
| b2bCart              | none, buyer token                                                           | saved Cart snapshot                                                                                           |
| b2bSignIn            | `hostname: String!, email: String!, password: String!`                      | `token companyId currency buyer {id email} customer {id name}`                                                |
| b2bRefreshSession    | none, buyer token                                                           | same fields as sign-in                                                                                        |
| b2bAddCartProduct    | `productId: ID!, quantity: Float!`                                          | Cart; increment quantity                                                                                      |
| b2bSetCartProduct    | `productId: ID!, quantity: Float!`                                          | Cart; set exact quantity                                                                                      |
| b2bRemoveCartProduct | `productId: ID!`                                                            | Cart                                                                                                          |
| b2bClearCart         | none                                                                        | empty Cart                                                                                                    |
| b2bPlaceOrder        | `addressId: ID!`                                                            | `status order {id number} cart cartCleared`                                                                   |

All GraphQL IDs are strings. Product selectors must be canonical positive safe integer IDs, not SKUs; address IDs are opaque. Catalog products expose id, code, name, description, remark, barcode, ean, brand, category, subcategory, group, packageFormat, size, units, b2bUnits, color, format, descriptionHtml, imageUrl, imageUrls, and isFeatured. Prices, costs, and stock fields are absent. Prefer plain description; descriptionHtml is escaped paragraph/line-break markup, not raw legacy HTML.

Catalog defaults to 20 products/page, max 50, offset max 100000; search is literal case-insensitive name/code text, max 100 characters. Advance offset by limit until hasMore is false. Exact productId intersects visibility, search, and pagination: for details omit search and request offset zero/limit one. Missing, hidden, disabled, foreign, or buyer-excluded IDs return an empty page.

### Startup and direct product examples

Fetch company once per application boot. Fetch Store pages only as needed; public and signed-in visibility differ.

```graphql
query Startup($host: String!) {
  b2bCompany(hostname: $host) {
    id
    name
    hostname
    logoUrl
    locale
    currency
    contact {
      email
      phone
    }
    settings {
      hideCompanyPhone
    }
    links {
      name
      url
    }
  }
}
```

Use the appropriate access gate before this cold-link request. A cached anonymous product does not establish buyer visibility.

```graphql
query Product($host: String!, $id: ID!) {
  b2bCatalog(hostname: $host, productId: $id, offset: 0, limit: 1) {
    products {
      id
      code
      name
      description
      remark
      packageFormat
      units
      size
      imageUrl
      imageUrls
      descriptionHtml
    }
    hasMore
  }
}
```

A Cart has status, currency, lines {productId quantity unitPrice lineTotal}, subtotal and updatedAt. Replace the whole snapshot after every mutation. GET-like cart reads preserve saved prices; they are not fresh checkout quotes. Positive finite decimal quantities max 9999; max 100 lines. Zero does not remove a line. updatedAt is not an optimistic concurrency token.

Prices use status available/unavailable; available zero is valid, unavailable/null is not zero. Unit prices are six-place decimal strings, line totals/subtotal two-place. Preserve and format decimal strings without Number/parseFloat or floating-point price arithmetic. Server default_price × quantity and server rounding remain authoritative; no stock, UOM conversion, tax, discount or promotion rules.

Addresses expose id, label, lines, city, state, postalCode, country, isDefault. Pass only the selected id to checkout.

## Cache and authentication defaults

Use a five-minute catalog cache in memory. Key entries by canonical hostname, public vs verified company/buyer/customer scope, currency, query variables including productId/page/search, and requested selection. Normalize products within that same scope. Deduplicate matching in-flight reads; debounce search around 300 ms and fetch only needed pages, not the whole catalog. Provide a deliberate refresh action. Never merge narrower selections as though they contain all fields.

Display cached prices immediately, with a background price lookup on entering a view or changing the visible product set. Batch at most 50 IDs; deduplicate in-flight batches and avoid refetching on every render. With no cached value show loading/unavailable, not zero. Background failures retain an explicitly stale display warning, not a fresh-success marker. Updated display prices never rewrite saved cart totals or submit anything. Remove unavailable prices when the lookup says unavailable. Price cache is private in-memory account/currency/product state, not a shared cache or offline checkout authority.

No persistent catalog cache or service worker by default. Keep tokens in memory; if an author explicitly requests tab-session restoration, keep only the buyer token in session storage and verify it with b2bRefreshSession before private reads. Passwords are never stored. Tokens have no automatic expiry, refresh does not revoke old tokens, and no server logout or /me exists.

Every sign-in, refresh, invalidation or sign-out resets private caches and pagination—even if token text stays the same. Abort/ignore old-account in-flight responses with an auth-generation check, so they cannot refill private data after logout. Sign-out immediately clears token, private catalog/prices, cart presentation, addresses, consent and confirmation even if public reload fails. It preserves the server cart. Cart/address/order data and tokens never enter shared caches, static bundles or screenshots. Treat access denial as denial, not permission to silently switch to public data.

## Submit orders deliberately

```graphql
mutation PlaceOrder($address: ID!) {
  b2bPlaceOrder(addressId: $address) {
    status
    order {
      id
      number
    }
    cart {
      status
      currency
      subtotal
      updatedAt
      lines {
        productId
        quantity
        unitPrice
        lineTotal
      }
    }
    cartCleared
  }
}
```

Disable duplicate clicks and send once after visible real-order consent. Allow roughly 310 seconds for checkout; normal reads can have shorter timeouts. The backend builds the Grails payload; the browser submits no prices, totals, customer/tenant selectors or legacy visit.

- `status: price_changed` is a normal GraphQL result, not necessarily an HTTP409 error. Replace the returned cart, clear consent and require new review before another deliberate submission. Other conflicts also require review, never automatic resubmission.
- Accept `confirmed` only with nonempty order id/number and boolean cartCleared. True means the entire owner cart was cleared, including newer edits. False still means CONFIRMED: show a cleanup warning and never resubmit; require deliberate stale-cart handling before another checkout.
- Transport timeout, malformed confirmation, unreadable response, or server/unexpected GraphQL error during submission can mean an UNCERTAIN created order. Keep cart and warn the buyer to verify with the company before submitting again. Block automatic retries/reconnect/reload submissions. An explicit pre-submission validation/access failure is not proof of an uncertain order, but also must not trigger an automatic retry.

No idempotency, submission recovery or order-history endpoint is available. Page-local duplicate-click prevention cannot prevent duplicates across reloads/tabs. Failed/uncertain orders retain cart; cart cleanup failure never changes confirmed to failed.

## Test, package and request review

Write API-client tests and intercepted browser journeys before claiming readiness. Cover selected access gates, cold product URL/reload, search/pagination/back navigation, cache freshness/dedup/background-price failure, sign-in intent, account switching with delayed reads, cart actions, addresses, price-change review, confirmation, cleanup failure and uncertainty without retry. Check mobile/desktop, keyboard/focus, images, and no horizontal overflow. Fixtures are for tests, never silent production fallback data.

Only perform permitted read-only company/catalog network checks. Do not run live buyer mutations/orders merely to test. Inspect GraphQL errors and report deployment/CORS failures honestly; do not fall back to legacy APIs when the new schema is unavailable. Simulated browser tests are not live checkout acceptance.

ZIP static output only: index.html at root, no containing folder. Include needed approved assets, not tools/tests/node_modules/git/dotfiles/credentials/private data/archives/OS metadata. Bounds: ZIP 10MiB, file 8MiB, expanded 64MiB, 1000 entries. Safe paths contain letters/numbers/underscore/hyphen/dot/slash; no spaces, absolute/traversal paths or symlinks. Allowed suffixes: html/js/css/json/png/jpg/jpeg/gif/webp/ico/svg/woff/woff2/ttf/otf/txt/xml/map/avif/wasm. Scan for secrets before packaging. A digest is SHA256 of the EXACT ZIP bytes.

## Publish with delegated authorization

Publication is LIVE, not staging. The user must approve intended hostname and reviewed artifact; prior demos, credentials or a connected plugin are not approval. The remote MCP tool authorizeStorefrontUpload uses the existing authenticated administrator session. Never request/export the general plugin OAuth token, scrape credential stores or send a local ZIP path/base64 archive through MCP.

The skill bundle includes scripts/upload-storefront.js (Node built-ins only). Resolve its path relative to this SKILL.md, not an assumed working directory. Use Node through its interpreter; copy the script with this file when sharing the skill. If only the Markdown was pasted and the helper/tool is missing, prepare locally and report the publication blocker—do not improvise account-token export.

```bash
node /path/to/skill/scripts/upload-storefront.js --prepare /path/to/storefront.zip
```

This returns nonsecret digest and byte size. Call the MCP tool with hostname/digest/size and request these selection fields: uploadUrl authorization hostname digest size expiresAt. Use the tool's discovered input schema; do not invent an MCP envelope. Extract ONLY that grant object from the response. It expires in ten minutes and is single-use, bound to this artifact and current administrator/hostname. Pilot availability remains subject to current permission and ownership checks; eligibility is not administrator authority.

Feed the sensitive grant JSON on stdin through a protected local channel. If a protected file is necessary, create it outside source/output, mode0600, never print its contents or put a secret literal in argv. The file contains the grant object, not GraphQL data/MCP wrapper.

```bash
node /path/to/skill/scripts/upload-storefront.js --publish /path/to/storefront.zip < /protected/path/grant.json
```

The helper sends binary multipart archive/hostname/digest to fixed HTTPS `/api/v1/b2b-ecommerce/authorized-releases`, using X-Storefront-Upload-Authorization. It checks local digest/size/expiry, refuses redirects and makes no retries. The server validates the archive then consumes authorization before publication side effects; later failure leaves it spent. Never renew/repost automatically. A new deliberate attempt needs explicit approval and a new grant. Never bundle the helper's input or grant into the website.

| Helper result                                    | Meaning                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| httpStatus 200, active, complete                 | Public bytes/provider target/private selection acknowledged.                                      |
| httpStatus 202, activation_pending, verification | Delivery may already be live; private selection was not acknowledged. Report pending, not active. |
| httpStatus 502, activation_unconfirmed           | Route/selection not confirmed. No rollback or intact-old-site claim.                              |
| Helper failure or lost response                  | Stop and report uncertainty; do not retry automatically.                                          |

Read-only GET/HEAD checks can verify root, all assets and missing JS404. Matching bytes later do not finish private selection. No background job completes pending publication. Browser checking never authorizes a live order.

## Fresh-session brief and handoff

A useful brief specifies hostname/output, access choice, pages and branding. Offer the defaults above for unanswered choices; technical configuration need not become a second Interview. Use real data when permitted; show a tested preview before asking for publication approval.

Report source/preview/ZIP paths, digest, tests actually run and gaps (including company settings/legal readiness). If published, include exact status/stage and URL; otherwise say not published. Do not claim successful agent generation from static documentation checks. Preserve unrelated files/processes. No commits, push, backend/cloud changes, installation, native/scanner/white-label features or live orders without separate approval.
