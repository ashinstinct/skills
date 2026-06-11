---
name: animation-audit-template
description: Template for cataloging animations and interactions found during discovery, for accurate reproduction
metadata:
  tags: template, animation, audit, motion
---

# Animation audit — `<site-slug>`

Fill in one row per distinct animation/interaction pattern. "Distinct" means a reusable pattern — if ten cards all fade in the same way on scroll, that's one row, not ten. Copy this file to `capture/animation-audit.md`.

| # | Element / section | Trigger | Effect | Timing | Easing | Library/mechanism | Mirror or recreate? |
|---|---|---|---|---|---|---|---|
| 1 | Hero heading | Page load | Fade in + slide up 20px | 600ms, 100ms stagger per word | `cubic-bezier(0.16,1,0.3,1)` | Framer Motion (`whileInView`-equivalent on mount) | Recreate w/ Framer Motion `motion.span` |
| 2 | Feature cards (×6) | Scroll into view (IntersectionObserver) | Fade in + scale from 0.95 | 400ms | ease-out | AOS (`data-aos="fade-up"`) | Mirror (AOS preserved) |
| 3 | Nav bar | Scroll position > 80px | Background color + shadow transition | 200ms | ease | Custom JS scroll listener + CSS class toggle | Recreate (simple scroll listener) |
| ... | | | | | | | |

## Column guidance

- **Trigger**: `page load`, `scroll into view`, `hover`, `click`, `scroll position`, `route change`, `continuous/looping`
- **Effect**: plain description — opacity, transform (translate/scale/rotate), color, clip-path, filter, etc. Note initial and final states.
- **Timing**: duration + any stagger/delay between elements
- **Easing**: exact cubic-bezier or named easing if you can extract it from CSS/JS; otherwise your best visual match
- **Library/mechanism**: what's actually driving it — be specific (GSAP timeline, ScrollTrigger pin, CSS `@keyframes` + `animation-timeline: scroll()`, Framer Motion variant, Lottie file `X.json`, raw `IntersectionObserver` + class toggle, etc.)
- **Mirror or recreate?**: for Static Mirror Mode this is almost always "mirror" (the original JS handles it). For Editable Recreation Mode, decide per-row whether to recreate with an equivalent or, for very bespoke effects, keep a captured fragment as a hybrid (note which fragment).

## Page transitions / route changes

- Does navigating between routes trigger a transition (fade, slide, shared-element/morph)? `<describe, or "none — full page reload">`
- Mechanism: `<e.g., Next.js + Framer Motion AnimatePresence, View Transitions API, custom>`

## Cursor / pointer effects

- Custom cursor? `<describe, or "none">`
- Magnetic buttons / hover-follow effects? `<describe, or "none">`

## Looping / ambient animations

- Anything that animates continuously without user interaction (marquees, floating shapes, gradient shifts, particle fields)? `<list with timing/library>`

## Reduced-motion considerations

- Does the original site respect `prefers-reduced-motion`? `<yes/no/unknown>` — if recreating, carry this over; it's a quick accessibility win.
