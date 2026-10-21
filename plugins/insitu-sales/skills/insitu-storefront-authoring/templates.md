# Maintained skin source

## Available source

| Skin      | Source archive                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------- |
| `default` | https://storage.googleapis.com/insitusalesfront-skin-templates/templates/default/source.tar.gz |

Only the listed skin is available. Do not invent other skin URLs or list the bucket. Downloads are public; bucket listing is private. This archive supplies editable source and assets with the shared business core, not a company deployment or a compiled storefront.

The stable URL serves the current release. GCS Object Versioning retains previous generations; record the response's `x-goog-generation` and the archive's SHA-256 with the local source. A generation-specific download uses the same URL with `?generation=<generation>`. Do not assume a later download from the stable URL has identical bytes.

## Download and adapt

Download over HTTPS without credentials, retaining response headers. If unavailable, report the blocker rather than substituting an unverified source. Inspect archive entries before extraction: reject absolute or parent-traversing paths, duplicate paths, links, and special files. Extract into a new empty directory without overwriting existing work. Do not start downloaded scripts during extraction.

Read `release-manifest.json` and verify every listed file's SHA-256 against the extracted bytes; reject missing or unexpected files apart from the manifest itself. These hashes detect inconsistency, not publisher authenticity: the manifest travels in the same archive. Keep the original archive, generation, and digest for reproducibility.

Read the included README, toolchain metadata and package scripts before running commands. After dependency installation is approved, use the declared package manager and frozen lockfile. Dependency installation can start package scripts; downloading source alone grants no permission for installation or script execution.

Remix the skin's presentation while reusing the shared business core and styleless React workflows. Discover current service contracts as directed by the skill; bundled queries are a starting point, not proof that the connected service supports them. Preserve authorization, session isolation, authoritative money, cart consistency, checkout consent and uncertain-order handling. Keep company configuration independent of skin styling.

Use the included checks and mobile/desktop previews to verify the adaptation. Publish only the reviewed static build through the skill's administrator authorization and upload-helper procedure. Never submit this source archive as a company release.
