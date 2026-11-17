# Buyer experience and asynchronous updates

## Design the journey and its waiting states

Adapt the existing storefront rather than replacing its visual identity. Review the buyer journey before changing individual controls: company startup, browsing, search, sign-in, cart, order completion, and transaction history. Preserve legal and activation routes throughout that journey. Show configured company branding; keep internal provider names and technical errors out of customer-facing labels. Do not rename integration identifiers or rewrite approved legal text.

Read the maintained source before implementing state or caching logic. Preserve its session adapter, authoritative money, account isolation, and order safeguards. Existing custom projects may need these improvements selectively; do not replace the whole project or assume a source download updated its implementation.

Design each waiting state deliberately:

| Situation | Presentation |
| --- | --- |
| Company startup | A neutral spinner before company branding is known; no placeholder header that changes immediately. |
| First catalog load | One skeleton region when no results exist yet. |
| Cart mutation | A spinner on the affected item or inside the initiating button, preserving its label and accessible name. |
| Background revalidation | Keep the current content mounted. Avoid a replacement skeleton, full-page overlay, or repeated loading text. |
| Additional promotions | One spinner while retaining the real offers already loaded; no simultaneous skeleton cards and loading sentence. |
| Failed initial read | A clear, localized error and deliberate retry. |
| Failed background read | Retain permitted presentation, indicate the failure compactly, and offer retry. Withhold prices or offers that cannot be verified. |

Do not show an empty state before the initial request finishes. Keep pending indicators scoped to their operation and clear them on completion, rejection, and account changes. Completion of an earlier request must not clear a later operation's indicator. Use accessible status labels and respect reduced motion. Do not move focus or resize the whole page to announce routine updates.

## Restore a session after restarting

Use the maintained buyer storage adapter. Persist only the scoped buyer bearer in `localStorage`, keyed by storefront hostname and API endpoint. Migrate a valid legacy `sessionStorage` token only when no persistent credential exists. Sign-out removes both scoped copies without clearing unrelated storage. Keep storage failures compatible with an in-memory sign-in.

Restore through the supported buyer-session operation and persist renewed credentials. A saved value is not a verified buyer profile. Authentication rejection clears the credential; a transient connection failure preserves it for recovery. Do not invent a refresh-token endpoint or promise indefinite renewal after credentials expire. Do not store private catalog responses, prices, carts, or notification credentials with the token. Preserve existing uncertain-order markers and native session association when adapting an older project.

Verify a complete browser/WebView restart, not only a page reload. Ordinary browser tokens remain accessible to JavaScript; a skin must not claim secure native credential storage.

## Update commerce without restarting the page

Apply the cart returned by a mutation as the authoritative quantities and totals. Do not calculate replacements from displayed prices. Keep catalog cards, product details, open dialogs, and scroll position mounted after edits.

Revalidate the relevant visible prices and product offers in the background. Promotions can affect products other than the edited SKU; do not assume a single-product dependency. Batch visible product IDs rather than querying each card independently. Do not reload company configuration, legal content, or transaction history after an ordinary cart edit. Avoid a blanket `refreshSettledViews` sweep that re-fetches every mounted reader.

The maintained core distinguishes initial loading from revalidation. Preserve its account and query guards: retaining old results is appropriate for the same account and query, not for another search, filter, product, or buyer. Discard obsolete responses and clear restricted content after authorization failures. Expose its background error and retry state in the skin instead of hiding failures or continuously retrying them.

Recalculate checkout options when necessary and invalidate prior consent when reviewed facts change. A successful cart write must not be reported as failed because a later presentation refresh failed. Never retry an uncertain order submission automatically.

## Keep shopping controls clear

Search belongs on shopping routes, not on sign-in, activation, or order completion. Keep the magnifier and clear action cohesive inside the field; place scanning beside it as a separate control. Preserve manual search and follow [native integration](native.md) for capability discovery and permissions.

Render cart and checkout rows from the product snapshot returned by the cart API, including gift lines. The backend stores name, code, remark, description, barcode, and imageUrl. It refreshes expired product data in a batch when the cart is read or modified, with a five-minute lifetime tracked by productDataRefreshedAt. Do not fetch catalog data from cart rows or use useProduct there; reserve useProduct for individual product pages. Do not maintain a separate product presentation cache for the cart or add refresh jobs or timers. Keep calculated money and stock under backend authority, and remove empty or duplicate subtitles. Avoid fixed title heights that reserve unused space.

Show unit price, selected presentation, line total, actual discount, and tax distinctly. A promotional unit price of USD 2.83 with quantity three means a USD 8.49 line total; it does not mean USD 2.83 saved. Strike through an original price only when the API provides a comparable value. Preserve hidden amounts and gift rules. Align icons with button labels and make cart clearing clear, localized, and confirmed.

Use “Completa tu orden” for a Spanish storefront and the equivalent localized wording elsewhere. Preserve route identifiers such as `/checkout`. Place delivery refresh beside the date control with an accessible label and tooltip. Keep the full consent explanation beside its checkbox and submission action, without a duplicate instruction elsewhere.

Use the PDF and tracking URLs returned with history items. Remove obsolete lookup modals and document-access requests; absent or unsafe links remain unavailable. Preserve private-link protections and confirmation before reorder replaces the current cart. Reorder does not submit an order.

Transient sign-in notices should be compact, translated, dismissible, and may expire after about eight seconds. Do not auto-dismiss an unresolved order or stock problem that needs buyer action.

## Verify the experience before handoff

Follow [browser and app layout](layout.md), including control font sizes and viewport configuration. Check narrow phones, desktop, and embedded layouts. Use screenshots of initial, settled, delayed, and failed states to assess spacing and continuity; a successful build alone does not establish usable behavior.

Test cold and warm presentation, retained cards during cart edits, focused inputs, open dialogs, failed price refresh, rapid successive actions, session restart, and account changes. Confirm that stale results never replace another account or query. Verify unchanged checkout consent and uncertain-order protections with synthetic fixtures. Distinguish browser simulations from actual native testing and report gaps without claiming that an emulator or device was checked.
