# Extension brand mark

`insitu-mark.png` is the official 120 × 120 transparent inSitu Sales mark, copied unchanged from `inSituSales120 Background Removed.png` in the supplied brand asset folder.

Use the colored mark for the extension header and plugin icon in both light and dark themes. The supplied white-only alternative disappears on light backgrounds. Keep the adjacent inSitu Sales name as live text so it follows the host theme. No AI-generated artwork is used in the shipped logo.

The build generates `server/workspace-brand.cjs` from this PNG. Both the launcher's MCP `tools/list` icon and the local server's fallback icon use that self-contained image. Sidebar navigation resolves these icons independently of the manifest's `interface.logo` and `interface.composerIcon`. `verify-install.mjs` compares the installed launcher and server icons with this source PNG.
