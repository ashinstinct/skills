#!/usr/bin/env node
// NT Site Mirror — Phase 1: Capture
//
// Crawls a live site with a real browser (Playwright/Chromium), downloads every
// reachable asset, captures rendered DOM snapshots, console logs, and
// framework state (Next.js __NEXT_DATA__ / Nuxt __NUXT__), and writes
// capture/manifest.json + a pre-filled capture/discovery.md stub.
//
// Usage:
//   node capture.mjs <url> --out <dir> [options]
//
// Options:
//   --max-pages <n>        Max number of routes to crawl (default 20)
//   --settle-ms <n>        Extra wait after network idle, for late-loading
//                          content like WebGL/3D scenes (default 4000)
//   --scroll-pause-ms <n>  Pause between scroll steps (default 400)
//   --scroll-passes <n>    Number of full-page scroll passes (default 1)
//   --max-asset-mb <n>     Skip downloading individual assets larger than
//                          this (default 50)
//   --nav-timeout-ms <n>   Per-page navigation timeout (default 45000)
//   --routes <a,b,c>       Comma-separated extra route paths to seed the
//                          crawl with (in addition to sitemap + entry URL)

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const entryUrl = args._[0];

if (!entryUrl) {
  console.error("Usage: node capture.mjs <url> --out <dir> [options]");
  process.exit(1);
}

const outDir = path.resolve(args.out || "./capture");
const maxPages = parseInt(args["max-pages"] || "20", 10);
const settleMs = parseInt(args["settle-ms"] || "4000", 10);
const scrollPauseMs = parseInt(args["scroll-pause-ms"] || "400", 10);
const scrollPasses = parseInt(args["scroll-passes"] || "1", 10);
const maxAssetBytes = parseInt(args["max-asset-mb"] || "50", 10) * 1024 * 1024;
const navTimeoutMs = parseInt(args["nav-timeout-ms"] || "45000", 10);
const seedRoutes = (args.routes || "")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

const entry = new URL(entryUrl);
const origin = entry.origin;

// Paths under which we don't follow links to discover new *pages* (still
// happy to download them as assets if referenced directly).
const NON_PAGE_PATH_PATTERNS = [
  /^\/wp-admin/i,
  /^\/wp-login/i,
  /^\/cart/i,
  /^\/checkout/i,
  /^\/account/i,
  /^\/api\//i,
  /^\/_next\/(?!data)/i,
  /^\/admin/i,
  /^\/login/i,
  /^\/logout/i,
  /^\/search/i,
];

const ASSET_EXTENSIONS = new Set([
  "css", "js", "mjs", "json",
  "png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico", "bmp",
  "woff", "woff2", "ttf", "otf", "eot",
  "mp4", "webm", "mov", "m4v", "ogv",
  "mp3", "wav", "ogg", "m4a", "flac",
  "glb", "gltf", "bin", "hdr", "exr", "ktx2", "basis", "drc", "usdz", "fbx",
  "pdf", "zip", "txt", "xml", "webmanifest",
]);

function looksLikePage(pathname) {
  if (NON_PAGE_PATH_PATTERNS.some((re) => re.test(pathname))) return false;
  const ext = path.extname(pathname).slice(1).toLowerCase();
  if (!ext) return true; // no extension -> likely a route
  return ext === "html" || ext === "htm";
}

function isLikelyAsset(pathname) {
  const ext = path.extname(pathname).slice(1).toLowerCase();
  return ASSET_EXTENSIONS.has(ext);
}

// Map an absolute asset URL to a path under capture/assets/, mirroring the
// remote host + path so directory structure (and relative references inside
// CSS/JS) stays intact.
function urlToLocalPath(urlStr) {
  const u = new URL(urlStr);
  let pathname = decodeURIComponent(u.pathname);
  if (pathname === "" || pathname === "/") {
    pathname = "/index.html";
  } else if (pathname.endsWith("/")) {
    pathname += "index.html";
  } else if (!path.extname(pathname)) {
    pathname += "/index.html";
  }
  // Strip leading slash, sanitize path segments.
  const segments = pathname.split("/").filter(Boolean).map((s) =>
    s.replace(/[^a-zA-Z0-9._\-]/g, "_")
  );
  return path.join("assets", u.hostname, ...segments);
}

function routeToSlug(routePath) {
  if (routePath === "/" || routePath === "") return "index";
  return routePath.replace(/^\/+|\/+$/g, "") || "index";
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeFileEnsured(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data);
}

