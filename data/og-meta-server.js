/**
 * Crawler-friendly Open Graph / Twitter meta helpers (Vercel Edge /api/og-meta).
 * Bots that do not execute SPA JS get absolute title/description/image/url.
 */

export const CANONICAL_ORIGIN = "https://www.walltravel.com.br";
export const DEFAULT_OG_IMAGE_PATH = "/images/vitrine/noronha.jpg";
export const DEFAULT_TITLE = "WallTravel | Experiências Incríveis";
export const DEFAULT_DESCRIPTION =
  "WallTravel: viagens sob medida e expedições em grupo pequeno. Planeje a próxima aventura com quem acompanha cada etapa.";

/** Same presentation override as data/platform-api.js (Greece hero on the public site). */
export const GROUP_PRESENTATION_COVERS = {
  grecia: "/images/groups/grecia-santorini.webp",
};

/** Social / chat unfurlers only. Never Googlebot (would index an empty shell). */
export const SOCIAL_BOT_UA_RE =
  /(?:facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|Discordbot|TelegramBot|SkypeUriPreview|Iframely|Pinterest|redditbot|Embedly|Quora Link Preview|Slack-ImgProxy)/i;

export function isSocialCrawler(userAgent) {
  return SOCIAL_BOT_UA_RE.test(String(userAgent || ""));
}

/**
 * @param {string} requestUrl
 * @returns {{ kind: 'product'|'group'|'vitrine-slug'|'default', slug: string|null, pathname: string }}
 */
export function parseOgRoute(requestUrl) {
  const url = new URL(requestUrl, CANONICAL_ORIGIN);
  let pathname = url.pathname || "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const product = pathname.match(/^\/(?:viagens|pacote)\/([^/]+)$/);
  if (product) {
    return { kind: "product", slug: decodeURIComponent(product[1]), pathname };
  }

  const group = pathname.match(/^\/grupos\/([^/]+)$/);
  if (group) {
    return { kind: "group", slug: decodeURIComponent(group[1]), pathname };
  }

  const vitrine = pathname.match(/^\/vitrine\/([^/]+)$/);
  if (vitrine) {
    return {
      kind: "vitrine-slug",
      slug: decodeURIComponent(vitrine[1]),
      pathname,
    };
  }

  return { kind: "default", slug: null, pathname };
}

/**
 * Prefer production www for known production hosts; otherwise request origin
 * (preview/staging) so relative assets resolve on that deployment.
 * @param {string} requestUrl
 * @param {Headers|Record<string,string>|null} [headers]
 */
export function resolveSiteOrigin(requestUrl, headers = null) {
  const url = new URL(requestUrl, CANONICAL_ORIGIN);
  const hostHeader =
    (headers && typeof headers.get === "function"
      ? headers.get("x-forwarded-host") || headers.get("host")
      : headers?.["x-forwarded-host"] || headers?.host) || url.host;

  const host = String(hostHeader || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  if (host === "www.walltravel.com.br" || host === "walltravel.com.br") {
    return CANONICAL_ORIGIN;
  }

  const protoHeader =
    (headers && typeof headers.get === "function"
      ? headers.get("x-forwarded-proto")
      : headers?.["x-forwarded-proto"]) || url.protocol.replace(":", "") || "https";

  const proto = String(protoHeader).split(",")[0].trim() || "https";
  if (!host) return CANONICAL_ORIGIN;
  return `${proto}://${host}`;
}

/**
 * @param {string|null|undefined} imageUrl
 * @param {string} siteOrigin
 */
export function toAbsoluteImageUrl(imageUrl, siteOrigin) {
  const fallback = `${siteOrigin.replace(/\/$/, "")}${DEFAULT_OG_IMAGE_PATH}`;
  const raw = String(imageUrl || "").trim();
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  const origin = siteOrigin.replace(/\/$/, "");
  return raw.startsWith("/") ? `${origin}${raw}` : `${origin}/${raw}`;
}

export function escapeHtmlAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   imageUrl: string,
 *   pageUrl: string,
 *   siteOrigin?: string,
 * }} meta
 */
