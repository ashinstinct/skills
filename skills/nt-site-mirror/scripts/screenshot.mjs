#!/usr/bin/env node
// NT Site Mirror — Phase 4: Validate
//
// Screenshots a running site (local or live) at desktop/tablet/mobile
// viewports for a list of routes, for use in the validation report.
//
// Usage:
//   node screenshot.mjs <base-url> --out <dir> [--routes /,/about] [options]
//
// Options:
//   --routes <a,b,c>     Comma-separated route paths (default "/")
//   --settle-ms <n>      Extra wait after network idle (default 1500)
//   --viewports <a,b,c>  Subset of desktop,tablet,mobile (default all three)
//   --report-console     Also dump console errors + failed requests per
//                         route/viewport to <out>/<slug>/console-<viewport>.json

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";

function parseArgs(argv) {
  const args = { _: [], flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args.flags.add(key);
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const baseUrl = args._[0];

if (!baseUrl) {
  console.error("Usage: node screenshot.mjs <base-url> --out <dir> [--routes /,/about]");
  process.exit(1);
}

const outDir = path.resolve(args.out || "./validation");
const routes = (args.routes || "/").split(",").map((r) => r.trim()).filter(Boolean);
const settleMs = parseInt(args["settle-ms"] || "1500", 10);
const reportConsole = args.flags.has("report-console");

const ALL_VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};
const selectedViewportNames = args.viewports
  ? args.viewports.split(",").map((v) => v.trim())
  : Object.keys(ALL_VIEWPORTS);

function routeToSlug(routePath) {
  if (routePath === "/" || routePath === "") return "index";
  return routePath.replace(/^\/+|\/+$/g, "").replace(/\//g, "_") || "index";
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const browser = await chromium.launch();

  for (const name of selectedViewportNames) {
    const viewport = ALL_VIEWPORTS[name];
    if (!viewport) {
      console.warn(`Unknown viewport "${name}", skipping. Valid: ${Object.keys(ALL_VIEWPORTS).join(", ")}`);
      continue;
    }
    const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });

    for (const route of routes) {
      const slug = routeToSlug(route);
      const url = new URL(route, baseUrl).href;
      const page = await context.newPage();

      const consoleEntries = [];
      const failedRequests = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleEntries.push(msg.text());
      });
      page.on("pageerror", (err) => consoleEntries.push(`[pageerror] ${err.message}`));
      page.on("requestfailed", (req) =>
        failedRequests.push({ url: req.url(), error: req.failure()?.errorText || "unknown" })
      );
      page.on("response", (res) => {
        if (res.status() >= 400) failedRequests.push({ url: res.url(), status: res.status() });
      });

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      } catch (err) {
        consoleEntries.push(`[navigation-error] ${err.message}`);
      }
      await page.waitForTimeout(settleMs);

      const screenshotPath = path.join(outDir, name, `${slug}.png`);
      await ensureDir(path.dirname(screenshotPath));
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  ${name.padEnd(8)} ${route.padEnd(20)} -> ${path.relative(outDir, screenshotPath)}`);
      } catch (err) {
        console.warn(`  ${name.padEnd(8)} ${route.padEnd(20)} -> screenshot failed: ${err.message}`);
      }

      if (reportConsole) {
        const reportPath = path.join(outDir, slug, `console-${name}.json`);
        await ensureDir(path.dirname(reportPath));
        await fs.writeFile(reportPath, JSON.stringify({ url, consoleEntries, failedRequests }, null, 2));
      }

      await page.close();
    }
    await context.close();
  }

  await browser.close();
  console.log(`\nDone. Output: ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
