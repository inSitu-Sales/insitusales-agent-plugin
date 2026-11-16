# Browser and app layout

## Compatibility is the default

Generate one responsive storefront for ordinary browsers and optional white-label embedding. A company does not need to own or enable an app for its HTML and CSS to follow these rules. A storefront URL does not establish white-label enrollment. Commerce and manual search must work when the native global is absent; expose native actions only through the maintained adapter and confirmed capabilities.

## Viewport and form controls

Preserve a device-width viewport with an initial scale of one. Keep text-entry inputs, search, email/password fields, textareas, and selects at a computed font size of at least 16 CSS px. A body default does not protect controls whose component styles reduce the font. Preserve larger type and user text scaling. Check sign-in, activation, search, quantity entry, and checkout after changing skins or form styles.

Prevent accidental focus magnification with readable control sizing, rather than disabling zoom with `user-scalable=no`, restrictive `maximum-scale`, or global cancellation of `touchstart` or `touchmove` events. The app's font protection is a fallback, not a substitute for correct storefront CSS. Native inputs and browser inputs need the same readable baseline.

Use responsive widths, border-box sizing, and flexible children that can shrink. Avoid horizontal overflow from viewport-width elements with added padding or fixed desktop dimensions. Size the layout against its current viewport; do not assume the iframe has the full physical screen height. Preserve content scrolling instead of copying the app shell's overflow lock into the storefront. Keep controls reachable without clipping content or shrinking control text to fit.

## Navigation and safe areas

The app reserves physical status and gesture insets outside the iframe. Treat the iframe viewport as the available content rectangle. Do not copy the shell's inset padding, hardcode device dimensions, or draw fake system bars inside the storefront. Do not access `window.top` to change app appearance.

For standalone full-bleed layouts, use viewport-fit and CSS safe-area values only where that presentation needs them. Measure the result inside the app as well; an iframe must not reserve the same physical inset again. Inspect the template's layout before adding inset logic, and keep a single policy for the page.

Give a fixed bottom navigation its own content clearance so it does not cover the last item, action, or legal link. Reserve its rendered height once; avoid a spacer plus duplicate body padding. With the keyboard open, keep the focused field and its action visible, and restore the layout after dismissal or rotation. Keep the header, navigation, and page surface colors coherent.

A colored strip outside the iframe belongs to the app's appearance configuration. Report its location and observed colors to the app maintainer; do not compensate with negative offsets or extra page padding. Storefront authors own the page layout, while the app owns system bars, native permissions, and native scanner controls.

## Verify before calling the layout ready

Check a small phone, a wider phone, landscape, and desktop. Use actual search text and long form content. Inspect computed control fonts and horizontal overflow. Compare viewport scale before and after focus; verify content scrolling, fixed navigation, direct-route reload, and the last reachable content. Open and dismiss the keyboard when the test environment supports it.

For every project, verify ordinary-browser behavior without the SDK and an embedded preview using a bounded viewport. Confirm that absent native capabilities leave manual search and commerce usable. When a compatible app and testing access exist, also verify focus, keyboard transitions, safe areas, and native actions on the emulator or device. A browser iframe or simulated SDK does not prove WebView behavior. Report unavailable native checks precisely; an optional app does not become a prerequisite for browser publication. Follow the skill's existing publication approval and commerce-test boundaries.
