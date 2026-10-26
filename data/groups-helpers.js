import localIndex from "./groups-local/index.json";
import greciaLocal from "./groups-local/grecia.json";
import turquiaLocal from "./groups-local/turquia.json";
import italiaLocal from "./groups-local/italia.json";
import {
  fetchPublicGroups,
  fetchPublicGroupBySlug,
  mapGroup,
  getPlatformApiBase,
} from "./platform-api.js";

const LOCAL_DETAILS = {
  grecia: greciaLocal,
  turquia: turquiaLocal,
  italia: italiaLocal,
};

/**
 * Storefront pricing for Grécia lives in groups-local until the CMS is updated.
 * Overlay keeps BRL/EUR/cotação correct when the Platform API still has the old amount.
 */
function applyLocalPricingOverlay(group) {
  if (!group?.slug || group.slug !== "grecia") return group;
  const local = LOCAL_DETAILS.grecia;
  if (!local || local.priceFrom == null) return group;
  return {
    ...group,
    priceFrom: local.priceFrom,
    currency: local.currency ?? group.currency,
    priceNote: local.priceNote ?? group.priceNote,
    priceEur: local.priceEur ?? group.priceEur ?? null,
    quoteDate: local.quoteDate ?? group.quoteDate ?? null,
    investmentOptions: Array.isArray(local.investmentOptions)
      ? local.investmentOptions
      : group.investmentOptions,
    ctaWhatsappMessage: local.ctaWhatsappMessage ?? group.ctaWhatsappMessage,
  };
}

function mapGroupWithLocalPricing(item) {
  return applyLocalPricingOverlay(mapGroup(item));
}

/** @type {"platform" | "local"} */
let source = "local";
/** @type {string | null} */
let hydrateError = null;

let groups = localIndex.map((item) => mapGroupWithLocalPricing(item)).filter(Boolean);
const detailCache = new Map();

function useLocalGroups(reason) {
  source = "local";
  hydrateError = reason;
  groups = localIndex.map((item) => mapGroupWithLocalPricing(item)).filter(Boolean);
  detailCache.clear();
}

export async function hydrateGroups(options = {}) {
  hydrateError = null;
  detailCache.clear();

  if (!getPlatformApiBase()) {
    useLocalGroups("config_missing");
    return { source, error: hydrateError };
  }

  const prefetchSlug =
    typeof options.prefetchSlug === "string" && options.prefetchSlug
      ? options.prefetchSlug
      : null;

  try {
    const listPromise = fetchPublicGroups();
    const detailPromise = prefetchSlug
      ? fetchPublicGroupBySlug(prefetchSlug).catch(() => null)
      : null;

    const apiItems = await listPromise;
    if (!apiItems.length) {
      useLocalGroups("empty_api");
      return { source, error: hydrateError };
    }
    groups = apiItems.map(mapGroupWithLocalPricing).filter(Boolean);
    source = "platform";
    hydrateError = null;

    if (detailPromise && prefetchSlug) {
      const detail = await detailPromise;
      if (detail) {
        const mapped = mapGroupWithLocalPricing(detail);
        if (mapped) detailCache.set(prefetchSlug, mapped);
      }
    }

    return { source, error: null };
  } catch (e) {
    useLocalGroups(e?.code || e?.message || "fetch_failed");
    return { source, error: hydrateError };
  }
}

export function getGroupsSource() {
  return source;
}

export function getGroupsHydrateError() {
  return hydrateError;
}

export function getGroups() {
  return groups;
}

export function getGroupSummaryBySlug(slug) {
  return groups.find((g) => g.slug === slug) || null;
}

export async function resolveGroupBySlug(slug) {
  if (detailCache.has(slug)) return detailCache.get(slug);

  if (source === "platform") {
    try {
      const item = mapGroupWithLocalPricing(await fetchPublicGroupBySlug(slug));
      if (item) detailCache.set(slug, item);
      return item;
    } catch {
      const local = LOCAL_DETAILS[slug];
      if (local) {
        const mapped = mapGroupWithLocalPricing(local);
        detailCache.set(slug, mapped);
        return mapped;
      }
      return null;
    }
  }

  const local = LOCAL_DETAILS[slug];
  if (!local) return null;
  const mapped = mapGroupWithLocalPricing(local);
  detailCache.set(slug, mapped);
  return mapped;
}
