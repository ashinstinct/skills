#!/usr/bin/env node
// NT Site Mirror — Phase 2 (Static Mirror Mode): build site/ from capture/
//
// Reads capture/manifest.json, copies downloaded assets into site/ (mirroring
// the origin's path structure, with cross-origin assets placed under
// site/_cdn/<host>/...), rewrites URL references in HTML/CSS to local paths,
// and writes one index.html per captured route.
//
// Usage:
//   node mirror.mjs <capture-dir> <site-dir> [--use-dom-snapshots]
//
// --use-dom-snapshots forces every route to be built from its rendered DOM
// snapshot instead of the original source HTML. Useful for SPA shells where
// the source HTML is just `<div id="root"></div>`.

import fs from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";

function parseArgs(argv) {
  const args = { _: [], flags: new Set() };
  for (const a of argv) {
    if (a.startsWith("--")) args.flags.add(a.slice(2));
    else args._.push(a);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const captureDir = path.resolve(args._[0] || "./capture");
const siteDir = path.resolve(args._[1] || "./site");
const useDomSnapshots = args.flags.has("use-dom-snapshots");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeFileEnsured(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data);
}

function textLength(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length;
}

// Map every downloaded asset's absolute URL to a root-relative path under
// site/. Same-origin assets keep their original path; cross-origin assets
// (CDNs, font hosts, etc.) go under /_cdn/<host>/...
function buildRewriteMap(manifest, originHost) {
  const map = new Map();
  for (const asset of manifest.assets) {
    if (asset.downloadStatus !== "downloaded" || !asset.localPath) continue;
    const u = new URL(asset.url);
    const parts = asset.localPath.split(path.sep); // ["assets", "<host>", ...rest]
    const rest = parts.slice(2);
    const prefix = u.hostname === originHost ? "" : "/_cdn/" + u.hostname;
    let target;
    if (rest[rest.length - 1] === "index.html") {
      // Map directory-index files to their clean directory URL ("/about"
      // instead of "/about/index.html") so links keep their original,
      // extension-less form. serve.mjs resolves directories to index.html.
      const dirParts = rest.slice(0, -1);
      target = prefix + (dirParts.length ? "/" + dirParts.join("/") : "/");
    } else {
      target = prefix + "/" + rest.join("/");
    }
    map.set(asset.url, target);
  }
  return map;
}

function rewriteUrl(rawUrl, baseUrl, map) {
  if (!rawUrl) return rawUrl;
  const trimmed = rawUrl.trim();
  if (/^(data|blob|mailto|tel|javascript|#):/i.test(trimmed) || trimmed.startsWith("#")) return rawUrl;
  let abs;
  try {
    abs = new URL(trimmed, baseUrl).href;
  } catch {
    return rawUrl;
  }
  return map.get(abs) || rawUrl;
}

function rewriteSrcset(value, baseUrl, map) {
  return value
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return trimmed;
      const spaceIdx = trimmed.search(/\s/);
      const url = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
      const descriptor = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx);
      return rewriteUrl(url, baseUrl, map) + descriptor;
    })
    .join(", ");
}

