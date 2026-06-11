---
name: codex-setup
description: Using the NT Site Mirror skill with Codex (CLI/cloud agent)
metadata:
  tags: setup, codex, agents.md, installation
---

# Codex setup

Codex doesn't have a dedicated "skills" directory the way Claude Code does — instead, it reads project context from `AGENTS.md` files and follows whatever instructions/files you point it at. NT Site Mirror works the same way under Codex; you just need to make sure Codex knows the skill exists and reads `SKILL.md` as its entry point.

## 1. Add the skill folder to your repo

Keep the `nt-site-mirror/` folder as-is anywhere in the repo — a conventional location is `skills/nt-site-mirror/` at the repo root (or `.codex/skills/nt-site-mirror/` if you prefer to namespace agent-specific tooling):

```bash
mkdir -p skills
cp -r /path/to/nt-site-mirror skills/nt-site-mirror
```

## 2. Reference it from `AGENTS.md`

Add a section to your repo's `AGENTS.md` (create one at the repo root if it doesn't exist) so Codex picks it up as part of its standard context-gathering:

```markdown
## NT Site Mirror

When asked to mirror, clone, or recreate a website as editable code, follow
the workflow in `skills/nt-site-mirror/SKILL.md`. It defines a five-phase
process (capture, mirror/recreate, serve, validate, report) and links to
helper scripts under `skills/nt-site-mirror/scripts/`.
```

If you work across many repos, you can instead add this to your global Codex instructions file (`~/.codex/AGENTS.md` or equivalent for your Codex setup) so it applies everywhere the skill folder is present.

## 3. Install helper script dependencies (one-time)

Same as any Node project:

```bash
cd skills/nt-site-mirror/scripts
npm install
npx playwright install chromium   # if Chromium isn't already available
```

If your Codex environment uses a setup script / container image step (common for Codex cloud environments), add these two commands there so they run once at environment build time rather than per task.

## 4. Sandbox, network, and approval settings

NT Site Mirror needs:

- **Network egress** to the target site (for Playwright capture/screenshot and `fetch`-based sitemap discovery), and to the npm registry for the one-time `npm install`.
- **Filesystem write access** within the repo/workspace (for `nt-mirror/<site-slug>/...`).
- **Local port binding** for `serve.mjs` (default `4173`) and any framework dev server used in Editable Recreation Mode.

Depending on how your Codex environment is configured (sandbox mode, approval policy, network allowlist), you may need to:

- Run with a sandbox/approval mode that permits shell commands and file writes within the workspace (e.g., a "workspace write" mode rather than read-only).
- Ensure outbound network access is enabled for the session — some Codex cloud environments restrict egress to an allowlist by default. If the target site's domain isn't reachable, capture will fail with connection errors (not the same as the TLS/cert issue below). Add the target domain to your environment's network allowlist, or run capture from a local Codex CLI session with full network access instead.
- Approve `npm install`, `node capture.mjs ...`, `node mirror.mjs ...`, `node serve.mjs ...`, and `node screenshot.mjs ...` if your approval policy prompts per-command.

## 5. Working directory conventions

Same as the general workflow: `nt-mirror/<site-slug>/{capture,site,validation}` plus `REPORT.md` at the project root, unless you ask Codex to integrate the rebuilt site directly into an existing project structure.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `browserType.launch: Executable doesn't exist` | Chromium build mismatch | `npx playwright install chromium`, or pin `playwright` in `scripts/package.json` to match the installed browser revision |
| Capture hangs or times out connecting to the target | Network egress restricted in this Codex environment | Add the target domain to the environment's allowlist, or run capture in a session with broader network access |
| `net::ERR_CERT_AUTHORITY_INVALID` | Self-signed cert / TLS-intercepting proxy | Already handled via `ignoreHTTPSErrors: true` in the capture/screenshot scripts |
| Codex won't run `npm install` / `node` commands | Sandbox/approval policy blocking shell or network | Adjust sandbox mode / approve the specific commands — see section 4 |
