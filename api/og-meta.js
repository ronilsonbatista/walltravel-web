/**
 * Vercel Edge Function: HTML shell with route-specific Open Graph / Twitter tags.
 * Invoked via vercel.json rewrites when the User-Agent is a social crawler.
 *
 * Env: WALLTRAVEL_PLATFORM_API_URL (same as the SPA storefront client).
 */

import {
  buildOgHtml,
  resolveOgMeta,
  CANONICAL_ORIGIN,
} from "../data/og-meta-server.js";

export const config = { runtime: "edge" };

function platformApiBase() {
  return (
    process.env.WALLTRAVEL_PLATFORM_API_URL ||
    process.env.VITE_WALLTRAVEL_PLATFORM_API_URL ||
    "https://admin.walltravel.com.br"
  ).replace(/\/$/, "");
}

function requestPathFrom(reqUrl) {
  const url = new URL(reqUrl);
  const fromQuery = url.searchParams.get("path");
  if (fromQuery) {
    try {
      return new URL(fromQuery, CANONICAL_ORIGIN).pathname + (url.search || "");
    } catch {
      return fromQuery;
    }
  }
  // Direct hit / rewrite may pass kind+slug
  const kind = url.searchParams.get("kind");
  const slug = url.searchParams.get("slug");
  if (kind === "product" && slug) return `/viagens/${slug}`;
  if (kind === "group" && slug) return `/grupos/${slug}`;
  if (kind === "vitrine" && slug) return `/vitrine/${slug}`;
  return url.pathname;
}

export default async function handler(request) {
  const reqUrl = request.url;
  const url = new URL(reqUrl);
  const pathOnly = requestPathFrom(reqUrl);
  const synthetic = new URL(pathOnly, `${url.protocol}//${url.host}`);

  const meta = await resolveOgMeta({
    requestUrl: synthetic.toString(),
    headers: request.headers,
    apiBase: platformApiBase(),
  });

  const html = buildOgHtml(meta);

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Short cache: catalog covers change; bots re-scrape often after publish.
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      "x-walltravel-og": "1",
    },
  });
}
