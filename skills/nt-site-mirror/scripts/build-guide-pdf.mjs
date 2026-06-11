#!/usr/bin/env node
// Renders docs/nt-site-mirror-guide.md to docs/nt-site-mirror-guide.pdf.
//
// Usage:
//   node build-guide-pdf.mjs [markdown-file] [pdf-file]
//
// Defaults to ../docs/nt-site-mirror-guide.md -> ../docs/nt-site-mirror-guide.pdf

import { chromium } from "playwright";
import { marked } from "marked";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.resolve(process.argv[2] || path.join(__dirname, "..", "docs", "nt-site-mirror-guide.md"));
const pdfPath = path.resolve(process.argv[3] || path.join(__dirname, "..", "docs", "nt-site-mirror-guide.pdf"));

const STYLE = `
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1a1a1a; line-height: 1.5; font-size: 11pt; }
  h1 { font-size: 22pt; border-bottom: 2px solid #222; padding-bottom: 6px; margin-top: 0; }
  h1:first-of-type { margin-top: 0; }
  h2 { font-size: 15pt; margin-top: 28px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 12.5pt; margin-top: 18px; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
  code { font-family: "SF Mono", Menlo, Consolas, monospace; background: #f3f3f3; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f6f8fa; padding: 10px 14px; border-radius: 6px; overflow-x: auto; font-size: 9.5pt; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.5pt; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f6f8fa; }
  a { color: #1554c2; text-decoration: none; }
  ul, ol { padding-left: 22px; }
  .titlepage { text-align: center; margin-top: 30%; }
  .titlepage h1 { border: none; font-size: 30pt; }
  .titlepage p { font-size: 13pt; color: #555; }
`;

async function main() {
  const raw = await fs.readFile(mdPath, "utf-8");

  // Pandoc-style title line: "% Title" as the first line.
  let title = "Guide";
  let body = raw;
  const firstLine = raw.split("\n", 1)[0];
  if (firstLine.startsWith("% ")) {
    title = firstLine.slice(2).trim();
    body = raw.slice(firstLine.length).replace(/^\n+/, "");
  }

  const html = marked.parse(body);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
${html}
</body>
</html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "18mm", left: "16mm", right: "16mm" },
  });
  await browser.close();

  console.log(`Wrote ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
