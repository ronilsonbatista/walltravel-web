/**
 * Platform Public API client (Phase 13).
 * Env: WALLTRAVEL_PLATFORM_API_URL (vite envPrefix includes WALLTRAVEL_).
 */

const DEFAULT_WHATSAPP = "5521997138461";

/** In-flight dedupe + short TTL so SPA navigations reuse warm catalog responses. */
const RESPONSE_TTL_MS = 60_000;
/** @type {Map<string, { expires: number, body: unknown }>} */
const responseCache = new Map();
/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

export function getPlatformApiBase() {
  const raw =
    import.meta.env.WALLTRAVEL_PLATFORM_API_URL ||
    import.meta.env.VITE_WALLTRAVEL_PLATFORM_API_URL ||
    "";
  return String(raw).trim().replace(/\/$/, "");
}

export function getWhatsappNumber() {
  return (
    import.meta.env.WALLTRAVEL_WHATSAPP_NUMBER ||
    import.meta.env.VITE_WALLTRAVEL_WHATSAPP_NUMBER ||
    DEFAULT_WHATSAPP
  );
}

async function getJson(path) {
  const base = getPlatformApiBase();
  if (!base) {
    const err = new Error("WALLTRAVEL_PLATFORM_API_URL not configured");
    err.code = "config_missing";
    throw err;
  }

  const url = `${base}${path}`;
  const cached = responseCache.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.body;
  }

  const pending = inflight.get(url);
  if (pending) return pending;

  const request = (async () => {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "omit",
      // Prefer HTTP cache when Platform sends Cache-Control / s-maxage.
      cache: "default",
    });
    if (!res.ok) {
      const err = new Error(`storefront_http_${res.status}`);
      err.status = res.status;
      throw err;
    }
    const body = await res.json();
    responseCache.set(url, { expires: Date.now() + RESPONSE_TTL_MS, body });
    return body;
  })();

  inflight.set(url, request);
  try {
    return await request;
  } finally {
    inflight.delete(url);
  }
}

/** Clear client caches (tests / forced refresh). */
export function clearPlatformApiCache() {
  responseCache.clear();
  inflight.clear();
}

/** Internal CMS/API metadata tags must never appear on the public storefront. */
const INTERNAL_PACKAGE_TAG_RE = /^(legacy|source)\s*:/i;

export function isPublicPackageTag(tag) {
  const value = String(tag ?? "").trim();
  if (!value) return false;
  return !INTERNAL_PACKAGE_TAG_RE.test(value);
}

export function publicPackageTags(tags) {
  return (Array.isArray(tags) ? tags : []).filter(isPublicPackageTag);
}

export async function fetchPublicCategories() {
  const body = await getJson("/api/public/storefront/categories");
  if (!body?.ok || !Array.isArray(body.items)) {
    throw new Error("invalid_categories_payload");
  }
  return body.items;
}

export async function fetchPublicProducts(params = {}) {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.q) q.set("q", params.q);
  if (params.tag) q.set("tag", params.tag);
  if (params.featured === true) q.set("featured", "true");
  if (params.dateMode) q.set("dateMode", params.dateMode);
  if (params.datasFixas === true) q.set("datasFixas", "1");
  if (params.origin) q.set("origin", params.origin);
  const qs = q.toString();
  const body = await getJson(
    `/api/public/storefront${qs ? `?${qs}` : ""}`,
  );
  if (!body?.ok || !Array.isArray(body.items)) {
    throw new Error("invalid_products_payload");
  }
  return body.items;
}

export async function fetchPublicProductBySlug(slug) {
  const body = await getJson(
    `/api/public/storefront/${encodeURIComponent(slug)}`,
  );
  if (!body?.ok || !body.item) {
    const err = new Error("not_found");
    err.status = 404;
    throw err;
  }
  return body.item;
}

/** Paris à noite — capa editorial da categoria Europa (home + /vitrine). */
export const EUROPA_PARIS_NIGHT_COVER_URL =
  "https://www.walltravel.com.br/images/vitrine/europa-paris-noite.jpg";

/** Capas fracas/erradas ainda vistas em produção para Europa (ex.: Grécia). */
const WEAK_EUROPA_COVER_MARKERS = [
  "grecia-atenas-santorini",
  "/images/vitrine/europa.jpg",
  "/images/vitrine/europa.webp",
];

