# Native app integration

## Ownership and source

`st_white_label_b2becommerce` owns the Capacitor Android/iOS shell, brand selection, native plugins, Firebase client configuration, and browser SDK. It is separate from the maintained skins in `st_insitusales_b2bportal_skins` and the buyer API in `st_backend_insitusales_b2bportal`. A storefront remix normally changes only presentation in a skin.

Read the downloaded template's README, shared provider, native adapter, and SDK declarations before using native features. A local integration does not prove that the published source archive contains it. If those files are absent, report the compatibility gap and continue a browser preview. Do not recreate the native integration in a customer skin or invent a package name, repository URL, or API operation.

## Consume the shared integration

The maintained `StoreProviders` installs the SDK when framed and connects the commerce session to native notifications. Components obtain the connected SDK from `useStoreRuntime().native`. The browser global is `window.insituStoreNative`, not `window.insituStore`. Preserve the provider and its session adapter when changing layouts.

The SDK's `ready` promise completes the native handshake and returns capabilities. Check those capabilities before exposing native actions. An ordinary browser must remain usable when the SDK or a capability is unavailable. Do not block sign-in, catalog access, or checkout on notification permission or registration.

For a scan button, subscribe with `native.scanner.onBarcode(callback)` and call `native.scanner.start()` from the user's action. `preview()` opens the camera preview; `stop()` closes it. The SDK and native shell handle camera permission when scanning is requested. Stop an active scan and unsubscribe when leaving the scan view. A component must not dispose the shared SDK.

Notification initialization starts automatically after the handshake, including permission requests and native registration. `notifications.ready` reports registration, denial, unavailability, or an error independently of commerce. The shared session adapter calls `notifications.setSession(...)` as the buyer signs in, changes accounts, refreshes credentials, or signs out. It owns backend association and retries; skin components must not duplicate this lifecycle. Use `onNotification` or `onAction` only when the presentation needs those events, and unsubscribe when the component unmounts.

Both platforms provide FCM tokens. On iOS, the native integration connects APNs registration to Firebase Messaging before exposing the FCM token. Keep Capacitor plugins and Firebase clients in the native app. Do not add them to a skin, persist tokens there, write directly to Firestore, or reuse administrator OAuth for buyer operations.

## Update the shared integration when authorized

For work on the native/shared integration itself, inspect the native repository's README, `package.json`, `sdk/index.ts`, session types, and `white-label/` registry. Build its distributable with `npm run build:sdk`. From the maintained skins repository, import that output:

```sh
yarn native:import --from <native-repository>/dist-sdk
```

The import updates the vendored SDK, declarations, and integrity metadata together. Do not edit generated SDK files. Preserve the shared session adapter rather than adding a second initializer. A custom host without that provider needs the maintained adapter: `notifications.setSession({ endpoint, hostname, bearer, accountKey })` for the active buyer and `setSession(null)` on sign-out. Read its types and adapter before implementing this path. Derive the account key from the verified company and buyer identity; it is a local matching key, not server authorization. Never ask an author to supply a buyer bearer token.

The app's brand registry selects its HTTPS storefront URL. Use the authenticated project context and configured brand; do not hardcode another company's hostname. The owned shell runs at `capacitor://localhost` on iOS or `https://localhost` on Android and loads the storefront in a separate iframe. Preserve origin/frame checks; do not replace this boundary with remote `server.url` or expose the general native bridge to the storefront.

## Verify and report limits

Check browser fallback, scan permission and cancellation, notification denial, account changes, and sign-out. Verify required buyer operations against the deployed schema before claiming backend compatibility. Missing deployed support requires an integration change, not an invented fallback endpoint.

Publishing a static storefront does not build, sign, or distribute the native app. SDK readiness and compilation do not prove push delivery; report device verification separately. Pending association cleanup is held in memory and may be lost if an offline document is destroyed. Keep Firebase sender credentials outside static artifacts and native app bundles. Native builds, backend changes, and store submissions require their own authorized scope.
