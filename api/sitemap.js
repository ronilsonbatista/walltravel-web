/**
 * Vercel Edge Function: real XML sitemap for crawlers.
 * Served at /sitemap.xml via vercel.json rewrite (must not hit SPA catch-all).
 */

import { CANONICAL_ORIGIN } from "../data/og-meta-server.js";

export const config = { runtime: "edge" };

const STATIC_PATHS = [
  "/",
  "/vitrine",
  "/grupos",
  "/como-funciona",
  "/institucional",
  "/privacidade",
];

function platformApiBase() {
  return (
    process.env.WALLTRAVEL_PLATFORM_API_URL ||
    process.env.VITE_WALLTRAVEL_PLATFORM_API_URL ||
    "https://admin.walltravel.com.br"
  ).replace(/\/$/, "");
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function loc(pathname) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${CANONICAL_ORIGIN}${path === "/" ? "/" : path.replace(/\/$/, "")}`;
}

function urlEntry(pathname, { changefreq = "weekly", priority = "0.7" } = {}) {
  return `  <url>
    <loc>${xmlEscape(loc(pathname))}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchJson(path) {
  const res = await fetch(`${platformApiBase()}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function handler() {
  const paths = new Set(STATIC_PATHS);

  try {
    const [categoriesBody, productsBody, groupsBody] = await Promise.all([
      fetchJson("/api/public/storefront/categories"),
      fetchJson("/api/public/storefront"),
      fetchJson("/api/public/groups"),
    ]);

    if (categoriesBody?.ok && Array.isArray(categoriesBody.items)) {
      for (const item of categoriesBody.items) {
        if (item?.slug) paths.add(`/vitrine/${item.slug}`);
      }
    }

    if (productsBody?.ok && Array.isArray(productsBody.items)) {
      for (const item of productsBody.items) {
        if (item?.slug) paths.add(`/viagens/${item.slug}`);
      }
    }

    if (groupsBody?.ok && Array.isArray(groupsBody.items)) {
      for (const item of groupsBody.items) {
        if (item?.slug) paths.add(`/grupos/${item.slug}`);
      }
    }
  } catch {
    // Still emit static shell so crawlers get XML, not SPA HTML.
  }

  const ordered = [...paths].sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ordered
  .map((pathname) => {
    let priority = "0.7";
    let changefreq = "weekly";
    if (pathname === "/") {
      priority = "1.0";
      changefreq = "daily";
    } else if (pathname === "/vitrine" || pathname === "/grupos") {
      priority = "0.9";
    } else if (pathname.startsWith("/viagens/") || pathname.startsWith("/grupos/")) {
      priority = "0.8";
    } else if (pathname.startsWith("/vitrine/")) {
      priority = "0.75";
    }
    return urlEntry(pathname, { changefreq, priority });
  })
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=86400",
      "x-walltravel-sitemap": "1",
    },
  });
}