// ---- Sitemap discovery ----
async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function discoverFromSitemap(originUrl) {
  const routes = new Set();
  const candidates = [`${originUrl}/sitemap.xml`, `${originUrl}/sitemap_index.xml`];
  for (const candidate of candidates) {
    const xml = await fetchText(candidate);
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    for (const loc of locs) {
      try {
        const u = new URL(loc);
        if (u.origin !== originUrl) continue;
        if (/sitemap.*\.xml$/i.test(u.pathname)) {
          // One level of sitemap-index recursion.
          const subXml = await fetchText(u.href);
          if (subXml) {
            const subLocs = [...subXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
            for (const subLoc of subLocs) {
              try {
                const su = new URL(subLoc);
                if (su.origin === originUrl) routes.add(su.pathname);
              } catch {}
            }
          }
          continue;
        }
        routes.add(u.pathname);
      } catch {}
    }
  }
  return [...routes];
}

// ---- Main ----
async function main() {
  await ensureDir(outDir);
  await ensureDir(path.join(outDir, "assets"));
  await ensureDir(path.join(outDir, "pages"));

  const manifest = {
    source: entry.href,
    origin,
    capturedAt: new Date().toISOString(),
    routes: [],
    assets: [],
  };

  const assetByUrl = new Map(); // url -> manifest asset entry
  const visitedRoutes = new Set();
  const queuedRoutes = new Set();
  const queue = [];

  function enqueueRoute(routePath, source) {
    let normalized = routePath.split("#")[0].split("?")[0];
    if (!normalized.startsWith("/")) normalized = "/" + normalized;
    if (normalized.length > 1 && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    if (visitedRoutes.has(normalized) || queuedRoutes.has(normalized)) return;
    if (!looksLikePage(normalized)) return;
    queuedRoutes.add(normalized);
    queue.push({ path: normalized, source });
  }

  // Seed: entry URL, sitemap, explicit --routes
  enqueueRoute(entry.pathname || "/", "entry");
  for (const r of await discoverFromSitemap(origin)) enqueueRoute(r, "sitemap");
  for (const r of seedRoutes) enqueueRoute(r, "cli");

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) NTSiteMirror/1.0 Chrome/124 Safari/537.36",
    // Tolerate self-signed/staging certs - fidelity of capture matters more
    // here than strict TLS validation.
    ignoreHTTPSErrors: true,
  });

  // Download every response we see, regardless of which page triggered it.
  context.on("response", async (response) => {
    try {
      const reqUrl = response.url();
      if (assetByUrl.has(reqUrl)) return;
      const u = new URL(reqUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      const status = response.status();
      const contentType = response.headers()["content-type"] || "";
      const entryRecord = {
        url: reqUrl,
        contentType,
        status,
        localPath: null,
        size: 0,
        downloadStatus: "pending",
      };
      assetByUrl.set(reqUrl, entryRecord);

      if (status >= 300 && status < 400) {
        entryRecord.downloadStatus = "redirect";
        return;
      }
      if (status >= 400) {
        entryRecord.downloadStatus = "failed-" + status;
        return;
      }

      let body;
      try {
        body = await response.body();
      } catch {
        entryRecord.downloadStatus = "unreadable";
        return;
      }

      entryRecord.size = body.length;
      if (body.length > maxAssetBytes) {
        entryRecord.downloadStatus = "skipped-too-large";
        return;
      }

      const localPath = urlToLocalPath(reqUrl);
      await writeFileEnsured(path.join(outDir, localPath), body);
      entryRecord.localPath = localPath;
      entryRecord.downloadStatus = "downloaded";
    } catch (err) {
      // Best-effort; never let an asset failure crash the crawl.
    }
  });

  let pagesProcessed = 0;

  while (queue.length > 0 && pagesProcessed < maxPages) {
    const { path: routePath, source } = queue.shift();
    if (visitedRoutes.has(routePath)) continue;
    visitedRoutes.add(routePath);

    const pageUrl = origin + routePath;
    const slug = routeToSlug(routePath);
    const routeRecord = {
      path: routePath,
      url: pageUrl,
      source,
      status: "pending",
      domSnapshot: `pages/${slug}/dom.html`,
      consoleLog: `pages/${slug}/console.log`,
      frameworkState: null,
    };
    manifest.routes.push(routeRecord);

    const page = await context.newPage();
    const consoleLines = [];
    page.on("console", (msg) => consoleLines.push(`[console.${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`));
    page.on("requestfailed", (req) =>
      consoleLines.push(`[requestfailed] ${req.url()} - ${req.failure()?.errorText || "unknown"}`)
    );

    try {
      await page.goto(pageUrl, { waitUntil: "networkidle", timeout: navTimeoutMs });
    } catch (err) {
      consoleLines.push(`[navigation-error] ${err.message}`);
      routeRecord.status = "failed";
      await writeFileEnsured(path.join(outDir, routeRecord.consoleLog), consoleLines.join("\n"));
      await page.close();
      pagesProcessed++;
      continue;
    }

    // Best-effort: dismiss common cookie-consent banners so they don't
    // obscure content in screenshots / DOM snapshots.
    for (const text of ["Accept all", "Accept All", "I agree", "Accept cookies", "Allow all"]) {
      try {
        const btn = page.getByRole("button", { name: text, exact: false });
        if (await btn.first().isVisible({ timeout: 500 })) {
          await btn.first().click({ timeout: 1000 });
          break;
        }
      } catch {}
    }

    // Scroll to trigger lazy-loaded / scroll-triggered content.
    for (let pass = 0; pass < scrollPasses; pass++) {
      try {
        const height = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = page.viewportSize()?.height || 900;
        for (let y = 0; y < height; y += viewportHeight) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(scrollPauseMs);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
      } catch {}
    }

    // Extra settle time for late-loading content (WebGL/3D, video, etc.).
    await page.waitForTimeout(settleMs);

    // Capture rendered DOM.
    const dom = await page.content();
    await writeFileEnsured(path.join(outDir, routeRecord.domSnapshot), dom);

    // Capture framework state (Next.js / Nuxt) for use as a content source
    // during Editable Recreation.
    try {
      const frameworkState = await page.evaluate(() => {
        const out = {};
        const nextEl = document.getElementById("__NEXT_DATA__");
        if (nextEl) {
          try {
            out.next = JSON.parse(nextEl.textContent);
          } catch {}
        }
        const nuxtEl = document.getElementById("__NUXT_DATA__");
        if (nuxtEl) {
          out.nuxtRaw = nuxtEl.textContent;
        }
        if (typeof window.__NUXT__ !== "undefined") {
          try {
            out.nuxt = JSON.parse(JSON.stringify(window.__NUXT__));
          } catch {}
        }
        return Object.keys(out).length ? out : null;
      });
      if (frameworkState) {
        routeRecord.frameworkState = `pages/${slug}/framework-state.json`;
        await writeFileEnsured(
          path.join(outDir, routeRecord.frameworkState),
          JSON.stringify(frameworkState, null, 2)
        );

        // Best-effort: fetch _next/data payload for this route using the
        // detected buildId (used for client-side soft navigation).
        const buildId = frameworkState.next?.buildId;
        if (buildId) {
          const dataPath = routePath === "/" ? "/index" : routePath;
          const dataUrl = `${origin}/_next/data/${buildId}${dataPath}.json`;
          try {
            const res = await context.request.get(dataUrl);
            if (res.ok()) {
              const body = await res.body();
              const localPath = urlToLocalPath(dataUrl);
              await writeFileEnsured(path.join(outDir, localPath), body);
              assetByUrl.set(dataUrl, {
                url: dataUrl,
                contentType: "application/json",
                status: res.status(),
                localPath,
                size: body.length,
                downloadStatus: "downloaded",
              });
            }
          } catch {}
        }
      }
    } catch {}

    // Extract same-origin links for further crawling.
    try {
      const hrefs = await page.$$eval("a[href]", (els) => els.map((e) => e.getAttribute("href")));
      for (const href of hrefs) {
        if (!href) continue;
        try {
          const resolved = new URL(href, pageUrl);
          if (resolved.origin !== origin) continue;
          if (isLikelyAsset(resolved.pathname)) continue;
          enqueueRoute(resolved.pathname, "link");
        } catch {}
      }
    } catch {}

    await writeFileEnsured(path.join(outDir, routeRecord.consoleLog), consoleLines.join("\n"));
    routeRecord.status = "captured";
    pagesProcessed++;
    await page.close();
  }

  // Mark routes that were discovered but not crawled (hit --max-pages).
  for (const { path: routePath, source } of queue) {
    manifest.routes.push({
      path: routePath,
      url: origin + routePath,
      source,
      status: "skipped-max-pages",
      domSnapshot: null,
      consoleLog: null,
      frameworkState: null,
    });
  }

  manifest.assets = [...assetByUrl.values()];

  await browser.close();

  await writeFileEnsured(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFileEnsured(path.join(outDir, "discovery.md"), renderDiscoveryStub(manifest));

  // Console summary.
  const captured = manifest.routes.filter((r) => r.status === "captured").length;
  const downloaded = manifest.assets.filter((a) => a.downloadStatus === "downloaded").length;
  const blocked = manifest.assets.filter(
    (a) => a.downloadStatus?.startsWith("failed") || a.downloadStatus === "skipped-too-large"
  ).length;
  console.log(`Captured ${captured}/${manifest.routes.length} route(s).`);
  console.log(`Downloaded ${downloaded} asset(s); ${blocked} blocked/skipped.`);
  console.log(`Output: ${outDir}`);
  console.log(`Next: fill in ${path.join(outDir, "discovery.md")}`);
}

function byteSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function renderDiscoveryStub(manifest) {
  const routesTable = manifest.routes
    .map((r) => `| \`${r.path}\` | ${r.source} | ${r.status === "captured" ? "yes" : "no (" + r.status + ")"} | |`)
    .join("\n");

  const byType = {};
  for (const a of manifest.assets) {
    if (a.downloadStatus !== "downloaded") continue;
    const ext = path.extname(new URL(a.url).pathname).slice(1).toLowerCase() || "(none)";
    const bucket = bucketForExt(ext);
    byType[bucket] = byType[bucket] || { count: 0, size: 0 };
    byType[bucket].count++;
    byType[bucket].size += a.size;
  }
  const inventoryRows = Object.entries(byType)
    .map(([type, { count, size }]) => `| ${type} | ${count} | ${byteSize(size)} | |`)
    .join("\n");

  const blockedRows = manifest.assets
    .filter((a) => a.downloadStatus?.startsWith("failed") || a.downloadStatus === "skipped-too-large")
    .map((a) => `| ${a.url} | ${a.downloadStatus} | |`)
    .join("\n");

  return `# Discovery notes — ${manifest.origin}

> Auto-generated by capture.mjs on ${manifest.capturedAt}. Fill in the
> qualitative sections below — see ../templates/discovery.md for the full
> guidance template.

## Site overview

- **Source URL**: ${manifest.source}
- **Capture date**: ${manifest.capturedAt}
- **Stack detected**: \`<fill in — check pages/*/framework-state.json>\`
- **Mode chosen**: \`<Static Mirror | Editable Recreation>\` — reasoning: \`<...>\`

## Routes

| Route | Source | Captured? | Notes |
|---|---|---|---|
${routesTable}

## Asset inventory (downloaded)

| Type | Count | Total size | Notes |
|---|---|---|---|
${inventoryRows || "| (none) | | | |"}

## Blocked / skipped assets

| URL | Status | Notes |
|---|---|---|
${blockedRows || "| (none) | | |"}

## Animation systems detected

\`<fill in — see ../templates/animation-audit.md>\`

## WebGL / 3D content

\`<fill in — see ../modules/webgl-3d.md>\`

## Video / audio

\`<fill in — see ../modules/video-audio.md>\`

## Runtime / late-loaded assets

\`<fill in — see ../modules/runtime-assets.md>\`

## External dependencies

\`<fill in>\`

## Console errors / warnings during capture

\`<check pages/*/console.log>\`

## Open questions for the user

\`<fill in>\`
`;
}

function bucketForExt(ext) {
  const map = {
    html: "HTML", htm: "HTML",
    css: "CSS",
    js: "JS", mjs: "JS", json: "JSON",
    png: "Images", jpg: "Images", jpeg: "Images", gif: "Images", webp: "Images", avif: "Images", ico: "Images",
    svg: "Images (vector)",
    woff: "Fonts", woff2: "Fonts", ttf: "Fonts", otf: "Fonts", eot: "Fonts",
    mp4: "Video", webm: "Video", mov: "Video", m4v: "Video", ogv: "Video",
    mp3: "Audio", wav: "Audio", ogg: "Audio", m4a: "Audio", flac: "Audio",
    glb: "3D/WebGL", gltf: "3D/WebGL", bin: "3D/WebGL", hdr: "3D/WebGL", exr: "3D/WebGL",
    ktx2: "3D/WebGL", basis: "3D/WebGL", drc: "3D/WebGL", usdz: "3D/WebGL", fbx: "3D/WebGL",
  };
  return map[ext] || "Other";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
