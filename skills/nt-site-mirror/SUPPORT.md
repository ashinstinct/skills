# Support

NT Site Mirror is a self-contained skill: plain-text instructions (`SKILL.md`, `modes/`, `modules/`, `templates/`) plus a handful of small Node.js scripts (`scripts/`). There's no external service, license, or account involved — everything runs locally using Playwright/Chromium.

## First steps when something doesn't work

1. **Check the troubleshooting tables** in [setup/claude-code-setup.md](setup/claude-code-setup.md), [setup/codex-setup.md](setup/codex-setup.md), or [docs/nt-site-mirror-guide.md](docs/nt-site-mirror-guide.md) — most issues (Chromium version mismatches, TLS errors, missing routes, late-loading content) are covered there.
2. **Check `capture/manifest.json` and `capture/pages/<route>/console.log`** — these record exactly what was requested, downloaded, blocked, or errored during capture, and are the first place to look when an asset or route is missing.
3. **Re-read the relevant module** if the site uses WebGL/3D, video/audio, heavy lazy-loading, or is a multi-route Next.js/Nuxt app — these have known failure modes and documented fixes in [modules/](modules/).

## Extending the scripts for a specific site

The helper scripts are intentionally short (a few hundred lines each) and commented at each step so they're easy to adapt:

- **Site needs a click to dismiss an intro/loading screen before content appears** (common for WebGL/3D sites): add a targeted `page.click(...)` for that site's selector in [scripts/capture.mjs](scripts/capture.mjs), near the existing cookie-banner-dismissal logic.
- **Site needs more time for lazy content**: increase `--settle-ms`, `--scroll-pause-ms`, or `--scroll-passes` — no code changes needed, see [SKILL.md](SKILL.md#phase-1--capture).
- **Mirror needs a different asset/path mapping**: the rewrite logic lives in `buildRewriteMap` and `rewriteUrl`/`rewriteHtml`/`rewriteCss` in [scripts/mirror.mjs](scripts/mirror.mjs).
- **Need a different viewport set for validation**: edit `ALL_VIEWPORTS` in [scripts/screenshot.mjs](scripts/screenshot.mjs) or pass `--viewports`.

## Reporting issues / requesting changes

If you're using this skill from within this repository, open an issue or pull request against this repo describing:
- The target site (or a minimal reproduction if the site is private)
- The command you ran and its full output
- The relevant section of `capture/manifest.json` or `capture/discovery.md`

## Getting help with Claude Code or Codex themselves

Issues with the *agent* (permissions, skill discovery, sandboxing, network access) rather than this skill's logic are best resolved via your Claude Code or Codex documentation/support channels — see the "Permissions" / "Sandbox" sections in [setup/claude-code-setup.md](setup/claude-code-setup.md) and [setup/codex-setup.md](setup/codex-setup.md).
