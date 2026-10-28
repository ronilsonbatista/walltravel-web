/**
 * Black WallTravel — campaign skin + filter IA.
 * Primary segments: Nacional | estações (Inverno, Verão, Primavera, Outono se houver dados).
 * Nacional: sem filtro de país. Internacionais por estação: filtro secundário por país.
 *
 * Catalog: empty until CMS/SQL seeds `bf:*` tags. Homolog overlay seed only with
 * VITE_BLACK_WALL_SEED=true (never invent products in the default / prod path).
 */

import overlay from "./black-wall-overlay.js";
import { publicPackageTags } from "./platform-api.js";
import { formatFixedDateRange, hasFixedDates } from "./fixed-dates.js";
import { buildWhatsAppCTA } from "./whatsapp-cta.js";

export const BWT_SESSION_KEY = "wt_black_campaign";
export const BWT_BRAND_TITLE = "Black WallTravel";

export const BWT_SEGMENTS = [
  { id: "nacional", label: "Nacional" },
  { id: "inverno", label: "Inverno" },
  { id: "verao", label: "Verão" },
  { id: "primavera", label: "Primavera" },
  { id: "outono", label: "Outono" },
];

const SEGMENT_IDS = new Set(BWT_SEGMENTS.map((s) => s.id));

const CATEGORY_COUNTRY = {
  nacionais: { country: "Brasil", countrySlug: "brasil", segment: "nacional" },
  nordeste: { country: "Brasil", countrySlug: "brasil", segment: "nacional" },
  asia: { country: "Japão", countrySlug: "japao" },
  africa: { country: "África do Sul", countrySlug: "africa-do-sul" },
  europa: { country: "Europa", countrySlug: "europa" },
  caribe: { country: "Caribe", countrySlug: "caribe" },
  turquia: { country: "Turquia", countrySlug: "turquia" },
  maldivas: { country: "Maldivas", countrySlug: "maldivas" },
  "estados-unidos": { country: "Estados Unidos", countrySlug: "estados-unidos" },
  "america-do-sul": { country: "Peru", countrySlug: "peru" },
  australia: { country: "Austrália", countrySlug: "australia" },
};

/**
 * Homolog overlay seed (maps existing vitrine slugs). Off by default so production
 * /black stays empty until SQL/CMS tags land.
 */
export function isBlackWallSeedEnabled() {
  const metaEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  const env = String(metaEnv.VITE_BLACK_WALL_SEED || "").toLowerCase();
  return env === "true" || env === "1";
}

/** @deprecated Route /black is always available; entries (home/nav) stay removed. */
export function isBlackWallTravelEnabled() {
  return true;
}

export function isBlackWallPath(path) {
  const p = String(path || "");
  return (
    p === "/black" ||
    p === "/black/" ||
    p === "/black-wall-travel" ||
    p === "/black-wall-travel/" ||
    p.startsWith("/black/") ||
    p.startsWith("/black-wall-travel/")
  );
}

