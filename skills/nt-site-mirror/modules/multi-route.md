---
name: multi-route-module
description: Discovering and mirroring routes for multi-page sites, Next.js, Nuxt, and other SPA/SSG frameworks
metadata:
  tags: routing, next.js, nuxt, spa, sitemap, route discovery
---

# Multi-route module

Load this module whenever the target is more than a single page, or you suspect there are routes beyond the entry URL (nav links, a sitemap, a blog/CMS section).

## Step 1: Route discovery

[scripts/capture.mjs](../scripts/capture.mjs) performs discovery automatically using these sources, in order:

1. **`/sitemap.xml`** (and `/sitemap_index.xml` if it's an index of sub-sitemaps) — most reliable source for SSG/SEO-conscious sites.
2. **`<a href>` links** found in the rendered DOM of every page already crawled — followed only if same-origin and not matching an exclude pattern (default excludes: `mailto:`, `tel:`, `#`-only anchors, and common non-content paths like `/wp-admin`, `/cart`, `/account`, `/api`).
3. **Framework-specific data**:
   - **Next.js**: look for `__NEXT_DATA__` (a `<script id="__NEXT_DATA__" type="application/json">` in the page source) — it includes `page`, `query`, and sometimes `buildId`. The `buildId` lets you identify `_next/static/<buildId>/_ssgManifest.js` and `_next/data/<buildId>/<route>.json` paths used for client-side navigation data fetching — these should be captured per-route too, since the client app fetches them on navigation.
   - **Nuxt**: look for `window.__NUXT__` (Nuxt 2) or the `<script id="__NUXT_DATA__">` payload (Nuxt 3) — contains the page's data and sometimes a list of static routes if `nuxt generate` was used (`payload.json`/`_payload.json` per route).
   - **Other SSG** (Astro, Gatsby, Eleventy, Hugo, Jekyll): these typically produce fully static HTML per route, so sitemap + link-following is usually sufficient.

Discovered routes are written to `capture/manifest.json` under `routes[]`, each with `status` (`pending`/`captured`/`failed`) and `source` (`sitemap`/`link`/`framework-data`).

## Step 2: Bound the crawl

Use `--max-pages` (default 20) to cap how many routes are captured. For large sites:

- Prioritize: home page, top-level nav destinations, and 1–2 representative examples of each templated route type (e.g., one blog post, not all 200; one product page, not the full catalog) — unless the user explicitly wants the full catalog.
- For templated routes (`/blog/[slug]`, `/products/[id]`), capture 2-3 examples to understand the template, then in Editable Recreation Mode build the template once and note in the report that other instances follow the same pattern and weren't individually mirrored.
- If the user wants "the whole site" and it's large (50+ routes), confirm before running a long crawl — give them the route count from `/sitemap.xml` first if available.

## Step 3: Next.js specifics

### Static Mirror Mode
- Preserve the `_next/static/` directory structure exactly — chunk filenames are content-hashed and referenced by exact path from `__NEXT_DATA__` and other chunks.
- For each route, also fetch `_next/data/<buildId>/<route>.json` (if present) — the client router uses this for soft navigations between pages. Place it at the same relative path under `site/_next/data/...`.
- If the site uses the **App Router** with React Server Components, some content streams via RSC payloads (`text/x-component` responses, often with a `?_rsc=` query param). These are harder to mirror generically — if present, prefer the rendered-DOM-snapshot approach for those routes (see [static-mirror.md](../modes/static-mirror.md#step-1-decide-what-the-page-is)) rather than trying to keep the app fully hydrated/interactive.
- Client-side navigation between mirrored pages may still attempt to fetch `_next/data/...` for routes you didn't capture, causing 404s on navigation (the page itself loaded fine via direct URL). This is a common "first click after load works, second click 404s" symptom — mention it in the report if you've only captured a subset of routes, since it's expected, not a bug in the mirror.

### Editable Recreation Mode
- Map `_next/data` / `__NEXT_DATA__` `props.pageProps` to the data your recreated components need — this is often the cleanest source of the page's actual content (text, structured data) without parsing rendered HTML.
- If recreating in Next.js, App Router with file-based routing maps directly: `/about` → `app/about/page.tsx`, `/blog/[slug]` → `app/blog/[slug]/page.tsx`.

## Step 4: Nuxt specifics

- Nuxt 3 with `nuxt generate` produces a `payload.json` (or `_payload.json`) per route under the route's path — capture these alongside the HTML.
- `window.__NUXT__` (Nuxt 2) or the inline `<script type="application/json" id="__NUXT_DATA__">` (Nuxt 3) contains the page's `data`/`state` — useful for Editable Recreation as a content source, same as Next's `__NEXT_DATA__`.
- Route mapping for recreation in Nuxt 3: `/about` → `pages/about.vue`, `/blog/[slug]` → `pages/blog/[slug].vue`.

## Step 5: Shared layout extraction

Across all captured routes, identify what's shared (header, nav, footer, cookie banner, any persistent floating elements) vs. per-route content. This matters for both modes:

- **Static Mirror**: shared elements will naturally be duplicated across each route's HTML (that's fine, it's how the original works) — but if you find inconsistencies (e.g., nav differs slightly between two captured routes), check whether that's intentional (different active states) or a capture artifact (one route captured before full hydration).
- **Editable Recreation**: shared elements become a layout component used by all routes — this is one of the biggest wins for maintainability vs. the original.

## Step 6: 404 / error pages

Capture the site's 404 page if reachable (request a clearly-nonexistent path like `/nt-site-mirror-404-check`). Preserve/recreate it — it's a real part of the site and easy to forget.

## Validation checklist additions for multi-route sites

- Every captured route loads without error in [serve.mjs](../scripts/serve.mjs)
- Internal navigation links between mirrored routes resolve to the local mirrored versions (not the live site)
- Shared header/nav/footer is consistent across routes (or intentional differences are understood)
- 404 page works for unmirrored routes
