---
name: webgl-3d-module
description: Capturing and preserving WebGL/3D scenes - Three.js, GLTF/GLB, Draco, HDR, KTX2/Basis
metadata:
  tags: webgl, three.js, gltf, glb, draco, hdr, ktx2, basis, 3d
---

# WebGL / 3D module

Load this module when [capture/manifest.json](../scripts/capture.mjs) or the discovery pass shows a `<canvas>` element with a WebGL/WebGL2 context, or any of these file extensions appear in the network log: `.glb`, `.gltf`, `.bin`, `.hdr`, `.exr`, `.ktx2`, `.basis`, `.drc`, `.usdz`, `.fbx`.

## Why this needs special handling

3D assets are almost always **runtime-loaded** — they're fetched by JS after the page loads, often only after a loading screen, an "enter site" interaction, or scroll into view. A naive capture that only looks at the initial HTML/network requests will miss them entirely. [scripts/capture.mjs](../scripts/capture.mjs) handles this by:

- Waiting for network idle, then additionally waiting an extra fixed delay (configurable via `--settle-ms`, default 4000ms) to catch deferred 3D loaders
- Scrolling through the full page height to trigger viewport-based loaders
- Attempting common "enter"/"skip"/"start" interactions if a full-screen overlay is detected (best-effort — verify manually for sites with bespoke intro flows)

If a 3D scene still doesn't load during capture (e.g., it requires a real user gesture like a click on a specific element), note it in `discovery.md` and either:
1. Extend the capture script's interaction step for that specific site (add a `page.click(...)` for the relevant selector), or
2. Manually trigger it in a headed browser and use the browser's network panel to identify the asset URLs, then add them to `capture/manifest.json` manually so [mirror.mjs](../scripts/mirror.mjs) downloads them.

## Asset types and what to do with them

| Extension | What it is | Static Mirror | Editable Recreation |
|---|---|---|---|
| `.glb` | Binary glTF (model + textures + animations in one file) | Download as-is, byte-identical | Download as-is; load via `@react-three/drei`'s `useGLTF` or `GLTFLoader` |
| `.gltf` + `.bin` + textures | glTF JSON + separate binary/texture files | Download all referenced files, preserve relative paths (the `.gltf` references `.bin`/textures by relative path — do not flatten the directory) | Same — keep them together |
| `.drc` / Draco-compressed buffers (often embedded inside `.glb`/`.gltf`, not separate files) | Compressed geometry | Download as-is. Ensure the Draco decoder (`draco_decoder.wasm`/`draco_wasm_wrapper.js`, usually loaded from `/draco/` or a CDN) is also captured and its path preserved | Same; if using `@react-three/drei`, `useGLTF` can load Draco decoders from a CDN by default — for an offline-friendly project, self-host the decoder files and point `useGLTF.setDecoderPath()` at them |
| `.hdr` / `.exr` | HDR environment maps (image-based lighting, reflections) | Download as-is | Download as-is; load via `RGBELoader` (`.hdr`) or `EXRLoader` (`.exr`), or `@react-three/drei`'s `Environment files="..."` |
| `.ktx2` / `.basis` | Compressed GPU textures | Download as-is, preserve alongside the model that references them | Same; requires `KTX2Loader` with the Basis transcoder (`basis_transcoder.wasm`) — capture and preserve that too |
| `.usdz` | USD/AR model (often for iOS Quick Look `<a rel="ar">`) | Download as-is | Download as-is; usually just linked, not re-rendered |
| `.fbx` | Autodesk FBX model | Download as-is | Download as-is; load via `FBXLoader` if needed |

## Detecting the 3D library

Check `capture/pages/<route>/console.log` and the page's script bundle names/comments for hints:

- **Three.js** — most common. Look for `THREE` global, or chunk names containing `three`. Check for higher-level wrappers: `@react-three/fiber` (React), `troika-3d`, or bespoke setups.
- **Babylon.js** — look for `BABYLON` global, `.babylon` scene files (JSON).
- **PlayCanvas** — look for `pc.Application`, `.json` scene/asset manifests under a `playcanvas` path.
- **Spline** (spline.design) — embeds via `@splinetool/runtime` and a `.splinecode` file. These are heavily obfuscated/compiled — for editable recreation, the practical option is usually to **keep the Spline embed as-is** (preserve the `.splinecode` and the runtime script) rather than reimplement the scene. Note this as a hybrid in the report.

## Static Mirror Mode specifics

- All 3D assets are typically fetched via absolute or root-relative URLs from a CDN (e.g., `https://cdn.example.com/models/hero.glb`). [mirror.mjs](../scripts/mirror.mjs) downloads these into `site/_cdn/<host>/<path>` and rewrites the JS-level reference **only if** the URL is a simple string literal/constant (common in bundled "asset manifest" objects). If the URL is constructed dynamically (template strings with computed paths), it's safer to leave the JS untouched and instead set up a local reverse-proxy-style rewrite: serve the downloaded files at a path matching the original CDN host by adding a hosts-file-free option — i.e., serve them under the **same path structure** the JS expects, mounted under `site/_cdn/<host>/...`, and configure [serve.mjs](../scripts/serve.mjs) to also respond on that path prefix. Document whichever approach you used.
- Verify the Three.js `renderer` initializes and the canvas isn't blank in the [validation phase](../templates/validation-report.md) — a blank canvas with no console errors usually means a texture/model 404'd silently.

## Editable Recreation Mode specifics

- If the 3D scene is simple (a few primitives, basic materials, a single model with orbit controls), recreate it in `@react-three/fiber` + `@react-three/drei` for a maintainable result.
- If the scene is complex (custom shaders, post-processing pipelines, particle systems), weigh effort vs. value with the user: full reimplementation can take significant effort. A reasonable default is to **preserve the original bundle for the 3D section** (load the captured JS/assets in an isolated `<iframe>` or a dedicated route) while recreating everything else — flag this hybrid clearly in the report and asset-preservation tracker.
- Custom GLSL shaders: search captured JS for `ShaderMaterial`, `RawShaderMaterial`, or `.glsl`/`.vert`/`.frag` files. If found and the scene is being recreated, carry the shader source over verbatim — shaders are usually small and not worth rewriting.

## Validation checklist additions for 3D content

- Canvas renders (not blank/black) at all three viewports
- Frame rate is reasonable (no obvious jank) — spot-check, don't over-engineer perf testing
- Lighting/reflections look correct (HDR environment loaded)
- Interaction (orbit/drag/scroll-linked camera) works
- No 404s for `.glb`/`.bin`/`.ktx2`/`.hdr`/decoder `.wasm` files in the console