/** Resolve capa Europa: troca capa fraca por Paris à noite; preserva URL curada. */
export function resolveEuropaCategoryCover(coverImageUrl) {
  const url = typeof coverImageUrl === "string" ? coverImageUrl.trim() : "";
  if (!url) return EUROPA_PARIS_NIGHT_COVER_URL;
  if (WEAK_EUROPA_COVER_MARKERS.some((m) => url.includes(m))) {
    return EUROPA_PARIS_NIGHT_COVER_URL;
  }
  return url;
}

/** Map Public API category → legacy vitrine category shape. */
export function mapCategory(apiCat) {
  const count =
    apiCat.productCount ?? apiCat.experienceCount ?? apiCat.packageCount ?? 0;
  const rawCover = apiCat.coverImageUrl || null;
  return {
    id: apiCat.slug,
    slug: apiCat.slug,
    name: apiCat.name,
    title: apiCat.title || apiCat.name,
    description: apiCat.description || "",
    image:
      apiCat.slug === "europa"
        ? resolveEuropaCategoryCover(rawCover)
        : rawCover,
    featured: Boolean(apiCat.featured),
    order: apiCat.sortOrder ?? apiCat.order ?? 100,
    packageCount: count,
    experienceCount: count,
  };
}

export async function fetchPublicGroups() {
  const body = await getJson("/api/public/groups");
  if (!body?.ok || !Array.isArray(body.items)) {
    throw new Error("invalid_groups_payload");
  }
  return body.items;
}

export async function fetchPublicGroupBySlug(slug) {
  const body = await getJson(
    `/api/public/groups/${encodeURIComponent(slug)}`,
  );
  if (!body?.ok || !body.item) {
    const err = new Error("not_found");
    err.status = 404;
    throw err;
  }
  return body.item;
}

/** Public presentation covers. The CMS file named hero-santorini is the cliff/cruise shot. */
const PRESENTATION_COVERS = {
  grecia: "/images/groups/grecia-santorini.webp",
};

/** Higher-quality leader portraits for public storefront presentation. */
const PRESENTATION_LEADER_PHOTOS = {
  grecia: "/images/groups/wallace-maia.webp",
};

function presentGroup(group) {
  const cover = PRESENTATION_COVERS[group?.slug];
  const leaderPhoto = PRESENTATION_LEADER_PHOTOS[group?.slug];
  const gallery = Array.isArray(group.gallery) ? group.gallery : [];
  const next = { ...group };

  if (cover) {
    next.coverImageUrl = cover;
    next.gallery = [
      cover,
      ...gallery.filter(
        (src) =>
          src &&
          src !== cover &&
          !String(src).includes("hero-santorini.webp"),
      ),
    ];
  }

  if (leaderPhoto && next.leader) {
    next.leader = { ...next.leader, photoUrl: leaderPhoto };
  }

  return next;
}

/** Map Public API group summary/detail → web group shape. */
export function mapGroup(apiGroup) {
  if (!apiGroup?.slug) return null;
  return presentGroup({
    slug: apiGroup.slug,
    name: apiGroup.name,
    shortDescription: apiGroup.shortDescription ?? null,
    destinationLabel: apiGroup.destinationLabel ?? null,
    durationLabel: apiGroup.durationLabel ?? null,
    departureLabel: apiGroup.departureLabel ?? null,
    departureDate: apiGroup.departureDate ?? null,
    returnDate: apiGroup.returnDate ?? null,
    daysCount: apiGroup.daysCount ?? null,
    nightsCount: apiGroup.nightsCount ?? null,
    groupSize: apiGroup.groupSize ?? null,
    priceFrom: apiGroup.priceFrom ?? null,
    priceUnit: apiGroup.priceUnit ?? "PER_PERSON",
    currency: apiGroup.currency ?? "BRL",
    priceNote: apiGroup.priceNote ?? null,
    coverImageUrl: apiGroup.coverImageUrl || null,
    featured: Boolean(apiGroup.featured),
    comingSoon: Boolean(apiGroup.comingSoon),
    ctaLabel: apiGroup.ctaLabel ?? null,
    highlights: Array.isArray(apiGroup.highlights) ? apiGroup.highlights : [],
    description: apiGroup.description ?? null,
    editorial: apiGroup.editorial ?? null,
    gallery: Array.isArray(apiGroup.gallery) ? apiGroup.gallery : [],
    whyGroup: Array.isArray(apiGroup.whyGroup) ? apiGroup.whyGroup : [],
    routeStops: Array.isArray(apiGroup.routeStops) ? apiGroup.routeStops : [],
    itinerary: Array.isArray(apiGroup.itinerary) ? apiGroup.itinerary : [],
    investmentOptions: Array.isArray(apiGroup.investmentOptions)
      ? apiGroup.investmentOptions
      : [],
    paymentMethods: (
      Array.isArray(apiGroup.paymentMethods) ? apiGroup.paymentMethods : []
    ).filter((p) => {
      const title = String(p?.title ?? "").trim();
      if (!title) return false;
      // Group storefront: credit/debit only (CMS/API may still seed Pix).
      return !/^pix$/i.test(title);
    }),
    optionals: Array.isArray(apiGroup.optionals) ? apiGroup.optionals : [],
    includes: Array.isArray(apiGroup.includes) ? apiGroup.includes : [],
    excludes: Array.isArray(apiGroup.excludes) ? apiGroup.excludes : [],
    bomSaber: Array.isArray(apiGroup.bomSaber) ? apiGroup.bomSaber : [],
    faq: Array.isArray(apiGroup.faq) ? apiGroup.faq : [],
    leader: apiGroup.leader ?? null,
    formFields: Array.isArray(apiGroup.formFields) ? apiGroup.formFields : [],
    seoTitle: apiGroup.seoTitle ?? null,
    seoDescription: apiGroup.seoDescription ?? null,
    ctaWhatsappMessage: apiGroup.ctaWhatsappMessage ?? null,
    publishedAt: apiGroup.publishedAt ?? null,
  });
}

