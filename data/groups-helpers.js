import localIndex from "./groups-local/index.json";
import greciaLocal from "./groups-local/grecia.json";
import turquiaLocal from "./groups-local/turquia.json";
import {
  fetchPublicGroups,
  fetchPublicGroupBySlug,
  mapGroup,
  getPlatformApiBase,
} from "./platform-api.js";

const LOCAL_DETAILS = {
  grecia: greciaLocal,
  turquia: turquiaLocal,
};

/** @type {"platform" | "local"} */
let source = "local";
/** @type {string | null} */
let hydrateError = null;

let groups = localIndex.map((item) => mapGroup(item)).filter(Boolean);
const detailCache = new Map();

function useLocalGroups(reason) {
  source = "local";
  hydrateError = reason;
  groups = localIndex.map((item) => mapGroup(item)).filter(Boolean);
  detailCache.clear();
}

export async function hydrateGroups() {
  hydrateError = null;
  detailCache.clear();

  if (!getPlatformApiBase()) {
    useLocalGroups("config_missing");
    return { source, error: hydrateError };
  }

  try {
    const apiItems = await fetchPublicGroups();
    if (!apiItems.length) {
      useLocalGroups("empty_api");
      return { source, error: hydrateError };
    }
    groups = apiItems.map(mapGroup).filter(Boolean);
    source = "platform";
    hydrateError = null;
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
      const item = mapGroup(await fetchPublicGroupBySlug(slug));
      if (item) detailCache.set(slug, item);
      return item;
    } catch {
      const local = LOCAL_DETAILS[slug];
      if (local) {
        const mapped = mapGroup(local);
        detailCache.set(slug, mapped);
        return mapped;
      }
      return null;
    }
  }

  const local = LOCAL_DETAILS[slug];
  if (!local) return null;
  const mapped = mapGroup(local);
  detailCache.set(slug, mapped);
  return mapped;
}
