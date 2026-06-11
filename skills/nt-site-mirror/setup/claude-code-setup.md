---
name: claude-code-setup
description: Installing and using the NT Site Mirror skill in Claude Code
metadata:
  tags: setup, claude code, installation
---

# Claude Code setup

NT Site Mirror is a standard Claude Code skill: a folder containing `SKILL.md`, reference docs, templates, and helper scripts. No special configuration is required beyond placing the folder where Claude Code looks for skills and installing the helper scripts' dependencies once.

## 1. Install the skill folder

Place the `nt-site-mirror/` folder in one of Claude Code's skill locations:

- **Project-level** (recommended for a single project): `<project-root>/.claude/skills/nt-site-mirror/`
- **User-level** (available across all your projects): `~/.claude/skills/nt-site-mirror/`

```bash
# From the project root, with this skill folder available locally:
mkdir -p .claude/skills
cp -r /path/to/nt-site-mirror .claude/skills/nt-site-mirror
```

Claude Code discovers `SKILL.md` files automatically — no registration step needed.

## 2. Install helper script dependencies (one-time)

The capture and validation scripts use Playwright:

```bash
cd .claude/skills/nt-site-mirror/scripts
npm install
```

This downloads the `playwright` npm package. If Chromium isn't already available on the system, also run:

```bash
npx playwright install chromium
```

## 3. Invoking the skill

Just describe what you want — Claude Code will recognize the request matches this skill's description and load `SKILL.md`:

> "Use NT Site Mirror to clone https://example.com so I can edit the homepage copy."

> "Recreate https://example.com/pricing as a React component for our app, using our brand colors."

If Claude doesn't pick it up automatically, reference it directly:

> "Follow the nt-site-mirror skill to mirror https://example.com."

## 4. Permissions

This skill needs to:
- Run `node` (for `capture.mjs`, `mirror.mjs`, `serve.mjs`, `screenshot.mjs`) via Bash
- Make outbound network requests to the target site (Playwright browser + `fetch` for sitemap discovery)
- Read/write files under the project's working directory (`nt-mirror/<site-slug>/...`)
- Bind a local port for `serve.mjs` (default `4173`) and any framework dev server

If your Claude Code permission settings prompt for each Bash command, expect prompts for `npm install`, `node capture.mjs ...`, `node mirror.mjs ...`, `node serve.mjs ...`, and `node screenshot.mjs ...`. Approving these is required for the skill to function — they don't touch anything outside the project directory and a local port.

## 5. Working directory conventions

By default, the skill creates `./nt-mirror/<site-slug>/` in the current project for all working files (capture data, the rebuilt site, validation screenshots, and `REPORT.md`). If you're running this inside an existing project and want the rebuilt site integrated directly (e.g., as a new route in an existing Next.js app) rather than in a separate `site/` folder, say so up front — Claude will adjust Phase 2's output location accordingly while keeping `capture/`, `validation/`, and `REPORT.md` at the top level for reference.

## 6. Long-running captures

Large sites (many routes, large media files) can take several minutes to capture. Claude Code will run `capture.mjs` via Bash with a timeout — for big sites, ask Claude to run capture in the background or in batches (`--max-pages` per run, resuming with `--routes` for specific paths) rather than one very long invocation.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `browserType.launch: Executable doesn't exist` | Playwright's bundled Chromium build doesn't match what's installed | Run `npx playwright install chromium`, or pin the `playwright` version in `scripts/package.json` to match an already-installed browser revision |
| `net::ERR_CERT_AUTHORITY_INVALID` during capture | Target uses a self-signed/internal cert, or you're behind a TLS-intercepting proxy | Already handled — `capture.mjs`/`screenshot.mjs` set `ignoreHTTPSErrors: true`. If it persists, check proxy/VPN settings. |
| Capture finds 0 routes beyond the entry URL | Site has no `/sitemap.xml` and uses unusual link markup | Pass explicit routes with `--routes /a,/b,/c` |
| Capture finishes but key visuals are missing/blank | Late-loaded content (WebGL/video/lazy images) didn't finish loading | Increase `--settle-ms`, `--scroll-pause-ms`, `--scroll-passes`; see [../modules/runtime-assets.md](../modules/runtime-assets.md) |
| `EADDRINUSE` from `serve.mjs` | Port already in use | Pass `--port <other-port>` |
