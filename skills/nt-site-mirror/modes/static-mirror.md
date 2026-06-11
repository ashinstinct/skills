---
name: static-mirror-mode
description: Workflow for producing a faithful static (or near-static) local mirror of a live site
metadata:
  tags: static mirror, clone, asset preservation, url rewriting, spa
---

# Static Mirror Mode

Goal: reproduce the **deployed runtime** as closely as possible — same DOM, same CSS, same JS bundles, same media — running locally from `site/`.

This mode does the least transformation possible. You are not rewriting code for readability; you are making a deployed site work from a local filesystem (or a simple local server) instead of its original domain.

## Inputs

- `capture/manifest.json` — every route and asset discovered during Phase 1
- `capture/pages/<route>/dom.html` — the fully rendered DOM for each route (post-JS-execution)
- `capture/assets/**` — downloaded assets, mirrored under their original path structure
- `capture/discovery.md` — your notes on routing, animation systems, special asset types

## Step 1: Decide what "the page" is

For each route, you have two candidate sources:

1. **Original source HTML** (`capture/assets/<route>/index.html` as served by the server) — smaller, often a shell for client-rendered apps.
2. **Rendered DOM snapshot** (`capture/pages/<route>/dom.html`) — what the browser produced after JS ran.

Rule of thumb:
- If the original source HTML already contains the real content (server-rendered or static site), **use the original source HTML**. This keeps `<script>`/`<link>` tags intact so the site's own JS/CSS still drives behavior — animations, routing, and interactivity keep working.
- If the original HTML is a near-empty shell (`<div id="root"></div>` / `<div id="__next">` etc.) and content only appears after hydration, you have two options:
  - **Preferred**: keep the original shell + JS bundles as-is. A correctly mirrored SPA will hydrate itself client-side exactly like the live site, as long as its JS can fetch its own data/assets locally (see Step 4 for API calls).
  - **Fallback**: if the SPA's JS depends on remote APIs you can't mirror, use the rendered DOM snapshot as static HTML per route (this freezes the page at capture time — interactivity that depends on live data will not work, but layout/visuals are preserved). Note this clearly in the report.

## Step 2: Lay out `site/`

Mirror the URL path structure on disk so relative links resolve naturally:

```
site/
  index.html
  about/index.html          # for /about
  blog/post-1/index.html     # for /blog/post-1
  _next/static/...           # framework chunks, preserved verbatim
  assets/, images/, fonts/, video/, audio/, models/...  # as discovered
```

Use trailing-slash + `index.html` per route so a static file server resolves `/about` → `about/index.html` without extra config.

## Step 3: Rewrite URLs

Every absolute URL pointing at the original domain needs to become a local path. This includes:

- `<script src>`, `<link href>`, `<img src>`, `<source src>`, `<video poster>`
- CSS `url(...)` references (background images, fonts, `@font-face`)
- JS string literals that reference asset paths **only when safe** — be conservative; rewriting arbitrary strings inside minified JS can break the bundle. Prefer rewriting only:
  - Build-tool-generated asset manifests (e.g., Next.js `_next/static/chunks/...` paths are already root-relative and usually need no change if served from `/`)
  - Explicit `fetch("https://original-domain.com/...")` calls to static asset endpoints (CDN domains) — rewrite the **CDN host** to a local equivalent path, not the whole call, when it's clearly just an asset fetch
- `srcset` attributes (multiple URLs, comma-separated)
- Inline `style="background-image:url(...)"`
- Web manifest (`manifest.json`), favicons, Apple touch icons

For root-relative paths (`/images/foo.png`) that match the directory layout in `site/`, no rewriting is needed if you serve `site/` from `/`. For absolute paths to a different host (e.g., a CDN at `https://cdn.example.com/...`), download the asset into `site/` under a path that mirrors the CDN's path (e.g., `site/_cdn/cdn.example.com/...`) and rewrite references to that local path.

Do this rewriting with a script, not by hand — see [scripts/mirror.mjs](../scripts/mirror.mjs) which:
- Reads `capture/manifest.json`
- Copies assets into `site/` with their target paths
- Rewrites HTML/CSS (and conservatively, JS asset-manifest files) to reference local paths
- Leaves framework JS bundles untouched unless they contain hardcoded absolute URLs to the asset CDN

```bash
node scripts/mirror.mjs <project-root>/nt-mirror/<site-slug>/capture <project-root>/nt-mirror/<site-slug>/site
```

## Step 4: Handle API calls and dynamic data

Static mirrors of dynamic sites commonly break because client-side JS calls a backend API that:
- Requires authentication you don't have
- Has CORS restrictions that block requests from `localhost`
- Simply won't exist once mirrored

For each such call (look for `fetch(`, `XMLHttpRequest`, `axios`, GraphQL clients in the captured network log):

1. If the response was captured during Phase 1 (check `capture/manifest.json` for XHR/fetch entries with JSON bodies), save the response as a static JSON file under `site/_api/...` and consider whether a tiny local mock server (or a service worker / fetch monkey-patch injected via a `<script>` added to the mirrored HTML) should serve it for local validation. Only do this if it's needed to validate visuals — don't over-engineer a mock backend for a static mirror.
2. If the call is to a third-party service that should keep working as-is when later deployed (e.g., a forms backend, payment processor) — leave it pointed at the real endpoint and note it in the report under "External dependencies." It generally won't work from `localhost` due to CORS but will work once deployed to a real domain.
3. If the call can't be captured and isn't essential to layout (e.g., analytics beacons), leave it — it'll just fail silently, which is fine.

## Step 5: Service workers and caching

If the site registers a service worker (`navigator.serviceWorker.register`), **strip the registration** in the mirror (or point it at a no-op). A stale service worker pointing at the original domain can intercept requests in confusing ways during local validation. Note this removal in the report.

## Step 6: Multi-route and SPA routing

See [modules/multi-route.md](../modules/multi-route.md). Summary:
- For statically-generated/multi-page sites: every discovered route gets its own `index.html` per Step 2 — no special server config needed beyond the directory layout.
- For client-side-routed SPAs (React Router, Next.js client navigation, etc.): keep one `index.html` shell plus per-route static fallbacks if you generated DOM snapshots; configure [scripts/serve.mjs](../scripts/serve.mjs) with `--spa-fallback index.html` so deep links still load the shell and let client-side routing take over.

## Step 7: Special asset types

- WebGL/3D → [modules/webgl-3d.md](../modules/webgl-3d.md)
- Video/audio → [modules/video-audio.md](../modules/video-audio.md)
- Lazy-loaded/runtime assets → [modules/runtime-assets.md](../modules/runtime-assets.md)

## Step 8: Rebrand-only edits (fast path)

If the user's goal is a quick rebrand on top of a static mirror (swap logo, colors, copy, a few images) and NOT a full recreation:

1. Complete Steps 1–7 to get a working mirror first — validate it matches the original.
2. Make the requested edits directly in `site/` (replace image files keeping the same filenames/paths where possible so no reference rewriting is needed; edit text nodes in HTML; edit CSS custom properties for color swaps if the site uses them, otherwise find-and-replace hex/color values consistently).
3. Re-run Phase 4 validation to confirm the edits look correct at all three viewports and nothing else regressed.

## Done criteria for this mode

- `site/` serves locally via [scripts/serve.mjs](../scripts/serve.mjs) with no 404s for first-party assets
- Every route from `capture/manifest.json` either has a corresponding page in `site/` or is documented as intentionally excluded
- Animations/video/audio/WebGL behave the same as the live site (or differences are documented)
- `templates/asset-preservation.md` is filled in completely
