# NT Site Mirror

A Claude Code / Codex skill for turning any live website into editable code — a fast, faithful **static mirror** for preservation/rebrands, or a clean, component-based **recreation** for deeper edits and redesigns.

Paste a URL, and the skill runs a structured five-phase workflow — **Capture → Mirror or Recreate → Serve → Validate → Report** — instead of guessing at layout, hunting for assets, or missing animations, video, audio, and WebGL/3D content.

## Start here

- **[SKILL.md](SKILL.md)** — the entry point. Defines the workflow, the two modes, and links to everything below. This is what Claude/Codex reads first.
- **[docs/nt-site-mirror-guide.md](docs/nt-site-mirror-guide.md)** ([PDF](docs/nt-site-mirror-guide.pdf)) — a condensed setup-and-workflow guide, good for a quick read or printing.

## What's included

| Path | What it's for |
|---|---|
| `SKILL.md` | Orchestrator: five-phase workflow, mode selection, guiding principles |
| `modes/static-mirror.md` | Static Mirror Mode — faithful local copy of the deployed site |
| `modes/editable-recreation.md` | Editable Recreation Mode — clean, component-based rebuild |
| `modules/webgl-3d.md` | Three.js/WebGL, GLTF/GLB, Draco, HDR, KTX2/Basis |
| `modules/video-audio.md` | Video/audio, HLS/DASH, third-party embeds, Web Audio |
| `modules/runtime-assets.md` | Lazy-loaded, scroll-triggered, code-split, runtime-injected content |
| `modules/multi-route.md` | Route discovery, Next.js/Nuxt specifics, shared layouts |
| `templates/discovery.md` | Phase 1 findings — routes, assets, animations, dependencies |
| `templates/animation-audit.md` | Catalog of animations/interactions to preserve or recreate |
| `templates/asset-preservation.md` | Per-asset disposition tracker (preserved/recreated/replaced/dropped/blocked) |
| `templates/validation-report.md` | Cross-viewport visual + console QA pass |
| `scripts/capture.mjs` | Phase 1 — Playwright crawler + asset downloader |
| `scripts/mirror.mjs` | Phase 2 — builds `site/` from a capture (Static Mirror Mode) |
| `scripts/serve.mjs` | Phase 3 — local static server (SPA fallback, correct MIME types) |
| `scripts/screenshot.mjs` | Phase 4 — desktop/tablet/mobile screenshots + console reports |
| `scripts/build-guide-pdf.mjs` | Regenerates `docs/nt-site-mirror-guide.pdf` from the markdown source |
| `setup/claude-code-setup.md` | Installing and running this skill in Claude Code |
| `setup/codex-setup.md` | Using this skill with Codex (`AGENTS.md`-based) |
| `SUPPORT.md` | Troubleshooting, extending the scripts, getting help |

## Quick start

```bash
cd nt-site-mirror/scripts
npm install
npx playwright install chromium   # if Chromium isn't already available

node capture.mjs https://example.com --out ../../nt-mirror/example/capture --max-pages 20
node mirror.mjs ../../nt-mirror/example/capture ../../nt-mirror/example/site
node serve.mjs ../../nt-mirror/example/site --port 4173
node screenshot.mjs http://localhost:4173 --out ../../nt-mirror/example/validation --routes /
```

Then fill in `capture/discovery.md`, `templates/asset-preservation.md`, and `templates/validation-report.md`, and write `REPORT.md` — see [SKILL.md](SKILL.md) for what each phase expects.

For Editable Recreation Mode, Phase 2 doesn't use `mirror.mjs` — follow [modes/editable-recreation.md](modes/editable-recreation.md) instead, using the same `capture/` output as your source material.

## Setup

- [setup/claude-code-setup.md](setup/claude-code-setup.md)
- [setup/codex-setup.md](setup/codex-setup.md)