function rewriteHtml(html, baseUrl, map) {
  html = html.replace(/\b(src|href|poster|data-src)(\s*=\s*)(["'])(.*?)\3/gis, (m, attr, eq, q, val) => {
    return `${attr}${eq}${q}${rewriteUrl(val, baseUrl, map)}${q}`;
  });
  html = html.replace(/\b(srcset|data-srcset)(\s*=\s*)(["'])(.*?)\3/gis, (m, attr, eq, q, val) => {
    return `${attr}${eq}${q}${rewriteSrcset(val, baseUrl, map)}${q}`;
  });
  html = html.replace(/url\((['"]?)(.*?)\1\)/gi, (m, q, val) => {
    if (val.trim().startsWith("#")) return m;
    return `url(${q}${rewriteUrl(val, baseUrl, map)}${q})`;
  });
  return html;
}

function rewriteCss(css, baseUrl, map) {
  return css.replace(/url\((['"]?)(.*?)\1\)/gi, (m, q, val) => {
    if (val.trim().startsWith("#") || val.trim().startsWith("data:")) return m;
    return `url(${q}${rewriteUrl(val, baseUrl, map)}${q})`;
  });
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(captureDir, "manifest.json"), "utf-8"));
  const originHost = new URL(manifest.origin).hostname;
  const map = buildRewriteMap(manifest, originHost);

  await ensureDir(siteDir);

  // 1. Copy/rewrite non-HTML downloaded assets.
  let copied = 0;
  for (const asset of manifest.assets) {
    if (asset.downloadStatus !== "downloaded" || !asset.localPath) continue;
    const ext = path.extname(new URL(asset.url).pathname).toLowerCase();
    if (ext === ".html" || ext === ".htm" || ext === "") continue; // handled via routes below

    const target = map.get(asset.url);
    const srcPath = path.join(captureDir, asset.localPath);
    const destPath = path.join(siteDir, target);

    if (ext === ".css") {
      const css = await fs.readFile(srcPath, "utf-8");
      await writeFileEnsured(destPath, rewriteCss(css, asset.url, map));
    } else {
      await ensureDir(path.dirname(destPath));
      await fs.copyFile(srcPath, destPath);
    }
    copied++;
  }

  // 2. Build one index.html per captured route.
  let routeCount = 0;
  for (const route of manifest.routes) {
    if (route.status !== "captured") continue;

    const routeAsset = manifest.assets.find(
      (a) => a.downloadStatus === "downloaded" && (a.url === route.url || a.url === route.url + "/" || a.url === route.url + "/index.html")
    );

    let html, baseUrl, usedSource;
    if (!useDomSnapshots && routeAsset) {
      const sourceHtml = await fs.readFile(path.join(captureDir, routeAsset.localPath), "utf-8");
      const domPath = path.join(captureDir, route.domSnapshot);
      const domHtml = await fs.readFile(domPath, "utf-8").catch(() => null);
      if (domHtml && textLength(sourceHtml) < textLength(domHtml) * 0.2) {
        // Source HTML looks like an empty SPA shell; use the rendered DOM.
        html = domHtml;
        baseUrl = route.url;
        usedSource = "dom-snapshot (auto: shell detected)";
      } else {
        html = sourceHtml;
        baseUrl = routeAsset.url;
        usedSource = "source-html";
      }
    } else {
      html = await fs.readFile(path.join(captureDir, route.domSnapshot), "utf-8");
      baseUrl = route.url;
      usedSource = "dom-snapshot";
    }

    const rewritten = rewriteHtml(html, baseUrl, map);
    const outPath =
      route.path === "/" ? path.join(siteDir, "index.html") : path.join(siteDir, route.path.replace(/^\//, ""), "index.html");
    await writeFileEnsured(outPath, rewritten);
    console.log(`  ${route.path.padEnd(30)} -> ${path.relative(siteDir, outPath)}  [${usedSource}]`);
    routeCount++;
  }

  console.log(`\nCopied ${copied} asset(s), wrote ${routeCount} route page(s) to ${siteDir}`);

  // 3. Flag things that may need manual attention.
  await reportManualReview(siteDir, originHost);
}

async function reportManualReview(siteDir, originHost) {
  const jsFiles = await walk(siteDir, (f) => f.endsWith(".js") || f.endsWith(".mjs"));
  const swFiles = [];
  const absoluteRefFiles = [];

  for (const file of jsFiles) {
    const content = await fs.readFile(file, "utf-8").catch(() => "");
    if (/serviceWorker\s*\.\s*register/.test(content)) swFiles.push(path.relative(siteDir, file));
    if (content.includes(originHost)) absoluteRefFiles.push(path.relative(siteDir, file));
  }

  if (swFiles.length) {
    console.log(`\n[manual review] Service worker registration found in:`);
    for (const f of swFiles) console.log(`  - ${f}`);
    console.log(`  See modes/static-mirror.md Step 5 — consider neutralizing these.`);
  }
  if (absoluteRefFiles.length) {
    console.log(`\n[manual review] Files referencing "${originHost}" directly (may contain hardcoded API/asset URLs):`);
    for (const f of absoluteRefFiles.slice(0, 20)) console.log(`  - ${f}`);
    if (absoluteRefFiles.length > 20) console.log(`  ...and ${absoluteRefFiles.length - 20} more`);
    console.log(`  See modes/static-mirror.md Step 4 — review whether these need local equivalents.`);
  }
}

async function walk(dir, filter) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, filter)));
    else if (filter(entry.name)) out.push(full);
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
