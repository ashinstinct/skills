---
name: higgsfield
description: Higgsfield AI - video and image generation platform
metadata:
  tags: higgsfield, ai, video, image, generation
---

## When to use

Use this skill whenever the user wants to generate videos or images with Higgsfield, check their account, manage workspaces, or work with Higgsfield's AI generation models.

## Authentication

Two auth paths are supported:

- **CLI**: install the `higgsfield` CLI, then run `higgsfield auth login` (opens browser). Check with `higgsfield account status`.
- **MCP server**: authentication is automatic. Verify with `mcp: balance` → returns `email`, `credits`, `subscription_plan_type`.

See [rules/auth-login.md](rules/auth-login.md) for full details on both paths.

## Workspaces

Users can have a private workspace and shared/team workspaces. All generation operations target the currently selected workspace.

- List workspaces: `mcp: list_workspaces`
- Switch workspace: `mcp: select_workspace` with `workspace_id`
- Reset to private workspace: `mcp: select_workspace` with `clear: true`

## Generating videos

Use `generate_video`. Default models:
- `marketing_studio_video` for commercial/product/ads content
- `seedance_2_0` for reference-driven video with strong identity
- `kling3_0` for multi-shot, audio, or motion transfer

Call `models_explore` to discover available models and their constraints before generating.

## Generating images

Use `generate_image`. Call `models_explore` with `type: "image"` to find available models.

## Uploading media

To use local files as generation inputs:
1. `media_upload` — get a presigned upload URL
2. PUT the file bytes to the `upload_url`
3. `media_confirm` — confirm the upload and get a `media_id`
4. Pass `media_id` in `medias[].value` on the generation call

## Soul Characters (reusable identity)

Train a reusable character from 5–20 reference images with `show_characters` (`action: "train"`). Once ready, use the returned `soul_id` with `generate_image` (`model: "soul_2"`).

## Browsing history

Use `show_generations` to browse past completed generations. Do not use it as a polling step after a generation — use `job_display` to re-display specific results by ID.

## Credits and transactions

- Current balance: `balance`
- Transaction history: `transactions`
