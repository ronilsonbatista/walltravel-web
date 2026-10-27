/**
 * Category vitrine tag chips — only show filters that match at least one package.
 * Avoids empty-state dead ends (e.g. Caribe + Luxo when no product has tag "luxo").
 */

import { publicPackageTags } from "./platform-api.js";

/** @typedef {{ id: string, label: string, matchers: string[] }} CategoryFilterChip */

/** Fixed chip catalog (labels are UI chrome, not marketing copy). */
export const CATEGORY_FILTER_CHIPS = /** @type {CategoryFilterChip[]} */ ([
  { id: "lua-de-mel", label: "Lua de Mel", matchers: ["lua-de-mel", "romance"] },
  { id: "natureza", label: "Natureza", matchers: ["natureza"] },
  { id: "praia", label: "Praia", matchers: ["praia"] },
  { id: "luxo", label: "Luxo", matchers: ["luxo"] },
  { id: "aventura", label: "Aventura", matchers: ["aventura"] },
]);

/**
 * Normalize public tags for matching (lowercase, strip diacritics-ish via lower only).
 * @param {unknown} tags
 * @returns {string[]}
 */
export function normalizePackageFilterTags(tags) {
  return publicPackageTags(tags).map((t) => String(t).toLowerCase().trim()).filter(Boolean);
}

/**
 * Whether a package matches a chip (substring on joined tags, same as prior UI).
 * @param {string[]} normalizedTags
 * @param {CategoryFilterChip} chip
 */
export function packageMatchesFilterChip(normalizedTags, chip) {
  const haystack = normalizedTags.join(",");
  return chip.matchers.some((m) => haystack.includes(m));
}

/**
 * Chips that have ≥1 hit in the given packages. "Todos" is always rendered separately.
 * @param {Array<{ tags?: unknown }>} packages
 * @param {CategoryFilterChip[]} [chips]
 * @returns {CategoryFilterChip[]}
 */
export function visibleCategoryFilterChips(packages, chips = CATEGORY_FILTER_CHIPS) {
  const list = Array.isArray(packages) ? packages : [];
  return chips.filter((chip) =>
    list.some((pkg) => packageMatchesFilterChip(normalizePackageFilterTags(pkg?.tags), chip)),
  );
}

/**
 * @param {string} filterId
 * @param {string} tagsCsv lowercase comma-joined tags from data-tags
 * @param {CategoryFilterChip[]} [chips]
 */
export function cardMatchesActiveFilter(filterId, tagsCsv, chips = CATEGORY_FILTER_CHIPS) {
  if (!filterId || filterId === "todos") return true;
  const chip = chips.find((c) => c.id === filterId);
  if (!chip) {
    return String(tagsCsv || "").includes(filterId);
  }
  const tags = String(tagsCsv || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return packageMatchesFilterChip(tags, chip);
}
