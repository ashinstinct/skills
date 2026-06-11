---
name: asset-preservation-template
description: Tracker for every captured asset and its disposition (preserved, recreated, replaced, dropped)
metadata:
  tags: template, assets, tracking, fidelity
---

# Asset preservation tracker — `<site-slug>`

Every asset in `capture/manifest.json` should end up in exactly one row here. Copy this file to a working copy (e.g., `capture/asset-preservation.md`) and update it as you work through Phase 2. This is the source for the "Blocked/missing assets" and "External dependencies" sections of the final report.

## Status definitions

- **Preserved** — copied byte-for-byte (or functionally identical) into `site/`
- **Recreated** — equivalent reproduced in new code (Editable Recreation Mode), not a copy of the original file
- **Replaced** — intentionally swapped for something else (rebrand: new logo, new copy, new colors) — note what it was replaced with
- **Dropped** — intentionally excluded (e.g., analytics script, unused asset, A/B variant not needed) — note why
- **Blocked** — could not be captured (auth-gated, CORS, 404, rate-limited) — note the original URL so the user can retrieve it manually if needed

## By category

### HTML / pages

| Route | Status | Notes |
|---|---|---|
| `/` | | |

### Stylesheets

| File | Status | Notes |
|---|---|---|
| | | |

### Scripts

| File | Status | Notes |
|---|---|---|
| | | |

### Images

| File | Status | Notes |
|---|---|---|
| | | |

### Fonts

| File | Status | Notes |
|---|---|---|
| | | |

### Video / Audio

| File | Status | Notes |
|---|---|---|
| | | |

### WebGL / 3D

| File | Status | Notes |
|---|---|---|
| | | |

### Other (favicons, manifest.json, robots.txt, etc.)

| File | Status | Notes |
|---|---|---|
| | | |

## Summary

- Total assets in manifest: `<n>`
- Preserved: `<n>` | Recreated: `<n>` | Replaced: `<n>` | Dropped: `<n>` | Blocked: `<n>`
- Total local project size: `<size>` (vs. `<original size>` captured)

## Blocked assets detail

For each `Blocked` row, include enough detail for the user to act:

| Original URL | Why blocked | Suggested manual fix |
|---|---|---|
| | | |
