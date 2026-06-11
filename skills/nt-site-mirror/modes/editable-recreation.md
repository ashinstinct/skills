---
name: editable-recreation-mode
description: Workflow for recreating a live site as clean, component-based, editable source code
metadata:
  tags: recreation, rebuild, rebrand, components, design tokens, react, next
---

# Editable Recreation Mode

Goal: produce **clean, maintainable source code** that reproduces the captured site's look, structure, and behavior closely enough to be useful, while being easy to edit, extend, and rebrand. You are not trying to byte-for-byte match minified output — you're rebuilding from observation using the capture as ground truth for content, layout, styling, and asset references.

## Inputs

- `capture/manifest.json`, `capture/pages/<route>/dom.html`, `capture/assets/**`
- `capture/discovery.md` and the filled-in templates from Phase 1
- The user's stated goals for what should change (rebrand, layout refresh, new sections, etc.)

## Step 1: Choose the stack

Default choices, in order of preference:

1. **If the project already has a stack** (existing `package.json`, framework config) — match it. Don't introduce a second framework.
2. **If the user specified a stack** — use it.
3. **Otherwise**, pick based on what was captured:
   - Multi-route site with many pages and some server logic → **Next.js** (App Router) with TypeScript + Tailwind CSS
   - Single landing page or a handful of static pages → **Vite + React + TypeScript + Tailwind**, or plain **HTML/CSS/JS** if the user wants zero build step
   - Heavy WebGL/3D → React + `@react-three/fiber` (if recreating the 3D scene) or keep the original Three.js bundle embedded as-is (hybrid — see [SKILL.md](../SKILL.md#falling-back-between-modes))

State your choice and reasoning to the user before scaffolding if it's not obvious from context.

## Step 2: Extract design tokens

Before writing components, pull out the site's design system from the captured CSS (`capture/assets/**/*.css`) and rendered DOM:

- **Colors** — collect distinct color values used for backgrounds, text, borders, accents. Map them to named tokens (`--color-primary`, `--color-surface`, etc.). If the site already uses CSS custom properties, reuse those names.
- **Typography** — font families (check `@font-face` and any Google Fonts/Adobe Fonts links in `capture/manifest.json`), font sizes, weights, line-heights used across headings/body/captions.
- **Spacing scale** — look for a consistent spacing rhythm (often a 4px or 8px base) in margins/padding/gaps.
- **Breakpoints** — extract from `@media` queries in captured CSS.
- **Border radii, shadows, transitions/easings** — especially easing curves used in animations (needed for [animation-audit](../templates/animation-audit.md)).

Write these to a tokens file appropriate to the stack (`theme.css`/`tailwind.config.ts`/`tokens.ts`). This file becomes the **single place to apply a rebrand** — swapping a color palette or font later should mostly mean editing this file.

## Step 3: Map sections to components

Walk the rendered DOM (`capture/pages/<route>/dom.html`) for each route and identify repeating/distinct sections: header/nav, hero, feature grids, testimonials, pricing tables, footer, etc. For each:

- Create one component per section (`Header`, `Hero`, `FeatureGrid`, `Footer`, ...)
- Reuse components across routes where the original site does (e.g., shared header/footer)
- Match the original DOM structure closely enough that the captured CSS classes/selectors (or your token-based rewrite of them) apply correctly — but don't preserve meaningless wrapper divs or framework-internal class names (e.g., CSS-modules hashes, `__next`-style ids) that have no styling purpose
- Preserve semantic HTML and accessibility attributes (`alt`, `aria-*`, heading hierarchy, landmark roles) — improve them if the original was poor, since this is a rebuild

## Step 4: Bring over assets

Copy assets referenced by each section from `capture/assets/**` into the new project's asset directory (`public/` for Vite/Next), using clean, descriptive filenames rather than hashed originals where practical (e.g., `hero-background.jpg` instead of `a1b2c3d4.jpg`) — but keep a mapping comment or note in [asset-preservation.md](../templates/asset-preservation.md) so it's traceable back to the source.

- Images: re-export to appropriate formats/sizes only if needed for the framework's image pipeline (e.g., Next/Image); otherwise use as-is.
- Fonts: self-host captured font files (woff2) rather than relying on the original's font CDN, unless the user wants to keep using a font service.
- Video/audio/WebGL: see the relevant module — these are often large and worth confirming with the user before copying everything.

## Step 5: Recreate styling

- Translate captured CSS into the chosen styling approach (Tailwind utility classes, CSS Modules, styled-components, or plain CSS using the tokens from Step 2) — whatever matches the project's existing conventions or the user's preference.
- Match layout precisely: flexbox/grid structure, gaps, alignment, max-widths, and responsive behavior at the breakpoints identified in Step 2.
- Don't copy vendor-prefixed or dead CSS rules from old build tooling unless they're load-bearing.

## Step 6: Recreate animations and interactions

Use [templates/animation-audit.md](../templates/animation-audit.md) from Phase 1. For each animation:

- **CSS-only animations/transitions** (hover states, simple fades, transforms) → recreate directly in CSS using the original timing/easing values.
- **Scroll-triggered animations** (GSAP ScrollTrigger, AOS, Framer Motion `whileInView`, Intersection Observer-based) → recreate using an equivalent in the chosen stack. For React projects, Framer Motion is a good general-purpose default if the project doesn't already use an animation library.
- **Lottie/JSON animations** → keep the original `.json`/`.lottie` file (captured in Phase 1) and render with `lottie-react` or equivalent.
- **Complex/bespoke JS animation systems** → don't try to fully reimplement bespoke physics or canvas-based effects from scratch under time pressure. Recreate the visual outcome as closely as practical, and if it's central to the site's identity, consider the hybrid approach (embed the captured script for that section) and flag it in the report.

Match **timing and easing**, not just the visual end-state — a fade that should take 600ms with an ease-out curve looks noticeably different at a 200ms linear default.

## Step 7: Routing and multi-route sites

See [modules/multi-route.md](../modules/multi-route.md). In recreation mode:
- Map each captured route to a page/route file in the new framework's convention (`app/about/page.tsx`, `src/pages/About.tsx`, etc.)
- Recreate shared layouts (header/footer/nav) once, used across routes
- Recreate dynamic routes (e.g., `/blog/[slug]`) using whatever content source makes sense — if the original content was server-rendered and captured, you can hardcode the captured content as initial data, or set up a simple content collection (markdown/JSON) the user can extend

## Step 8: Apply requested changes (rebrand / redesign)

This is the point where you apply the changes the user actually asked for — it's much easier now than during/after a faithful copy:

- **Rebrand**: update tokens (Step 2) for colors/fonts, swap logo/images, find-and-replace copy. Because styling is token-based, a full palette swap should mostly be a one-file change.
- **Layout refresh**: restructure components/sections per the user's direction, while keeping the asset and content inventory from the capture as your source material.
- **Component-based implementation**: ensure components are props-driven and reusable where the original repeated patterns (e.g., a single `Card` component used for all feature cards, not three near-identical hardcoded blocks).

## Step 9: Build and serve

Use the project's own tooling:

```bash
npm install
npm run dev      # for validation during development
npm run build && npm run preview   # for a production-equivalent check before final validation
```

If the project is plain HTML/CSS/JS with no build step, use [scripts/serve.mjs](../scripts/serve.mjs) directly on the output directory.

## Done criteria for this mode

- Project builds and runs with no errors
- Each captured route has a corresponding page, or its absence is documented and agreed with the user
- Design tokens file exists and a rebrand can be done by editing it (spot-check by changing one token and confirming it propagates)
- Animations/interactions from [animation-audit.md](../templates/animation-audit.md) are reproduced or their gaps documented
- `templates/asset-preservation.md` is filled in completely
- Requested rebrand/redesign changes are applied
