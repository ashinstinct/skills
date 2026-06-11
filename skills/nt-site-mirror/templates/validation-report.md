---
name: validation-report-template
description: Template for the Phase 4 validation pass and the basis for the final REPORT.md
metadata:
  tags: template, validation, screenshots, viewports, qa
---

# Validation report — `<site-slug>`

Run [scripts/screenshot.mjs](../scripts/screenshot.mjs) against both the **live site** (or the captured DOM snapshots) and the **local build**, then fill this in. Copy to `validation/validation-report.md`.

```bash
node scripts/screenshot.mjs <live-url> --out validation/original --routes /,/about
node scripts/screenshot.mjs <local-url> --out validation/local --routes /,/about
```

Default viewports: Desktop 1440×900, Tablet 768×1024, Mobile 390×844.

## Per-route visual comparison

### Route: `/`

| Viewport | Original | Local | Match? | Notes |
|---|---|---|---|---|
| Desktop (1440×900) | `validation/original/desktop/index.png` | `validation/local/desktop/index.png` | `<yes/no>` | |
| Tablet (768×1024) | `validation/original/tablet/index.png` | `validation/local/tablet/index.png` | `<yes/no>` | |
| Mobile (390×844) | `validation/original/mobile/index.png` | `validation/local/mobile/index.png` | `<yes/no>` | |

(Repeat per route. Add a row per route in [discovery.md](discovery.md).)

## Console / network check (local build)

For each route, with browser devtools (or [scripts/screenshot.mjs](../scripts/screenshot.mjs) `--report-console` flag, which dumps console + failed requests to `validation/<route>/console.json`):

| Route | Console errors | Failed requests (404/CORS) | Notes |
|---|---|---|---|
| `/` | | | |

## Interaction / behavior spot-check

Based on [animation-audit.md](animation-audit.md) and the module checklists used:

- [ ] Scroll-triggered animations fire correctly
- [ ] Hover/focus states match
- [ ] Video/audio plays as expected (if applicable — see [modules/video-audio.md](../modules/video-audio.md))
- [ ] WebGL/3D scenes render and respond to interaction (if applicable — see [modules/webgl-3d.md](../modules/webgl-3d.md))
- [ ] Internal navigation between routes works
- [ ] Forms render correctly (submission behavior may be intentionally non-functional — note this)
- [ ] Responsive layout doesn't break at intermediate widths (spot-check 1024px, 600px in addition to the three standard viewports if layout looks fragile)

## Discrepancies found and resolved

| Issue | Root cause | Fix applied |
|---|---|---|
| | | |

## Discrepancies remaining (to include in final report)

| Issue | Why not fixed | Recommendation for user |
|---|---|---|
| | | |

## Sign-off

- [ ] All routes from [discovery.md](discovery.md) load without fatal errors
- [ ] All three viewports checked for each route
- [ ] `asset-preservation.md` is complete
- [ ] Remaining discrepancies are documented, not silently left in
