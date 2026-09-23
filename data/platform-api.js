/**
 * Platform Public API client (Phase 13).
 * Env: WALLTRAVEL_PLATFORM_API_URL (vite envPrefix includes WALLTRAVEL_).
 */

const DEFAULT_WHATSAPP = "5521997138461";

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
  const res = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const err = new Error(`storefront_http_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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

/** Map Public API category → legacy vitrine category shape. */
export function mapCategory(apiCat) {
  return {
    id: apiCat.slug,
    slug: apiCat.slug,
    name: apiCat.name,
    title: apiCat.title || apiCat.name,
    description: apiCat.description || "",
    image: apiCat.coverImageUrl || "/images/vitrine/fallback.svg",
    featured: Boolean(apiCat.featured),
    order: apiCat.sortOrder ?? 100,
    packageCount: apiCat.productCount ?? 0,
  };
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
    tags: Array.isArray(apiProduct.tags) ? apiProduct.tags : [],
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
      `Olá! Gostaria de planejar a experiência ${apiProduct.name} com a WallTravel.`,
    seoTitle: apiProduct.seoTitle || null,
    seoDescription: apiProduct.seoDescription || null,
  };
}
