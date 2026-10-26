/**
 * Builds static preview pages for Japão SP / Rio (approval before CMS SQL).
 * Run: node scripts/build-japao-preview.mjs
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderExperienceDetailPage } from "../data/experience-render.js";
import {
  JAPAO_PREVIEW_CATEGORY,
  JAPAO_RIO_PREVIEW,
  JAPAO_SP_PREVIEW,
} from "../data/japao-preview-fixtures.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "preview");
const WA = "5521999999999";
mkdirSync(OUT_DIR, { recursive: true });
// Self-contained under /preview so Vercel static files work (SPA rewrite skips assets/api/preview).
copyFileSync(join(ROOT, "index.css"), join(OUT_DIR, "japao-preview.css"));

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function wrapPage(pkg, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>${esc(pkg.seoTitle || pkg.name)} (prévia)</title>
  <meta name="description" content="${esc(pkg.seoDescription || pkg.shortDescription)}">
  <link rel="stylesheet" href="/preview/japao-preview.css">
  <style>
    .preview-banner {
      position: sticky; top: 0; z-index: 100;
      background: #16170F; color: #F6F1E8;
      font: 600 0.85rem/1.4 system-ui, sans-serif;
      text-align: center; padding: 0.65rem 1rem;
    }
    .preview-banner a { color: #F6F1E8; text-underline-offset: 2px; }
    body { margin: 0; background: #F6F1E8; }
    /* Preview has no reveal JS: force content visible for approval screenshots. */
    [data-reveal] { opacity: 1 !important; transform: none !important; }
  </style>
</head>
<body>
  <div class="preview-banner">
    Prévia para aprovação · não é produção ·
    <a href="/preview/japao-essencial-sao-paulo.html">São Paulo</a>
    ·
    <a href="/preview/japao-essencial-rio.html">Rio</a>
  </div>
  <main id="app">${bodyHtml}</main>
</body>
</html>
`;
}

for (const pkg of [JAPAO_SP_PREVIEW, JAPAO_RIO_PREVIEW]) {
  const body = renderExperienceDetailPage(pkg, JAPAO_PREVIEW_CATEGORY, esc, WA);
  const file = join(OUT_DIR, `${pkg.slug}.html`);
  writeFileSync(file, wrapPage(pkg, body), "utf8");
  console.log(`wrote ${file}`);
}