export function buildOgHtml(meta) {
  const title = String(meta.title || DEFAULT_TITLE).trim() || DEFAULT_TITLE;
  const description =
    String(meta.description || DEFAULT_DESCRIPTION).trim() || DEFAULT_DESCRIPTION;
  const imageUrl = meta.imageUrl || `${CANONICAL_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`;
  const pageUrl = meta.pageUrl || CANONICAL_ORIGIN;
  const t = escapeHtmlAttr(title);
  const d = escapeHtmlAttr(description);
  const img = escapeHtmlAttr(imageUrl);
  const u = escapeHtmlAttr(pageUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t}</title>
  <meta name="description" content="${d}">
  <link rel="canonical" href="${u}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="WallTravel">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:image" content="${img}">
  <meta property="og:url" content="${u}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${img}">
</head>
<body>
  <p><a href="${u}">${t}</a></p>
</body>
</html>`;
}

function formatPageTitle(title) {
  const clean = String(title || "")
    .replace(/\s*\|\s*WallTravel\s*$/i, "")
    .trim();
  return clean ? `${clean} | WallTravel` : DEFAULT_TITLE;
}

function productMeta(item, siteOrigin, pathname) {
  const description =
    item.seoDescription ||
    item.shortDescription ||
    [item.destinationLabel, item.durationLabel].filter(Boolean).join(" · ") ||
    DEFAULT_DESCRIPTION;
  return {
    title: formatPageTitle(item.seoTitle || item.name || DEFAULT_TITLE),
    description,
    imageUrl: toAbsoluteImageUrl(item.coverImageUrl, siteOrigin),
    pageUrl: `${siteOrigin}${pathname}`,
  };
}

function groupMeta(item, siteOrigin, pathname) {
  const presentation = GROUP_PRESENTATION_COVERS[item.slug];
  const cover = presentation || item.coverImageUrl;
  const description =
    item.seoDescription ||
    item.shortDescription ||
    `Viagem em grupo WallTravel: ${item.name || item.slug}.`;
  return {
    title: formatPageTitle(item.seoTitle || item.name || DEFAULT_TITLE),
    description,
    imageUrl: toAbsoluteImageUrl(cover, siteOrigin),
    pageUrl: `${siteOrigin}${pathname}`,
  };
}

function categoryMeta(item, siteOrigin, pathname) {
  return {
    title: formatPageTitle(item.title || item.name || DEFAULT_TITLE),
    description: item.description || DEFAULT_DESCRIPTION,
    imageUrl: toAbsoluteImageUrl(item.coverImageUrl, siteOrigin),
    pageUrl: `${siteOrigin}${pathname}`,
  };
}

export function defaultMeta(siteOrigin, pathname = "/") {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    imageUrl: toAbsoluteImageUrl(DEFAULT_OG_IMAGE_PATH, siteOrigin),
    pageUrl: `${siteOrigin}${pathname || "/"}`,
  };
}

/**
 * @param {string} apiBase  Platform origin, no trailing slash
 * @param {string} path     e.g. /api/public/storefront/turquia-completa
 */
export async function fetchPlatformJson(apiBase, path) {
  const base = String(apiBase || "").replace(/\/$/, "");
  if (!base) {
    const err = new Error("config_missing");
    err.code = "config_missing";
    throw err;
  }
  const res = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
    // Edge: short timeout via AbortSignal when available
    signal:
      typeof AbortSignal !== "undefined" && AbortSignal.timeout
        ? AbortSignal.timeout(4000)
        : undefined,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error(`storefront_http_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Resolve OG meta for a public path using Platform Public API.
 * @returns {Promise<ReturnType<typeof defaultMeta>>}
 */
export async function resolveOgMeta({
  requestUrl,
  headers = null,
  apiBase,
  fetchJson = fetchPlatformJson,
}) {
  const siteOrigin = resolveSiteOrigin(requestUrl, headers);
  const route = parseOgRoute(requestUrl);

  if (route.kind === "default" || !route.slug) {
    return defaultMeta(siteOrigin, route.pathname || "/");
  }

  try {
    if (route.kind === "product") {
      const body = await fetchJson(
        apiBase,
        `/api/public/storefront/${encodeURIComponent(route.slug)}`,
      );
      if (body?.ok && body.item) {
        return productMeta(body.item, siteOrigin, route.pathname);
      }
      return defaultMeta(siteOrigin, route.pathname);
    }

    if (route.kind === "group") {
      const body = await fetchJson(
        apiBase,
        `/api/public/groups/${encodeURIComponent(route.slug)}`,
      );
      if (body?.ok && body.item) {
        return groupMeta(body.item, siteOrigin, route.pathname);
      }
      return defaultMeta(siteOrigin, route.pathname);
    }

    if (route.kind === "vitrine-slug") {
      // Product slug under /vitrine/:slug (share-friendly), else category cover.
      const productBody = await fetchJson(
        apiBase,
        `/api/public/storefront/${encodeURIComponent(route.slug)}`,
      );
      if (productBody?.ok && productBody.item) {
        return productMeta(productBody.item, siteOrigin, route.pathname);
      }
      const cats = await fetchJson(apiBase, "/api/public/storefront/categories");
      const category = Array.isArray(cats?.items)
        ? cats.items.find((c) => c.slug === route.slug)
        : null;
      if (category) {
        return categoryMeta(category, siteOrigin, route.pathname);
      }
      return defaultMeta(siteOrigin, route.pathname);
    }
  } catch {
    return defaultMeta(siteOrigin, route.pathname);
  }

  return defaultMeta(siteOrigin, route.pathname);
}
