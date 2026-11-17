# Buyer notifications

## Use the maintained inbox

The maintained skin includes an authenticated notification inbox for browsers and white-label apps. Read its README and reuse `NotificationsProvider`, `NotificationInbox`, the notification API adapter, and the default skin components. Keep one shared provider connected to the verified buyer session. Adapt presentation to the company theme without copying state logic into individual components.

Include a header bell with the global unread count. Open a preview of the latest five messages with a link to `/notifications`. The dedicated page provides cursor pagination and read actions. Opening a message shows its complete title, body, and date in an accessible dialog and marks it as read. Render supplier text as plain text; translate interface controls into English and Spanish using the storefront language configuration.

Before marking all notifications as read, show a simple confirmation dialog. Initially focus Cancel, perform no mutation on cancellation, and restore trigger focus on dismissal. Confirmation closes the dialog immediately and starts the optimistic update.

## Discover buyer API contracts

Discover the deployed buyer GraphQL schema and verify the template documents against it. These buyer operations use the existing buyer session, not administrator MCP credentials:

- `b2bNotifications`: paginated `items`, global `unreadCount`, `nextCursor`, and `hasMore`. Use the global count for the badge; unread rows on one page do not establish the total. There is no separate unread-count operation.
- `b2bMarkNotificationRead`: persists one message's read state.
- `b2bMarkAllNotificationsRead`: persists bulk read state and returns the server read watermark. Later arrivals can remain unread.

Use the discovered argument and result types. The server owns recipient authorization and persisted read state. Keep notification operations independent of catalog and cart cache invalidation.

## Update immediately and reconcile silently

Read-one and read-all actions update cached rows and the global count immediately in memory. Persist asynchronously without a read-progress spinner, blocking overlay, or replacement skeleton. Do not decrement a count twice when the server acknowledges an optimistic read. On failure, restore only the affected state and offer a compact retry; one failed read must not undo another successful read. Reconcile uncertain outcomes with server state.

Keep loaded messages, pagination coverage, scroll position, and open views mounted during background refresh. Do not call `refreshSettledViews` or reload commerce after notification actions. Honor pagination clicks during background reconciliation, coalesce duplicate requests, and use the refreshed cursor. Show scoped progress for initial loading, explicit refresh, and pagination. Do not show an empty state before initial loading finishes.

Preserve the provider's approximately 60-second polling while authenticated, visible, and online, plus refresh on focus, connectivity restoration, and native notification events. Release timers and listeners when no longer needed. Clear private notification memory on sign-out or buyer changes, and ignore late responses and queued actions from an earlier session. Do not persist notification contents in localStorage or add an offline write queue.

## Native delivery and verification

The web inbox and native push delivery share buyer notifications but have different responsibilities. Reuse the shared native observer and session adapter described in [native integration](native.md). The app owns `window.insituStoreNative`, permissions, tokens, and device association. Do not add a Firebase web client, bundle the native SDK, or request native permissions from the inbox. Preserve native notification listeners and navigation to the inbox when a notification is tapped. Browser use does not require a native global, and push denial must not block inbox access or shopping.

Run the template's notification controller, API, UI, and desktop/mobile browser checks. Verify the latest-five preview, global count, pagination, complete-message detail, confirmation cancellation, and keyboard/focus behavior. Hold API responses to verify immediate optimistic changes without persistence spinners. Exercise failed and concurrent writes, stale requests, buyer changes, offline recovery, and retained content during refresh. Verify header placement and mobile safe areas with the existing company design; follow [browser and app layout](layout.md).

Report synthetic browser checks separately from device push-delivery acceptance. Follow the skill's existing publication approval and upload workflow for the reviewed storefront.
