---
name: nt-site-mirror
description: Turn any live website into a local, editable codebase. Capture a deployed site, rebuild it as a static mirror or a clean editable recreation, serve it locally, and validate fidelity across desktop, tablet, and mobile.
metadata:
  tags: web mirror, site clone, scraping, playwright, rebrand, frontend rebuild, validation, webgl, video, multi-route
---

## When to use

Use this skill whenever the user gives you a live URL (or a small set of URLs) and wants:

- A local, working copy of a site they can edit ("clone this site", "mirror this page", "pull down this site so I can change the copy/colors/logo")
- A clean, component-based rebuild of a site for a rebrand, redesign, or new project ("recreate this landing page in React/Next", "rebuild this site but with our branding")
- A reference implementation to study layout, animation, or interaction patterns from a real site
- A way to resurrect a site whose original source is missing, messy, or unmaintainable

Do **not** use this skill for: scraping data/content at scale, bypassing paywalls or auth-gated content, or mirroring sites the user does not have the right to copy. Always confirm the user has the right to reproduce the target site (their own site, a client site they manage, or content explicitly licensed for reuse).

## The five-phase workflow

NT Site Mirror always runs the same five phases, in order. Do not skip phases — each phase produces an artifact the next phase depends on.

```
1. CAPTURE   →  2. MIRROR or RECREATE  →  3. SERVE  →  4. VALIDATE  →  5. REPORT
```

| Phase | Goal | Primary output |
|---|---|---|
| 1. Capture | Crawl the live site, record routes, download every reachable asset, and observe runtime behavior (animations, video/audio, WebGL, lazy-loaded content). | `capture/` directory + `capture/manifest.json` + `capture/discovery.md` |
| 2. Mirror or Recreate | Either preserve the captured site as a static mirror, or recreate it as clean editable source using the captured assets as ground truth. | `site/` directory (working project) |
| 3. Serve | Run the rebuilt site locally with correct routing, asset paths, and (if relevant) SPA fallback. | Running local server + URL |
| 4. Validate | Screenshot the local build at desktop, tablet, and mobile viewports and compare against the captured originals; check console errors, broken links, missing assets. | `validation/` directory with screenshots + diff notes |
| 5. Report | Summarize what was captured, what was preserved vs. recreated, what's blocked or missing, and what the user should check manually. | `REPORT.md` |

Default working layout for a run (create under the project root, or under `./nt-mirror/<site-slug>/` if the project root already has unrelated content):

```
nt-mirror/<site-slug>/
  capture/            # raw captured HTML, assets, manifest, discovery notes
  site/               # the rebuilt project (mirror or recreation)
  validation/         # screenshots + validation notes
  REPORT.md
```

## Step 0: Clarify scope before starting