export function markBlackCampaignSession() {
  try {
    sessionStorage.setItem(BWT_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearBlackCampaignSession() {
  try {
    sessionStorage.removeItem(BWT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function hasBlackCampaignSession() {
  try {
    return sessionStorage.getItem(BWT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function normalizeTag(tag) {
  return String(tag || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function slugifyCountry(label) {
  return normalizeTag(label)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Explicit campaign tags from CMS/SQL (`bf:nacional`, `bf:verao`, `bf:pais:japao`, …). */
export function hasExplicitBlackTag(pkg) {
  const tags = publicPackageTags(pkg?.tags).map(normalizeTag);
  return tags.some(
    (t) =>
      t === "bf:nacional" ||
      [...SEGMENT_IDS].some((id) => t === `bf:${id}`) ||
      t.startsWith("bf:pais:"),
  );
}

/**
 * Resolve segment + country.
 * @param {{ slug?: string, tags?: unknown, categorySlug?: string, destination?: string, name?: string }} pkg
 * @param {{ allowOverlay?: boolean }} [opts]
 */
export function resolveBlackMeta(pkg, opts = {}) {
  const allowOverlay = opts.allowOverlay === true;
  const slug = String(pkg?.slug || "");
  const tags = publicPackageTags(pkg?.tags).map(normalizeTag);
  const overlayRow = allowOverlay ? overlay?.bySlug?.[slug] || null : null;

  let segment = null;
  let country = null;
  let countrySlug = null;
  let source = "none";

  for (const tag of tags) {
    for (const id of SEGMENT_IDS) {
      if (tag === `bf:${id}`) {
        segment = id;
        source = "cms";
      }
    }
    const pais = tag.match(/^bf:pais:(.+)$/);
    if (pais) {
      countrySlug = pais[1];
      country = countrySlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      if (source === "none") source = "cms";
    }
  }

  if (allowOverlay && overlayRow) {
    if (!segment && overlayRow.segment) segment = overlayRow.segment;
    if (!country && overlayRow.country) country = overlayRow.country;
    if (!countrySlug && overlayRow.countrySlug) countrySlug = overlayRow.countrySlug;
    if (overlayRow.segment || overlayRow.country) source = source === "cms" ? "cms+overlay" : "overlay";
  }

  if (allowOverlay) {
    const cat = CATEGORY_COUNTRY[String(pkg?.categorySlug || "")];
    if (cat) {
      if (!segment && cat.segment) segment = cat.segment;
      if (!country && cat.country) country = cat.country;
      if (!countrySlug && cat.countrySlug) countrySlug = cat.countrySlug;
      if (source === "none" && (cat.segment || cat.country)) source = "category";
    }

    const dest = normalizeTag(pkg?.destination || "");
    const name = normalizeTag(pkg?.name || "");
    if (
      !segment &&
      (dest.includes("brasil") ||
        name.includes("noronha") ||
        name.includes("chapada") ||
        name.includes("bonito") ||
        name.includes("gramado"))
    ) {
      segment = "nacional";
      country = country || "Brasil";
      countrySlug = countrySlug || "brasil";
      source = "heuristic";
    }

    if (!segment) {
      segment = "primavera";
      source = source === "none" ? "default-primavera" : source;
    }
  }

  if (segment === "nacional") {
    country = "Brasil";
    countrySlug = "brasil";
  } else if (!countrySlug && country) {
    countrySlug = slugifyCountry(country);
  } else if (!country && countrySlug) {
    country = countrySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } else if (segment && !country) {
    country = "Internacional";
    countrySlug = "internacional";
  }

  return { segment, country, countrySlug, source };
}

export function enrichPackageForBlack(pkg, opts = {}) {
  const allowOverlay =
    typeof opts.allowOverlay === "boolean" ? opts.allowOverlay : isBlackWallSeedEnabled();
  const meta = resolveBlackMeta(pkg, { allowOverlay });
  return { ...pkg, black: meta };
}

/**
 * Catalog for /black: seeded overlay (homolog) or only CMS `bf:*` tagged items.
 * Default path returns [] until SQL/docs seed tags.
 */
export function getBlackCatalogPackages(packages, opts = {}) {
  const seed = opts.seed ?? isBlackWallSeedEnabled();
  const list = Array.isArray(packages) ? packages : [];
  const selected = seed ? list : list.filter(hasExplicitBlackTag);
  return selected
    .map((pkg) => enrichPackageForBlack(pkg, { allowOverlay: seed }))
    .filter((pkg) => Boolean(pkg.black?.segment));
}

/**
 * @param {string} [search]
 * @returns {{ segment: string, country: string }}
 */
export function parseBlackFilters(search = "") {
  const params = new URLSearchParams(
    String(search || "").startsWith("?") ? String(search).slice(1) : String(search || ""),
  );
  const rawSeg = normalizeTag(params.get("seg") || params.get("segment") || "");
  const segment = SEGMENT_IDS.has(rawSeg) ? rawSeg : "";
  const country = slugifyCountry(params.get("pais") || params.get("country") || "");
  return { segment, country };
}

export function blackFilterQuery({ segment = "", country = "" } = {}) {
  const params = new URLSearchParams();
  if (segment && SEGMENT_IDS.has(segment)) params.set("seg", segment);
  if (country && segment && segment !== "nacional") params.set("pais", country);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * @param {Array} packages
 * @param {{ segment?: string, country?: string }} filters
 */
export function filterBlackPackages(packages, filters = {}) {
  const list = (Array.isArray(packages) ? packages : []).map((pkg) =>
    pkg?.black ? pkg : enrichPackageForBlack(pkg),
  );
  const segment = filters.segment || "";
  const country = filters.country || "";

  return list.filter((pkg) => {
    if (!pkg.black?.segment) return false;
    if (segment && pkg.black.segment !== segment) return false;
    if (segment && segment !== "nacional" && country) {
      if (pkg.black.countrySlug !== country) return false;
    }
    return true;
  });
}

/**
 * Primary chips that have ≥1 listing. When catalog empty, UI still shows full architecture.
 */
export function visibleBlackSegments(packages) {
  const enriched = (Array.isArray(packages) ? packages : []).map((pkg) =>
    pkg?.black ? pkg : enrichPackageForBlack(pkg),
  );
  return BWT_SEGMENTS.filter((seg) =>
    enriched.some((pkg) => pkg.black?.segment === seg.id),
  );
}

/**
 * Secondary country chips for a season segment.
 */
export function visibleBlackCountries(packages, segment) {
  if (!segment || segment === "nacional") return [];
  const enriched = filterBlackPackages(packages, { segment });
  const map = new Map();
  for (const pkg of enriched) {
    const slug = pkg.black?.countrySlug;
    if (!slug || map.has(slug)) continue;
    map.set(slug, { id: slug, label: pkg.black.country });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export function blackMastCopy() {
  return {
    headline: BWT_BRAND_TITLE,
    lede: "Curadoria com cuidado: destino certo, no tempo certo.",
  };
}

/**
 * Render listing HTML for /black (caller injects into view).
 */
export function renderBlackListingHtml({
  packages,
  filters,
  esc,
  searchQuery = "",
}) {
  const all = Array.isArray(packages) ? packages : [];
  const catalogEmpty = all.length === 0;
  // Keep full filter architecture even when empty (no inventário yet).
  const segmentChips = catalogEmpty ? BWT_SEGMENTS : visibleBlackSegments(all);
  const filtered = filterBlackPackages(all, filters).filter((pkg) => {
    const q = String(searchQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    const hay = `${pkg.name || ""} ${pkg.destination || ""} ${(pkg.tags || []).join(" ")} ${pkg.black?.country || ""}`.toLowerCase();
    return hay.includes(q);
  });
  const countries = visibleBlackCountries(all, filters.segment);
  const copy = blackMastCopy();
  const base = "/black";

  const segChip = (seg) => {
    const active = filters.segment === seg.id;
    const href = active ? base : `${base}${blackFilterQuery({ segment: seg.id })}`;
    return `<a class="bwt-chip${active ? " is-active" : ""}" href="${esc(href)}" data-bwt-seg="${esc(seg.id)}" aria-current="${active ? "true" : "false"}">${esc(seg.label)}</a>`;
  };

  const countryChip = (c) => {
    const active = filters.country === c.id;
    const href = active
      ? `${base}${blackFilterQuery({ segment: filters.segment })}`
      : `${base}${blackFilterQuery({ segment: filters.segment, country: c.id })}`;
    return `<a class="bwt-chip bwt-chip--country${active ? " is-active" : ""}" href="${esc(href)}" data-bwt-pais="${esc(c.id)}" aria-current="${active ? "true" : "false"}">${esc(c.label)}</a>`;
  };

  const cards = filtered
    .map((pkg) => {
      const visibleTags = publicPackageTags(pkg.tags).slice(0, 4);
      const fixedLabel = hasFixedDates(pkg)
        ? formatFixedDateRange(pkg.fixedStartDate, pkg.fixedEndDate)
        : "";
      const wa = buildWhatsAppCTA({
        pageType: "BLACK",
        context: "black",
        placement: "product",
        entity: { name: pkg.name, slug: pkg.slug },
        source: "black-card",
      });
      const segLabel =
        BWT_SEGMENTS.find((s) => s.id === pkg.black.segment)?.label || pkg.black.segment;
      return `
      <article class="bwt-card" data-name="${esc((pkg.name || "").toLowerCase())}" data-seg="${esc(pkg.black.segment)}" data-pais="${esc(pkg.black.countrySlug)}">
        <a class="bwt-card-media" href="/viagens/${esc(pkg.slug)}?from=black" data-bwt-detail>
          <img src="${esc(pkg.image)}" alt="${esc(pkg.name)}" width="800" height="600" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/images/vitrine/fallback.svg';">
        </a>
        <div class="bwt-card-body">
          <div class="bwt-card-kicker">
            <span>${esc(segLabel)}</span>
            ${pkg.black.segment !== "nacional" ? `<span>${esc(pkg.black.country)}</span>` : ""}
          </div>
          ${
            visibleTags.length
              ? `<div class="bwt-card-tags">${visibleTags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`
              : ""
          }
          <h3 class="bwt-card-title"><a href="/viagens/${esc(pkg.slug)}?from=black" data-bwt-detail>${esc(pkg.name)}</a></h3>
          <p class="bwt-card-meta">${esc(pkg.destination || "")}${pkg.duration ? ` · ${esc(pkg.duration)}` : ""}</p>
          ${fixedLabel ? `<p class="bwt-card-dates">Datas fixas: ${esc(fixedLabel)}</p>` : ""}
          <p class="bwt-card-price">${
            pkg.priceFrom
              ? `A partir de <strong>${pkg.currency === "BRL" ? "R$" : pkg.currency === "USD" ? "US$" : "€"} ${Number(pkg.priceFrom).toLocaleString("pt-BR")}</strong>`
              : `Preço <strong>Sob consulta</strong>`
          }</p>
          <div class="bwt-card-ctas">
            <a class="bwt-btn bwt-btn--primary" href="/viagens/${esc(pkg.slug)}?from=black" data-bwt-detail>Ver detalhes</a>
            <a class="bwt-btn bwt-btn--ghost" href="${esc(wa.href)}" target="_blank" rel="noopener" data-storefront-cta="whatsapp">WhatsApp</a>
          </div>
        </div>
      </article>`;
    })
    .join("");

  const emptyWa = buildWhatsAppCTA({
    pageType: "BLACK",
    context: "black",
    placement: "black-empty",
    source: "black-empty",
  });

  const activeSegLabel =
    BWT_SEGMENTS.find((s) => s.id === filters.segment)?.label || "Todas";

  const emptyHtml = catalogEmpty
    ? `<div class="bwt-empty bwt-empty--preparing" data-bwt-empty="preparing">
        <h2>Planejamentos em preparação.</h2>
        <p>Curadoria por Nacional e por estação. Enquanto isso, fale com um especialista.</p>
        <a class="bwt-btn bwt-btn--primary" href="${esc(emptyWa.href)}" target="_blank" rel="noopener">Falar com especialista</a>
      </div>`
    : `<div class="bwt-empty" data-bwt-empty="filter">
        <h2>Nenhum planejamento com esses filtros.</h2>
        <p>Ajuste o segmento ou fale com um especialista WallTravel.</p>
        <a class="bwt-btn bwt-btn--primary" href="${esc(emptyWa.href)}" target="_blank" rel="noopener">Falar com especialista</a>
      </div>`;

  const summaryHtml = catalogEmpty
    ? ""
    : `<p class="bwt-summary" data-bwt-summary>
        <strong data-bwt-count>${filtered.length}</strong>
        <span>${filtered.length === 1 ? "planejamento" : "planejamentos"} · filtro ${esc(activeSegLabel)}</span>
      </p>`;

  return `
    <section class="bwt-mast" data-bwt-chrome="mast">
      <div class="bwt-mast-veil" aria-hidden="true"></div>
      <div class="bwt-mast-inner">
        <h1 class="bwt-headline">${esc(copy.headline)}</h1>
        ${copy.lede ? `<p class="bwt-lede">${esc(copy.lede)}</p>` : ""}
      </div>
    </section>

    <div class="bwt-shell${catalogEmpty ? " bwt-shell--empty" : ""}" data-bwt-chrome="filters">
      <div class="bwt-breadcrumb">
        <a href="/">Início</a>
        <span>/</span>
        <span>${esc(BWT_BRAND_TITLE)}</span>
      </div>

      ${summaryHtml}

      <div class="bwt-filter-row" role="group" aria-label="Segmento">
        <a class="bwt-chip${!filters.segment ? " is-active" : ""}" href="${esc(base)}" data-bwt-seg="" aria-current="${!filters.segment ? "true" : "false"}">Todas</a>
        ${segmentChips.map(segChip).join("")}
      </div>

      ${
        filters.segment && filters.segment !== "nacional" && countries.length
          ? `<div class="bwt-filter-row bwt-filter-row--countries" role="group" aria-label="País">
              <span class="bwt-filter-label">País</span>
              ${countries.map(countryChip).join("")}
            </div>`
          : filters.segment === "nacional"
            ? `<p class="bwt-filter-note">Nacional: listagem direta, sem filtro por país.</p>`
            : ""
      }

      ${
        catalogEmpty
          ? ""
          : `<div class="bwt-search-row">
        <label class="visually-hidden" for="bwt-search">Buscar planejamento</label>
        <input type="search" id="bwt-search" class="bwt-search" placeholder="Buscar planejamento…" value="${esc(searchQuery)}" autocomplete="off" />
        <a class="bwt-link-quiet" href="/vitrine">Ver vitrine clássica</a>
      </div>`
      }
    </div>

    <div class="bwt-grid${cards ? "" : " bwt-grid--empty"}" data-bwt-grid>
      ${cards || emptyHtml}
    </div>

    <section class="bwt-bespoke">
      <div class="bwt-bespoke-inner">
        <h2>Quer ser avisado?</h2>
        <p>Um especialista WallTravel acompanha você quando os planejamentos Black WallTravel entrarem.</p>
        <a class="bwt-btn bwt-btn--primary" href="${esc(
          buildWhatsAppCTA({
            pageType: "BLACK",
            context: "black",
            placement: "black-bespoke",
            source: "black-bespoke",
          }).href,
        )}" target="_blank" rel="noopener">Falar com especialista</a>
      </div>
    </section>
  `;
}
