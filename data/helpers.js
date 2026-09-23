import vitrineData from "./vitrine.json";
import {
  fetchPublicCategories,
  fetchPublicProducts,
  fetchPublicProductBySlug,
  mapCategory,
  mapProduct,
  getPlatformApiBase,
} from "./platform-api.js";
import { trackStorefrontEvent } from "./storefront-events.js";

/** @type {"platform" | "local"} */
let source = "local";
/** @type {string | null} */
let hydrateError = null;

let categories = [...vitrineData.categories];
let packages = [...vitrineData.packages];
const detailCache = new Map();

function categoryHasInventory(cat) {
  const count = cat.packageCount ?? cat.experienceCount ?? 0;
  return count > 0;
}

function buildLocalCategoriesFromPackages(pkgList) {
  const counts = {};
  for (const p of pkgList) {
    const slug = p.categorySlug;
    if (!slug) continue;
    counts[slug] = (counts[slug] || 0) + 1;
  }
  return vitrineData.categories
    .map((c) => ({
      ...c,
      packageCount: counts[c.slug] || 0,
      experienceCount: counts[c.slug] || 0,
      image: c.image || null,
    }))
    .filter(categoryHasInventory);
}

function useLocalFallback(reason) {
  source = "local";
  hydrateError = reason;
  packages = [...vitrineData.packages];
  categories = buildLocalCategoriesFromPackages(packages);
  trackStorefrontEvent("storefront_api_fallback", { reason });
}

/**
 * Hydrate storefront from Platform Public API.
 * On failure: keep local JSON (elegant degradation).
 */
export async function hydrateStorefront() {
  hydrateError = null;
  detailCache.clear();

  if (!getPlatformApiBase()) {
    useLocalFallback("config_missing");
    return { source, error: hydrateError };
  }

  try {
    const [apiCats, apiProducts] = await Promise.all([
      fetchPublicCategories(),
      fetchPublicProducts(),
    ]);
    categories = apiCats.map(mapCategory).filter(categoryHasInventory);
    packages = apiProducts.map(mapProduct);
    source = "platform";
    hydrateError = null;
    trackStorefrontEvent("storefront_api_ok", {
      categories: categories.length,
      products: packages.length,
    });
    return { source, error: null };
  } catch (e) {
    useLocalFallback(e?.code || e?.message || "fetch_failed");
    return { source, error: hydrateError };
  }
}

export function getStorefrontSource() {
  return source;
}

export function getStorefrontHydrateError() {
  return hydrateError;
}

// Categories (only populated categories)
export const getCategories = () => categories.filter(categoryHasInventory);
export const getFeaturedCategories = () => categories.filter((c) => c.featured);
export const getCategoryBySlug = (slug) =>
  categories.find((c) => c.slug === slug);

// Packages / experiences
export const getPackagesByCategory = (categorySlug) => {
  return packages.filter(
    (p) =>
      p.categorySlug === categorySlug ||
      (categorySlug === "lua-de-mel" &&
        (p.tags || []).map((t) => String(t).toLowerCase()).includes("lua-de-mel")),
  );
};

export const getPackageBySlug = (slug) => packages.find((p) => p.slug === slug);

export const getFeaturedPackages = () => packages.filter((p) => p.featured);

/** Prefer cached list; fetch detail from API when on platform source. */
export async function resolvePackageBySlug(slug) {
  if (detailCache.has(slug)) return detailCache.get(slug);
  const listed = getPackageBySlug(slug);
  if (source !== "platform") return listed || null;
  try {
    const detail = mapProduct(await fetchPublicProductBySlug(slug));
    detailCache.set(slug, detail);
    // keep list in sync
    const idx = packages.findIndex((p) => p.slug === slug);
    if (idx >= 0) packages[idx] = { ...packages[idx], ...detail };
    else packages.push(detail);
    return detail;
  } catch {
    return listed || null;
  }
}

// Hero / honeymoon remain local (institutional home content ownership = web)
export const getHeroSlides = () => vitrineData.heroSlides;
export const getHeroSlideById = (id) =>
  vitrineData.heroSlides.find((s) => s.id === id);
export const getOrderedHeroSlides = () =>
  [...vitrineData.heroSlides].sort((a, b) => a.order - b.order);

export const getHoneymoonSection = () => vitrineData.homeSections.honeymoon;
export const getHoneymoonPackages = () =>
  packages.filter((p) =>
    (p.tags || []).map((t) => String(t).toLowerCase()).includes("lua-de-mel"),
  );
export const getPackagesByTag = (tag) => {
  const t = String(tag).toLowerCase();
  return packages.filter((p) =>
    (p.tags || []).map((x) => String(x).toLowerCase()).includes(t),
  );
};
