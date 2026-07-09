---
name: video-vision
description: Use Claude's vision to visually inspect rendered Remotion frames and videos for QA
metadata:
  tags: remotion, video, vision, qa, screenshot, review
---

## When to use

Use this skill after making visual changes to a Remotion composition — layout, color, text, animation timing — and before declaring the work done. Code that type-checks and renders without errors can still look wrong. Rendering a frame and actually looking at it catches issues that reading the code cannot: overlapping elements, clipped text, wrong colors, offscreen content, animations that fire at the wrong time.

Skip it for changes with no visual surface (e.g. pure data/logic changes, refactors that don't touch rendering).

## Reviewing a single frame

Render a still and view it directly with the Read tool, which can display images.

```bash
npx remotion still [composition-id] --scale=0.5 --frame=30 out/frame.png
```

Then open `out/frame.png` with the Read tool. Use `--scale` to keep the file small and fast to render; 0.25–0.5 is usually enough to judge layout and color.

Pick `--frame` to land on a moment that matters: the start of an animation, its midpoint, its resting state, or wherever a bug is suspected. `--frame` is zero-based, so at 30 fps `--frame=30` is the one-second mark.

## Reviewing a sequence of frames

For animations, timing bugs, or transitions, a single frame isn't enough — sample several frames across the range you care about and view them in order.

```bash
npx remotion still [composition-id] --scale=0.5 --frame=0 out/frame-000.png
npx remotion still [composition-id] --scale=0.5 --frame=15 out/frame-015.png
npx remotion still [composition-id] --scale=0.5 --frame=30 out/frame-030.png
```

Read each file and compare them in sequence to check that motion, easing, and staggering behave as intended.

For a rendered video file, extract frames with FFmpeg instead of re-rendering stills:

```bash
ffmpeg -i out/video.mp4 -vf "fps=2,scale=640:-1" out/frame-%03d.png
```

Then Read the extracted PNGs. Load [../remotion/rules/ffmpeg.md](../remotion/rules/ffmpeg.md) for more FFmpeg usage.

## What to look for

- Text: fully visible, not clipped or overflowing its container, correct font/weight.
- Layout: elements positioned as intended, nothing overlapping unintentionally, safe margins respected.
- Color: matches the intended palette, sufficient contrast, no unintended transparency.
- Timing: elements appear/disappear/animate at the expected frames, easing looks natural rather than linear or jumpy.
- Assets: images/videos loaded (not broken/blank), correctly cropped or fitted.

## After the review

If something looks wrong, fix the composition code and re-render the same frame(s) to confirm the fix before moving on. Don't rely on the code diff alone to confirm a visual fix — re-render and re-view.
