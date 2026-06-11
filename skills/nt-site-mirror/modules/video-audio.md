---
name: video-audio-module
description: Capturing and preserving video and audio - background video, HLS/DASH streams, Web Audio API
metadata:
  tags: video, audio, hls, dash, webm, mp4, web audio api, streaming
---

# Video / Audio module

Load this module when the discovery pass finds `<video>`, `<audio>`, `<source>` elements, CSS `background` referencing video (rare, but some sites fake it with autoplay `<video>` overlays), or Web Audio API usage (`AudioContext`).

## Identifying what you're dealing with

| Pattern | What it means |
|---|---|
| `<video src="...mp4">` or `<source src="...webm">` | Direct file — straightforward to capture |
| `<video>` with no visible controls, `autoplay muted loop playsinline` | Background/decorative video — common in heroes |
| `.m3u8` URL in network log | HLS adaptive stream (multiple quality renditions + segments) |
| `.mpd` URL in network log | DASH adaptive stream |
| Requests to `player.vimeo.com`, `youtube.com/embed`, `fast.wistia.net`, etc. | Third-party video host embed — see below |
| `AudioContext`, `.wav`/`.mp3`/`.ogg` fetched and decoded via `decodeAudioData` | Web Audio API — used for sound effects, audio-reactive visuals |

## Direct file video/audio (mp4, webm, mp3, ogg, wav)

- [scripts/capture.mjs](../scripts/capture.mjs) downloads these like any other asset (they appear in `capture/manifest.json` with their content-type).
- **Static Mirror**: copy as-is, preserve paths, ensure `<video>`/`<audio>` `src`/`<source>` references are rewritten to local paths like any other asset.
- **Editable Recreation**: copy into `public/`, reference with native `<video>`/`<audio>` elements unless the original used a player library (see below).

Watch for **large file sizes** — background hero videos are often tens of MB. Before downloading everything:
- Check `capture/manifest.json` for video file sizes
- If a video is very large (>20MB) and the user is doing a quick rebrand/preview, ask whether they want the full file mirrored or a placeholder/lower-res version — don't silently skip it, but don't blow up the project size without asking either.

## HLS (`.m3u8`) / DASH (`.mpd`) adaptive streams

These are **not single files** — the manifest references multiple quality-level playlists, each referencing many small segment files (`.ts`/`.m4s`/`.mp4` fragments). Faithfully mirroring an entire adaptive stream (all renditions × all segments) is usually overkill for a site mirror.

Recommended approach:
1. In `discovery.md`, note the manifest URL and how many renditions/segments it has.
2. **Static Mirror**: download the manifest and **one** representative quality rendition (pick a middle quality, e.g., 720p) plus its segments. Rewrite the manifest to reference only that rendition. This gives a working, playable video locally without mirroring every quality level. Note in the report that adaptive bitrate switching was simplified to a single rendition.
3. **Editable Recreation**: same approach — or, if the user doesn't need the exact streaming setup, transcode/replace with a single `.mp4`/`.webm` file using whatever tooling is available (`ffmpeg`, if present) for simplicity, and use a native `<video>` tag instead of an HLS.js/Shaka player. Only keep the streaming player setup if adaptive streaming is actually a requirement (e.g., a video-heavy product demo where the user wants to keep that infrastructure).

## Third-party video embeds (YouTube, Vimeo, Wistia)

These load via `<iframe>` from the provider's domain. You generally **cannot and should not mirror the video file itself** (ToS, size, and it's not "the site's" asset).

- **Static Mirror**: leave the `<iframe>` embed as-is, pointing at the original provider URL. It will work locally as long as there's an internet connection. Note it in "External dependencies" in the report.
- **Editable Recreation**: same — keep the embed code. If the user wants a placeholder instead (e.g., for a design-only preview with no network), offer a static poster image (capture the iframe's poster/thumbnail if visible) with a "play" overlay, and note that the embed needs to be wired back in.

## Background video performance pattern

A common pattern: a poster image (`<img>` or CSS background) is shown first, then a `<video>` fades in once it can play (`canplaythrough`). If recreating this in Editable Recreation Mode, preserve both the poster image and this loading sequence — it avoids layout shift and matches the original's perceived performance.

## Web Audio API (sound effects, audio-reactive visuals)

- Identify the audio files being fetched (look for `.wav`/`.mp3`/`.ogg` in the network log that are NOT referenced by `<audio>`/`<video>` tags — these are likely fetched via JS for `decodeAudioData`).
- **Static Mirror**: download these files, preserve paths so `fetch()` calls in the original JS resolve locally.
- **Editable Recreation**: preserve the audio files; recreate the trigger logic (e.g., "play a click sound on button hover") using the Web Audio API or a lightweight library (e.g., `howler.js`) depending on project conventions. Don't over-build a full audio engine if the original use is a couple of one-shot SFX — a simple `new Audio(src).play()` is often sufficient and is a reasonable simplification to note in the report.

## Validation checklist additions for video/audio

- Background/hero videos play automatically (where the original does), are muted if required for autoplay policies, and loop correctly
- Poster images show before video loads (no flash of empty space)
- Audio doesn't autoplay with sound (browsers block this, and it's bad UX) unless the original genuinely does this behind a user gesture
- No 404s for video/audio/manifest/segment files in the console
- For HLS/DASH: video plays smoothly at the chosen rendition; note that quality switching was simplified
