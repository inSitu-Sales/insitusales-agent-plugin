# Native app integration

## Ownership and delivery

`st_white_label_b2becommerce` owns the Capacitor shell, native plugins, Firebase client configuration, and executable SDK. The app injects `window.insituStoreNative` at document start into its authorized storefront frame. The maintained template contains public TypeScript types and a session adapter, not a copy of the SDK implementation.

Read the downloaded template's README, shared provider, native observer, and public types. Do not download, install, bundle, or recreate the native SDK in a customer storefront. Do not add Firebase clients, arbitrary Capacitor access, or a script URL as a fallback. A missing global in the app requires checking app version, configured origin, and injection support. An ordinary browser must remain usable without it.

## Consume the injected API

`StoreProviders` discovers the injected global and connects the buyer session. Components use `useStoreRuntime().native`; preserve the provider and session adapter during remixes. The global's exact name is `window.insituStoreNative`. The shared observer handles an existing global and the app's `insituStoreNativeAvailable` event. It exposes a connected SDK after the `ready` handshake confirms a supported protocol.

Check capabilities before offering native actions. For scanning, subscribe with `native.scanner.onBarcode(callback)` and call `native.scanner.start()` from a user action. Send results through the existing catalog search. `preview()` also starts scanning; `stop()` closes it. The app-owned SDK handles camera consent. Stop scanning and unsubscribe when leaving the scan view without disposing the shared SDK. Keep manual search available.

The injected SDK automatically initializes notifications after its handshake. `notifications.ready` describes native registration or permission failure; `notifications.sessionStatus` describes buyer/device association. The shared adapter supplies the active buyer session, renewed credentials, account changes, and sign-out through `notifications.setSession(...)`. Storefront authors do not implement permission requests, token storage, or backend registration. Optional `onNotification` and `onAction` listeners support presentation. Notification denial or failure must not block commerce.

Both platforms expose FCM tokens. The native iOS integration connects APNs registration to Firebase Messaging. Private sender credentials belong outside the storefront and native bundles; administrator OAuth is not a buyer session.

## Existing projects and compatibility

Legacy template 0.1.0 included an executable SDK under `src/native/sdk/`. For an existing project, preserve its skin customizations while updating the shared provider, observer, public types, and session adapter from the maintained template. Remove the old SDK runtime and import tooling. Do not replace the entire customized project. The app needs an injection-capable build; publishing new web code cannot add that native implementation to an older installed app.

Compatible SDK implementation updates are delivered by the app and do not require replacing the storefront's core. New methods may still require updated consumers and capability checks. Native plugin changes require a store build. OTA delivery is not configured by this integration.

The app registry selects the HTTPS storefront URL. The owned shell uses `capacitor://localhost` on iOS or `https://localhost` on Android and loads the storefront in a separate iframe. Preserve exact origin/direct-frame checks. Never replace this boundary with remote `server.url` or unrestricted injection.

## Verify and publish

Verify browser fallback, app readiness, scanning/cancellation, notification denial, account changes, and sign-out. Run the template's included checks. Report simulated native boundaries separately from physical-device testing. Verify backend schema support before claiming device association; compilation and SDK readiness do not prove FCM/APNs delivery.

Publish the compiled static storefront through the skill's supported publication workflow. Publishing does not distribute the native app. Pending association cleanup remains in document memory and may be lost during offline destruction. App builds, backend deployments, and store submissions require their authorized scope.