Before capturing anything, confirm with the user (briefly, don't over-ask):

1. **Target URL(s)** — a single page, or a whole site? If a whole site, is there a known set of routes, or should routes be discovered?
2. **Mode** — Static Mirror or Editable Recreation? See [Choosing a mode](#choosing-a-mode) below. If unclear, ask.
3. **What should change** — for recreation/rebrand work, get the specifics up front: new copy, logo, color palette, fonts, sections to remove/add. This avoids redoing work later.
4. **Auth/gating** — does any part of the site require login? If so, the skill can only capture what's reachable without credentials unless the user provides a way to authenticate.

If the user already gave you everything needed (URL + mode + intent), don't block on this — proceed and note assumptions in the final report.

## Choosing a mode

### Static Mirror Mode
Best when the goal is to **preserve the deployed experience** as closely as possible: pixel-accurate layout, original animations, original bundle behavior. Produces a static (or near-static) copy of the deployed HTML/CSS/JS/assets, with paths rewritten to work locally.

Choose this when the user says things like: "clone this site exactly", "I need an offline copy", "preserve the animations/video exactly as they are", "I just need to swap a few words/images and keep everything else identical".

Read [modes/static-mirror.md](modes/static-mirror.md) for the full workflow.

### Editable Recreation Mode
Best when the goal is **clean, maintainable source code**: a component-based rebuild (e.g., React/Vite, Next.js, or plain semantic HTML/CSS/JS) that reproduces the look and behavior but is easy to edit, rebrand, and extend.

Choose this when the user says things like: "rebuild this as a React app", "recreate this for our brand", "I want to be able to easily change the layout later", "the original site is a mess / minified / unreadable".

Read [modes/editable-recreation.md](modes/editable-recreation.md) for the full workflow.

### Falling back between modes

- If Static Mirror Mode hits a site that is too dynamic to mirror faithfully (heavy server-side personalization, API calls requiring secrets, aggressive anti-scraping), fall back to Editable Recreation for the affected sections and say so explicitly in the report.
- If Editable Recreation Mode is requested but the user later asks for "exactly as-is" fidelity on a specific section (e.g., a complex WebGL hero), it's fine to embed a mirrored asset for that section rather than re-implementing it from scratch — note this as a hybrid in the report.

## Phase 1 — Capture

Use [scripts/capture.mjs](scripts/capture.mjs) (Playwright-based) to crawl the site. It:

- Loads each route in a real browser (handles client-side rendered/Next/Nuxt sites)
- Records every network response (HTML, CSS, JS, images, fonts, video, audio, WebGL/3D assets, JSON/XHR)
- Scrolls the page to trigger lazy-loaded and scroll-triggered content
- Saves rendered DOM snapshots and console/error logs
- Writes `capture/manifest.json` describing every asset and route found

```bash
cd skills/nt-site-mirror/scripts
npm install   # first run only
node capture.mjs <url> --out <project-root>/nt-mirror/<site-slug>/capture --max-pages 20
```

After capture, fill in [templates/discovery.md](templates/discovery.md) — this is the map you'll use for phases 2–4. Pay special attention to:

- **Routes** — see [modules/multi-route.md](modules/multi-route.md) for Next/Nuxt route discovery
- **Animations** — see [templates/animation-audit.md](templates/animation-audit.md) and note which library is used (GSAP/ScrollTrigger, Framer Motion, AOS, CSS-only, Lottie, etc.)
- **WebGL/3D content** — see [modules/webgl-3d.md](modules/webgl-3d.md)
- **Video/audio** — see [modules/video-audio.md](modules/video-audio.md)
- **Runtime/late-loaded assets** — see [modules/runtime-assets.md](modules/runtime-assets.md)
- **External dependencies** — third-party scripts (analytics, chat widgets, A/B testing) that may not be worth preserving; flag these for the report

## Phase 2 — Mirror or Recreate

Follow [modes/static-mirror.md](modes/static-mirror.md) or [modes/editable-recreation.md](modes/editable-recreation.md) based on the chosen mode. Both modes consume `capture/manifest.json` and the discovery notes from Phase 1.

As you build, keep [templates/asset-preservation.md](templates/asset-preservation.md) updated — it tracks every asset from the manifest and whether it was preserved, recreated, replaced, or dropped (with a reason).

## Phase 3 — Serve

Use [scripts/serve.mjs](scripts/serve.mjs) to serve `site/` locally:

```bash
node scripts/serve.mjs <project-root>/nt-mirror/<site-slug>/site --port 4173
```

This is a static file server with:
- SPA fallback (serves `index.html` for unknown routes) when the manifest indicates client-side routing
- Correct MIME types for fonts, video, audio, WebGL/3D formats (`.glb`, `.gltf`, `.hdr`, `.ktx2`, `.basis`, `.drc`)
- Directory-based multi-route serving for statically-generated multi-page sites

For framework-based recreations (Next.js, Vite, etc.), use the project's own dev/build scripts instead (`npm run dev`, `npm run build && npm run preview`) — note the URL in the report.

## Phase 4 — Validate

Use [scripts/screenshot.mjs](scripts/screenshot.mjs) to capture the running local site at three viewports and compare against the originals captured in Phase 1:

```bash
node scripts/screenshot.mjs <local-or-live-url> --out <project-root>/nt-mirror/<site-slug>/validation --routes /,/about,/contact
```

Default viewports:
- Desktop: 1440×900
- Tablet: 768×1024
- Mobile: 390×844

Walk through [templates/validation-report.md](templates/validation-report.md):
- Visual comparison per route per viewport (screenshots side by side)
- Console errors / failed network requests in the local build
- Broken links, missing assets, layout shifts
- Animation/interaction spot-check (does scroll-triggered content fire? does video/audio play? does WebGL render?)

If something doesn't match, go back to Phase 2 and fix it before reporting — don't report known issues that are quick fixes.

## Phase 5 — Report

Write `REPORT.md` at the project root (use [templates/validation-report.md](templates/validation-report.md) and [templates/asset-preservation.md](templates/asset-preservation.md) as inputs). The report must cover:

1. **What was captured** — routes, asset counts by type, total size
2. **What mode was used and why**
3. **Fidelity** — screenshot comparisons, anything that doesn't match and why
4. **Blocked/missing assets** — anything behind auth, CORS, rate limits, or that failed to download, with the original URL so the user can fetch it manually if needed
5. **External dependencies** — third-party scripts/services that were intentionally excluded (analytics, chat, payments) and what that means for functionality
6. **How to run it** — exact commands to serve/build the result locally
7. **Suggested next steps** — for recreation mode, what to wire up next (forms, CMS content, real assets for placeholders)

## Reference modules

Load these as needed — don't read them upfront unless the captured site actually uses these features:

- [modules/webgl-3d.md](modules/webgl-3d.md) — Three.js/WebGL canvases, GLTF/GLB models, Draco compression, HDR environment maps, KTX2/Basis textures
- [modules/video-audio.md](modules/video-audio.md) — `<video>`/`<audio>` elements, HLS/DASH streams, background video, Web Audio API
- [modules/runtime-assets.md](modules/runtime-assets.md) — lazy-loaded images, scroll-triggered content, code-split JS chunks, dynamically injected styles
- [modules/multi-route.md](modules/multi-route.md) — discovering and mirroring routes for Next.js, Nuxt, and other SPA/SSG frameworks

## Setup

- [setup/claude-code-setup.md](setup/claude-code-setup.md) — installing and invoking this skill in Claude Code
- [setup/codex-setup.md](setup/codex-setup.md) — using this skill with Codex

## Guiding principles

- **Always show your work.** Every phase produces a file (manifest, discovery notes, screenshots, report) — these are not optional scratch work, they're how the user verifies what you did.
- **Never silently drop content.** If an asset can't be captured or a feature can't be reproduced, say so in the asset-preservation tracker and the final report — don't just omit it.
- **Prefer real assets over placeholders.** Only use placeholder images/text when the original is genuinely unavailable (auth-gated, blocked, or the user asked for new content).
- **Respect scope.** Don't "improve" things the user didn't ask about (e.g., don't refactor unrelated code, don't add new pages/sections that weren't on the original site or requested).
- **Validate before declaring done.** A mirror that hasn't been served and screenshotted at three viewports is not finished.
