import { hasFixedDates } from "./fixed-dates.js";

/** Lede used on the vitrine listing and the home vitrine teaser. */
export const VITRINE_LEDE =
  "Descubra experiências prontas para viver. Ou conte com a gente para criar uma viagem inteiramente sob medida para você.";

export const VITRINE_MAST_TITLE = "Vitrine de viagens";

export const VITRINE_MAST_SUB =
  "Experiências escolhidas pela WallTravel, por destino e estilo. Um especialista ajusta o planejamento com você.";

/**
 * @param {string} [search]
 * @returns {"" | "FIXED" | "FLEXIBLE"}
 */
export function parseVitrineDateMode(search = "") {
  const raw = String(search || "");
  const qs = raw.startsWith("?") ? raw.slice(1) : raw;
  const value = new URLSearchParams(qs).get("datas")?.trim().toLowerCase() || "";
  if (value === "fixas" || value === "fixed") return "FIXED";
  if (value === "flexiveis" || value === "flexíveis" || value === "flexible") return "FLEXIBLE";
  return "";
}

/** @param {"" | "FIXED" | "FLEXIBLE"} mode */
export function vitrineDateQuery(mode) {
  if (mode === "FIXED") return "?datas=fixas";
  if (mode === "FLEXIBLE") return "?datas=flexiveis";
  return "";
}

export function isFixedDatePackage(pkg) {
  return Boolean(pkg?.dateMode === "FIXED" || pkg?.hasFixedDates || hasFixedDates(pkg));
}

export function packageMatchesDateMode(pkg, mode) {
  if (!mode) return true;
  const fixed = isFixedDatePackage(pkg);
  return mode === "FIXED" ? fixed : !fixed;
}

export function packageBelongsToCategory(pkg, categorySlug) {
  if (pkg?.categorySlug === categorySlug) return true;
  if (categorySlug === "lua-de-mel") {
    return (pkg?.tags || [])
      .map((t) => String(t).toLowerCase())
      .includes("lua-de-mel");
  }
  return false;
}

export function filterCategoriesByDateMode(categories, packages, mode) {
  if (!mode) return categories;
  return categories
    .map((cat) => {
      const count = packages.filter(
        (pkg) =>
          packageBelongsToCategory(pkg, cat.slug) && packageMatchesDateMode(pkg, mode),
      ).length;
      return { ...cat, packageCount: count };
    })
    .filter((cat) => (Number(cat.packageCount) || 0) > 0);
}
