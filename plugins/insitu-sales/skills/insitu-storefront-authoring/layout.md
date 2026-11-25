# Browser and app layout

## Storefront style

Use the maintained skin's visual system as a starting point. Reuse its theme variables, spacing, typography, and shared components. Apply the requested brand changes consistently. Check the existing storefront or supplied reference for design intent and adapt it to the connected source. Review the whole page after a targeted change.

- **Brand and navigation.** Keep the company logo visible in the header. Use the maintained company branding and fallback when a logo is missing. Preserve access to Home and Catalog on desktop and mobile. For signed-in buyers, keep the notification bell and unread count through the [maintained inbox](notifications.md). Preserve existing search, account, and cart access when restyling the header.
- **Desktop and mobile.** Align the header content with the page grid. Use a compact header and consistent gutters from the skin. At desktop widths, let navigation and the catalog use the available width. At phone widths, adapt the layout and keep every key route reachable. Inspect both sizes for excessive margins, clipped controls, and unexpected empty space.
- **Verify in the preview.** Open Home and Catalog in a wide desktop viewport and a narrow phone viewport. Check the logo, keyboard focus, image proportions, navigation, and catalog layout. For authenticated features, use an authorized buyer session or state which checks need one. Preserve an intentional visual change when the user requests it explicitly.

## Compatibility is the default

Generate one responsive storefront for ordinary browsers and optional white-label embedding. A company does not need to own or enable an app for its HTML and CSS to follow these rules. A storefront URL does not establish white-label enrollment. Commerce and manual search must work when the native global is absent; expose native actions only through the maintained adapter and confirmed capabilities.

## Viewport and form controls

Include exactly one viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`. Keep text-entry inputs, search, email/password fields, textareas, and selects at a computed font size of at least 16 CSS px. A body default does not protect controls whose component styles reduce the font. Preserve larger type and user text scaling. Check sign-in, activation, search, quantity entry, and checkout after changing skins or form styles.

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
