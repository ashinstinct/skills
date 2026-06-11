---
name: discovery-template
description: Template for documenting what was found during the Capture phase
metadata:
  tags: template, discovery, capture
---

# Discovery notes — `<site-slug>`

Fill this in during/after Phase 1 (Capture). Copy this file to `capture/discovery.md` and complete each section. Keep it factual and specific (URLs, file paths, library names) — this is the reference document for Phases 2–4.

## Site overview

- **Source URL**: `<url>`
- **Capture date**: `<date>`
- **Stack detected**: `<e.g., Next.js (App Router), static HTML, Webflow export, custom React/Vite, Nuxt 3, ...>`
- **Mode chosen**: `<Static Mirror | Editable Recreation>` — reasoning: `<...>`

## Routes

| Route | Source (sitemap/link/framework-data) | Captured? | Notes |
|---|---|---|---|
| `/` | sitemap | yes | |
| `/about` | link | yes | |
| ... | | | |

Total routes discovered: `<n>`. Routes captured: `<n>`. Routes intentionally skipped and why: `<...>`

## Asset inventory (by type)

| Type | Count | Total size | Notes |
|---|---|---|---|
| HTML | | | |
| CSS | | | |
| JS | | | |
| Images (raster) | | | |
| Images (vector/SVG) | | | |
| Fonts | | | |
| Video | | | |
| Audio | | | |
| 3D/WebGL (`.glb`/`.gltf`/`.hdr`/etc.) | | | |
| Other | | | |

## Animation systems detected

See [animation-audit.md](animation-audit.md) for the full per-animation breakdown. Summary here:

- **Library/approach**: `<e.g., GSAP + ScrollTrigger, Framer Motion, AOS, CSS-only, Lottie, custom>`
- **Notable patterns**: `<e.g., hero text reveal on load, parallax on scroll, sticky sections, page transitions>`

## WebGL / 3D content

- Present? `<yes/no>`
- Library: `<Three.js / Babylon / Spline / PlayCanvas / raw WebGL / ...>`
- Asset files found: `<list .glb/.gltf/.hdr/.ktx2/etc. with URLs>`
- Loaded on: `<initial load / scroll / interaction — describe trigger>`
- See [modules/webgl-3d.md](../modules/webgl-3d.md)

## Video / audio

- `<video>`/`<audio>` elements found: `<list with src, autoplay/loop/muted attrs>`
- Streaming (`.m3u8`/`.mpd`)? `<yes/no — details>`
- Third-party embeds (YouTube/Vimeo/Wistia)? `<list>`
- Web Audio API usage? `<yes/no — details>`
- See [modules/video-audio.md](../modules/video-audio.md)

## Runtime / late-loaded assets

- Lazy-loaded images requiring extra scroll passes? `<yes/no>`
- Code-split chunks behind interactions (modals, tabs, etc.)? `<list>`
- Dynamically injected styles (CSS-in-JS)? `<yes/no — library if known>`
- A/B testing / personalization scripts detected? `<list>`
- See [modules/runtime-assets.md](../modules/runtime-assets.md)

## External dependencies (third-party scripts/services)

| Service | Purpose | Keep, drop, or mock? |
|---|---|---|
| `<e.g., Google Analytics>` | analytics | drop |
| `<e.g., Stripe Checkout>` | payments | keep (note: needs real keys to function) |
| ... | | |

## Auth / gated content

- Any sections requiring login? `<yes/no — describe what's behind it and whether it was reachable>`

## Console errors / warnings during capture

`<paste relevant excerpts from capture/pages/<route>/console.log, or "none">`

## Open questions for the user

`<anything that needs a decision before proceeding — e.g., "the hero video is 45MB, mirror it fully or use a placeholder?">`
