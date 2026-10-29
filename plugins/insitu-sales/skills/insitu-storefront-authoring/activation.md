# Account activation from an invitation

## Preserve the existing project

Include activation in every authored storefront. For an existing project, adapt its current routing, branding, and shared commerce client without replacing the store or resetting its design. The published template archive and deployed API can have different capabilities; inspect both before implementation. A downloaded older template is not evidence that activation is unsupported.

Discover the selected environment's GraphQL schema as described in [service discovery](discovery.md). Current activation uses `b2bVerifyInvitation` and `b2bActivateAccount`; confirm their argument and result types before using them. If either is absent, report the backend deployment gap. Do not fall back to legacy REST endpoints, decrypt invitation credentials in the browser, or implement account creation locally.

## Accept existing links

Support both invitation formats:

- `/activate/<encrypted-invitation-id>?d=<encrypted-token>`
- `/activate?id=<encrypted-invitation-id>&d=<encrypted-token>`

Preserve the maintained template's `/activation` alias. Treat the path or query `id` as the opaque invitation ID and `d` as the opaque token. Preserve encoded slashes, plus signs and padding. Use the router and URL parser without additional decoding or converting a token into company or customer identity. Never log these values, put them in persistent storage, or include them in build configuration.

An incomplete link must show an actionable error rather than remain loading or expose a password form. Keep the company's legal links available on this page.

## Verify, activate and sign in

Use the registered storefront hostname resolved by the maintained commerce connection. The current verified mutation accepts `hostname`, `inviteId` and `token`, and returns only `email`. Call it through the public GraphQL client without attaching an existing buyer bearer. Use uncached requests and do not automatically retry them. The server checks invitation validity and tenant ownership; the browser does not select a company or customer.

After successful verification, show the invited email as read-only. Request a password and confirmation. Preserve the current server password policy: 6–100 characters with uppercase and lowercase letters, a number, and a symbol, without whitespace. The server remains authoritative. Disable submission for invalid or mismatched values and while a submission is pending.

The current activation mutation accepts `hostname`, `inviteId`, `token` and `password`, and returns `email`. Make one deliberate request, then sign in with that returned email and password through the shared commerce store. Reuse its session installation, storage, and cache invalidation. On success, replace the activation URL with the store's normal authenticated destination so browser history does not retain the token-bearing entry point.

Keep the activation page mounted while authentication updates shared providers. In the default store, the favorites provider can remount its children on account changes; preserve the maintained activation route's handling of this boundary. Match the route's case sensitivity consistently. A pre-existing buyer session must not make a failed sign-in look successful.

Distinguish account activation from sign-in. If activation succeeds and sign-in fails, show that the account is active and provide the normal sign-in path. Never repeat activation to recover sign-in. If activation is unconfirmed, advise trying sign-in before requesting a new invitation. Do not automatically retry, reset a password, resend an invitation, or reopen a consumed link: the account may already have been saved. Render failures as text and keep provider details out of the interface.

## Verify before publication

Check path and query invitation links and encoded credentials. Cover missing parameters and every server rejection state, including expired invitations. Verify password confirmation, pending submission, success, and uncertain outcomes. Verify that authentication still redirects after the actual shared providers update. Test an existing session followed by a failed sign-in, and navigation away while a request is pending. Use synthetic invitations for local checks; consuming a real invitation changes an account and requires separate authorization.

Verify desktop and mobile layout, labels, keyboard access, loading, and failure states, direct navigation and reload. The supported hosting policy handles arbitrary HTML navigation for the registered hostname and derives static-file exclusions from the published ZIP; reserved API and asset paths retain their origin responses. Do not add per-page proxy rules or edit DNS from an authoring task. A custom route must still exist in the frontend. Keep source verification, deployed API availability and actual published-host verification distinct; a local preview does not establish the other two.