/** Map Public API product summary/detail → legacy package shape. */
export function mapProduct(apiProduct) {
  const price =
    apiProduct.priceFrom == null || apiProduct.priceFrom === ""
      ? null
      : Number(apiProduct.priceFrom);
  return {
    id: apiProduct.slug,
    slug: apiProduct.slug,
    categorySlug: apiProduct.categorySlug || "",
    name: apiProduct.name,
    destination: apiProduct.destinationLabel || "",
    duration: apiProduct.durationLabel || "",
    type: apiProduct.experienceType || "",
    shortDescription: apiProduct.shortDescription || "",
    description: apiProduct.description || apiProduct.shortDescription || "",
    priceFrom: Number.isFinite(price) ? price : null,
    priceUnit: apiProduct.priceUnit || "PER_PERSON",
    currency: apiProduct.currency || "BRL",
    image: apiProduct.coverImageUrl || "/images/vitrine/fallback.svg",
    gallery: Array.isArray(apiProduct.gallery)
      ? apiProduct.gallery
      : apiProduct.coverImageUrl
        ? [apiProduct.coverImageUrl]
        : [],
    tags: publicPackageTags(apiProduct.tags),
    included: Array.isArray(apiProduct.includes) ? apiProduct.includes : [],
    notIncluded: Array.isArray(apiProduct.excludes) ? apiProduct.excludes : [],
    itinerary: Array.isArray(apiProduct.itinerary)
      ? apiProduct.itinerary.map((d) => ({
          day: d.day,
          title: d.title,
          description: d.description || "",
        }))
      : [],
    importantNotes: Array.isArray(apiProduct.importantNotes)
      ? apiProduct.importantNotes
      : [],
    featured: Boolean(apiProduct.featured),
    ctaLabel: apiProduct.ctaLabel || "Planejar minha viagem",
    ctaWhatsappMessage:
      apiProduct.ctaWhatsappMessage ||
      `Olá! Vim pela vitrine do site e tenho interesse no planejamento "${apiProduct.name}".`,
    seoTitle: apiProduct.seoTitle || null,
    seoDescription: apiProduct.seoDescription || null,
    dateMode: apiProduct.dateMode === "FIXED" ? "FIXED" : "FLEXIBLE",
    hasFixedDates: Boolean(apiProduct.hasFixedDates),
    fixedStartDate: apiProduct.fixedStartDate || null,
    fixedEndDate: apiProduct.fixedEndDate || null,
    departureScope:
      apiProduct.departureScope === "ORIGINS" ? "ORIGINS" : "ALL_BRAZIL",
    departureOrigins: Array.isArray(apiProduct.departureOrigins)
      ? apiProduct.departureOrigins
      : [],
    originPrices: Array.isArray(apiProduct.originPrices)
      ? apiProduct.originPrices.map((row) => ({
          uf: row.uf,
          label: row.label || row.uf,
          priceFrom:
            row.priceFrom == null || row.priceFrom === ""
              ? null
              : Number(row.priceFrom),
          paymentNote: row.paymentNote || null,
        }))
      : [],
  };
}
