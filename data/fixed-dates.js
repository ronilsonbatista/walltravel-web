/** Fixed-date planejamentos helpers (vitrine). */

export function formatIsoDateBr(iso) {
  if (!iso || typeof iso !== "string") return "";
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function formatFixedDateRange(start, end) {
  const a = formatIsoDateBr(start);
  const b = formatIsoDateBr(end);
  if (a && b && a !== b) return `${a} a ${b}`;
  return a || b || "";
}

export function hasFixedDates(pkg) {
  return Boolean(pkg?.hasFixedDates || pkg?.dateMode === "FIXED") && Boolean(pkg?.fixedStartDate);
}
