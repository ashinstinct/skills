---
name: runtime-assets-module
description: Capturing late-loaded, lazy-loaded, scroll-triggered, and code-split assets that don't appear on initial page load
metadata:
  tags: lazy loading, code splitting, scroll trigger, intersection observer, dynamic imports
---

# Runtime / late-loaded assets module

Most of what makes a "naive `wget` clone" look broken comes from this category: things that simply aren't present in the network log on initial page load.

## Categories and how capture handles them

### 1. Lazy-loaded images (`loading="lazy"`, IntersectionObserver-based)

[scripts/capture.mjs](../scripts/capture.mjs) scrolls the full page height in increments (default step: viewport height, with a short pause between steps) before considering a page "captured." This triggers most `loading="lazy"` `<img>` and IntersectionObserver-based lazy loaders.

If a site uses an unusual lazy-load pattern (e.g., loads images only on a custom scroll event with debouncing, or only after a CSS animation completes), the default scroll pass may miss some. Symptoms: in `discovery.md`, you'll see `<img>` tags with `data-src`/`data-srcset` attributes that never resolved to a real `src`, or placeholder/blank images in the rendered DOM snapshot.

Fix: increase `--scroll-pause-ms` (gives lazy loaders more time per step) or `--scroll-passes` (re-scrolls the page multiple times) when running capture:

```bash
node capture.mjs <url> --out <capture-dir> --scroll-pause-ms 800 --scroll-passes 2
```

If specific images still don't resolve, check the manifest for the `data-src` URL pattern and download those directly — they're usually predictable (same CDN, same path structure as resolved images elsewhere on the site).

### 2. Scroll-triggered content / animations (GSAP ScrollTrigger, AOS, Framer Motion `whileInView`)

This is about **behavior**, not just assets — see [templates/animation-audit.md](../templates/animation-audit.md). During capture, the scroll pass also lets you observe (via the rendered DOM snapshot taken at the end, plus any console logging) which elements have animation classes toggled (`.aos-animate`, `.is-visible`, `data-scroll` states, etc.).

For Static Mirror Mode, the original JS that drives these libraries is preserved and will re-run locally, re-triggering the same animations on scroll — usually no extra work needed beyond ensuring the library's own asset dependencies (e.g., AOS's CSS file) are captured.

For Editable Recreation Mode, document each distinct animation pattern in the audit template so it can be recreated with an equivalent in the new stack.

### 3. Code-split JS chunks (dynamic `import()`)

Modern frameworks (Next.js, Nuxt, Vite) split JS into many chunks loaded on demand — for a specific route, on hover-prefetch, or when a component enters the viewport. The capture script's network log will catch chunks loaded during the scroll pass, but **chunks behind interactions** (opening a modal, switching a tab, submitting a form) won't load unless that interaction happens.

In `discovery.md`, note any interactive elements that likely lazy-load their own code (modals, tabbed content, accordions, "load more" buttons, complex form steps). For Static Mirror Mode:
- If the chunk is small and the interaction is core to the page (e.g., a pricing toggle), it's worth manually triggering during capture: extend the capture script's interaction step for this site, or do a manual headed-browser pass and add the resulting chunk URLs to the manifest.
- If the interaction is peripheral (e.g., a rarely-used modal), it's acceptable to leave it — the chunk will simply 404 if/when that interaction is attempted locally. Document this in the report so the user knows that specific feature won't work offline without the chunk.

For Editable Recreation Mode, this isn't usually an issue — you're writing new code, not relying on the original chunks, though you should still make sure you've **observed** the behavior (via a manual interaction pass) before recreating it.

### 4. Dynamically injected `<style>` tags / CSS-in-JS

Some sites inject styles via JS (styled-components, Emotion, vanilla-extract runtime, or simple `document.head.appendChild(styleEl)`). These won't appear as `.css` files in the network log — they're generated client-side and embedded directly in the rendered DOM.

[scripts/capture.mjs](../scripts/capture.mjs) captures the **fully rendered `<head>`**, including any injected `<style>` tags, in `capture/pages/<route>/dom.html`. For Static Mirror Mode using the rendered-DOM approach, these styles come along automatically. For the shell+JS approach, they'll be regenerated correctly at runtime since the original JS is preserved.

For Editable Recreation Mode, treat injected styles the same as any other captured CSS when extracting design tokens (Step 2 of [editable-recreation.md](../modes/editable-recreation.md)) — just source them from the rendered DOM snapshot instead of a `.css` file.

### 5. Fonts loaded via `document.fonts.load()` or `FontFace` API

Some sites load fonts programmatically rather than via `@font-face` in CSS (to control loading priority/FOUT behavior). Check `capture/manifest.json` for `.woff2`/`.woff`/`.ttf`/`.otf` requests even if you don't see a corresponding `@font-face` rule in static CSS — these are likely JS-driven font loads. Capture them the same as any font asset; for recreation, you can set them up via standard `@font-face` rules even if the original used the JS API, unless the specific loading-priority behavior matters to the user.

### 6. A/B testing and personalization scripts

If you see requests to common A/B testing tools (Optimizely, LaunchDarkly, Split, VWO, Google Optimize) or personalization platforms, the captured DOM reflects **one variant** of potentially several. Note this in `discovery.md` — if the user mentions the site "looks different sometimes" or you notice unusually generic copy/placeholder-like content in a section, this may be why. There's no general fix beyond noting it; recreate based on the variant that was captured.

## General principle

When something looks "missing" or "broken" in the capture, the question to ask is: **was this ever requested over the network during capture, and if not, what user action would trigger it?** Answering that tells you whether to (a) extend the capture interaction, (b) manually fetch the asset, or (c) document it as an intentional gap.
