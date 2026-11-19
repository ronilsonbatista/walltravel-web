/**
 * Experience landing (/viagens/[slug]) — TravelDetailShell + shared immersive primitives.
 * Modules render only when data exists. Exact CMS/local copy; no invented fields.
 * When the product has a displayable day list (travel_product_days), the same
 * group "Sua jornada" explorer is shown here. Fewer than two public days stays hidden.
 */
import {
  formatMoney,
  JourneyTimeline,
  renderIncludesExcludes,
  renderTravelHeroCarousel,
  renderTravelGallery,
} from "./group-render.js";
import { isDisplayableItinerary } from "./platform-api.js";
import { buildWhatsAppCTA } from "./whatsapp-cta.js";
import {
  TravelDetailShell,
  ImmersiveHero,
  StickyConversionCTA,
} from "./immersive/primitives.js";
import { formatFixedDateRange, hasFixedDates } from "./fixed-dates.js";

function heroSlidesFromPackage(pkg) {
  const imgs = [];
  if (pkg.image) imgs.push(pkg.image);
  for (const g of pkg.gallery || []) {
    if (g && !imgs.includes(g)) imgs.push(g);
  }
  return imgs.slice(0, 8);
}

function packageHighlights(pkg, esc) {
  const raw = pkg.highlights || [];
  if (!raw.length) return "";
  const normalized = raw.map((h, i) => {
    if (h && typeof h === "object") {
      return {
        value: h.value || String(i + 1).padStart(2, "0"),
        label: h.label || "",
      };
    }
    return { value: String(i + 1).padStart(2, "0"), label: String(h) };
  });
  return `<div class="group-highlights" data-reveal>
    ${normalized
      .map(
        (h, i) => `
      <div class="group-highlight-item" data-reveal data-reveal-delay="${i * 70}">
        <span class="group-highlight-value">${esc(h.value)}</span>
        <span class="group-highlight-label">${esc(h.label)}</span>
      </div>`,
      )
      .join("")}
  </div>`;
}

function experienceSubnav(pkg) {
  const links = [];
  if (pkg.description) links.push(["#exp-about", "Sobre"]);
  if (isDisplayableItinerary(pkg.itinerary)) {
    links.push(["#group-itinerary", "Roteiro"]);
  }
  if (pkg.gallery?.length) links.push(["#group-gallery", "Galeria"]);
  if (pkg.included?.length || pkg.notIncluded?.length) links.push(["#exp-includes", "Incluso"]);
  if (pkg.priceFrom != null || pkg.importantNotes?.length || pkg.originPrices?.length) {
    links.push(["#exp-investment", "Investimento"]);
  }
  links.push(["#exp-cta", "Contato"]);
  if (links.length < 3) return "";
  return `<nav class="group-subnav" data-group-subnav aria-label="Seções da experiência">
    <div class="group-subnav-inner">
      ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
    </div>
  </nav>
  <div class="group-scroll-progress" data-group-scroll-progress aria-hidden="true"><span></span></div>`;
}

function renderAbout(pkg, esc) {
  if (!pkg.description) return "";
  return `<section class="group-section" id="exp-about" data-reveal>
    <span class="section-tag">Experiência</span>
    <h2 class="package-section-title">Sobre a viagem</h2>
    <p class="group-editorial group-editorial--lead">${esc(pkg.description)}</p>
    ${
      pkg.shortDescription && pkg.shortDescription !== pkg.description
        ? `<p class="group-editorial">${esc(pkg.shortDescription)}</p>`
        : ""
    }
  </section>`;
}

/**
 * Drop investment notes that already appear as fixed dates or origin+PIX rows
 * (avoids repeating PIX / city prices already listed above).
 */
export function filterExperienceInvestmentNotes(notes, { dateLabel = "", origins = [] } = {}) {
  const list = Array.isArray(notes) ? notes : [];
  const originPlaces = origins
    .map((row) => String(row?.label || row?.uf || "").trim().toLowerCase())
    .filter(Boolean);
  const hasOriginPixRows = origins.some((row) =>
    /\bpix\b/i.test(String(row?.paymentNote || "")),
  );

  return list.filter((raw) => {
    const note = String(raw || "").trim();
    if (!note) return false;
    const lower = note.toLowerCase();

    if (dateLabel && /^datas\s+fixas\b/i.test(note)) return false;

    if (hasOriginPixRows) {
      const mentionsOrigin = originPlaces.some((place) => {
        const token = place.split(/\s+/)[0];
        return token && lower.includes(token);
      });
      if (mentionsOrigin && /\bpix\b/i.test(lower)) return false;
      if (/a vitrine mostra o valor a partir/i.test(lower)) return false;
    }

    return true;
  });
}

const INCLUDE_LINE_RULES = [
  { re: /passagem|voos?\b|a[eé]reo/i, label: "Voos" },
  { re: /caf[eé]/i, label: "Café da manhã" },
  { re: /traslado|transfer/i, label: "Traslado" },
];

const CITY_STOP = /^(hotel|hotéis|hoteis|casa|quarto|dia|dias|até|ate|noite|noites|brasil|pix|são|rio|belo)$/i;

function pushCity(cities, name) {
  const city = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!city || CITY_STOP.test(city) || cities.includes(city)) return;
  cities.push(city);
}

function canonicalCity(name) {
  const raw = String(name || "").trim().replace(/\s+/g, " ");
  if (/^são paulo$/i.test(raw)) return "São Paulo";
  if (/^rio de janeiro$/i.test(raw)) return "Rio de Janeiro";
  if (/^belo horizonte$/i.test(raw)) return "Belo Horizonte";
  return raw;
}

function citiesFromIncludes(items) {
  const stayed = [];
  const other = [];
  for (const item of items) {
    for (const match of item.matchAll(/\bem\s+(Rio de Janeiro|São Paulo|Belo Horizonte)/gi)) {
      pushCity(stayed, canonicalCity(match[1]));
    }
    for (const match of item.matchAll(/\bem\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}'’-]{2,})/gu)) {
      pushCity(stayed, match[1]);
    }
    for (const match of item.matchAll(/\bde\s+(Rio de Janeiro|São Paulo|Belo Horizonte)/gi)) {
      pushCity(other, canonicalCity(match[1]));
    }
    for (const match of item.matchAll(/\(([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^)]{1,32})\)/g)) {
      const inner = match[1].trim().replace(/\s+/g, " ");
      if (/^(são paulo|rio de janeiro|belo horizonte)$/i.test(inner)) {
        pushCity(other, canonicalCity(inner));
      } else if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}'’-]{2,}$/u.test(inner)) {
        pushCity(other, inner);
      }
    }
  }
  return [...stayed, ...other.filter((city) => !stayed.includes(city))];
}

function shortenInclude(text) {
  const cut = String(text).split(/[:(]/)[0].trim();
  if (cut.length <= 32) return cut;
  const words = cut.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 32 ? words.slice(0, 32).trim() : words;
}

/**
 * Three or four short lines from the product's own includes.
 * Prefers flights, breakfast, transfer, and one city already named there.
 */
export function shortIncludedLines(included) {
  const items = (Array.isArray(included) ? included : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const lines = [];
  const used = new Set();
  for (const rule of INCLUDE_LINE_RULES) {
    const idx = items.findIndex((item) => rule.re.test(item));
    if (idx >= 0 && !lines.includes(rule.label)) {
      lines.push(rule.label);
      used.add(idx);
    }
  }
  const city = citiesFromIncludes(items)[0];
  if (city && lines.length < 4 && !lines.includes(city)) lines.push(city);
  if (lines.length < 3) {
    for (let i = 0; i < items.length && lines.length < 3; i += 1) {
      if (used.has(i)) continue;
      const short = shortenInclude(items[i]);
      if (!short || lines.includes(short)) continue;
      lines.push(short);
      used.add(i);
    }
  }
  return lines.slice(0, 4);
}

/**
 * One short installment line when a note already states one.
 * Never returns PDF, profit, or "valor exibido" copy.
 */
export function experienceInstallmentLine(notes) {
  const list = (Array.isArray(notes) ? notes : [])
    .map((note) => String(note || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const note of list) {
    const vezes = note.match(/(\d+)\s*x\s+de\s+(R\$\s*[\d.]+,\d{2})/i);
    if (vezes) {
      const money = vezes[2].replace(/\s+/g, " ").replace(/R\$\s*/, "R$ ");
      return `${vezes[1]}x de ${money}`;
    }
  }
  for (const note of list) {
    const semJurosX = note.match(/em até\s+(\d+)\s*x\s+sem juros/i);
    if (semJurosX) return `Em até ${semJurosX[1]}x sem juros`;
    const semJurosP = note.match(/em até\s+(\d+)\s+parcelas?\s+sem juros/i);
    if (semJurosP) return `Em até ${semJurosP[1]} parcelas sem juros`;
    const ateX = note.match(/em até\s+(\d+)\s*x\b/i);
    if (ateX) return `Em até ${ateX[1]}x`;
    const ateP = note.match(/em até\s+(\d+)\s+parcelas?\b/i);
    if (ateP) return `Em até ${ateP[1]} parcelas`;
  }
  return "";
}

function renderExperienceOffer(pkg, esc, price, priceUnitLabel, waHref) {
  const installment = experienceInstallmentLine(pkg.importantNotes);
  const lines = shortIncludedLines(pkg.included || pkg.includes || []);
  const priceHtml = price
    ? `<p class="experience-price">${esc(price)}</p>
       <p class="experience-price-unit">${esc(priceUnitLabel)}</p>`
    : `<p class="experience-price">Sob consulta</p>`;
  return `<aside class="experience-offer" data-experience-offer>
    ${priceHtml}
    ${installment ? `<p class="experience-installment">${esc(installment)}</p>` : ""}
    ${
      lines.length
        ? `<ul class="experience-offer-includes">${lines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>`
        : ""
    }
    <div class="sidebar-ctas experience-offer-cta">
      <a href="${waHref}" target="_blank" rel="noopener" class="btn-primary" data-storefront-cta="specialist" data-specialist-cta>Falar com especialista</a>
    </div>
  </aside>`;
}

function renderExperiencePricing(pkg, esc, priceUnitLabel) {
  const price = formatMoney(pkg.priceFrom, pkg.currency || "BRL");
  const dateLabel = hasFixedDates(pkg)
    ? formatFixedDateRange(pkg.fixedStartDate, pkg.fixedEndDate)
    : "";
  const origins = Array.isArray(pkg.originPrices) ? pkg.originPrices : [];
  const originRows = origins
    .filter((row) => row && row.priceFrom != null)
    .map((row) => {
      const money = formatMoney(row.priceFrom, pkg.currency || "BRL");
      const place = row.label || row.uf || "";
      const note = row.paymentNote ? ` (${row.paymentNote})` : "";
      return `<li><strong>${esc(place)}</strong>: ${esc(money || "")} por pessoa${esc(note)}</li>`;
    })
    .join("");
  const notes = filterExperienceInvestmentNotes(pkg.importantNotes, {
    dateLabel,
    origins,
  });
  return `<section class="group-section experience-investment" id="exp-investment" data-reveal>
    <span class="section-tag">Investimento</span>
    <h2 class="package-section-title">A partir de</h2>
    ${
      price
        ? `<p class="experience-price">${esc(price)}</p>
           <p class="experience-price-unit">${esc(priceUnitLabel)}</p>`
        : `<p class="experience-price">Sob consulta</p>`
    }
    ${
      dateLabel
        ? `<p class="experience-fixed-dates">Datas fixas: ${esc(dateLabel)}</p>`
        : ""
    }
    ${
      originRows
        ? `<p class="experience-origins-lede">Valores por cidade de saída no Brasil:</p>
           <ul class="sidebar-notes-list experience-origin-prices">${originRows}</ul>`
        : ""
    }
    ${
      notes.length
        ? `<ul class="sidebar-notes-list experience-notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
        : ""
    }
  </section>`;
}

function packageWaHref(pkg, WA, placement) {
  return buildWhatsAppCTA({
    number: WA,
    pageType: "VITRINE",
    context: "vitrine",
    entity: { name: pkg.name, slug: pkg.slug },
    placement,
    source: "experience",
  }).href;
}

function renderExperienceCta(pkg, esc, WA) {
  const primary = packageWaHref(pkg, WA, "product");
  const specialist = packageWaHref(pkg, WA, "specialist");
  return `<section class="group-section group-form-section group-final-cta" id="exp-cta" data-reveal>
    <div class="group-final-cta-copy">
      <span class="section-tag">Contato</span>
      <h2 class="package-section-title">Planeje ${esc(pkg.name)}</h2>
      <p class="group-final-cta-lede">Fale com a equipe WallTravel pelo WhatsApp. Roteiro sob medida a partir desta experiência.</p>
    </div>
    <div class="sidebar-ctas experience-cta-row">
      <a href="${primary}" target="_blank" rel="noopener" class="btn-primary" data-storefront-cta="whatsapp">
        ${esc(pkg.ctaLabel || "Planejar minha viagem")}
      </a>
      <a href="${specialist}" target="_blank" rel="noopener" class="btn-outline" data-storefront-cta="specialist">
        Falar com especialista
      </a>
    </div>
  </section>`;
}

/**
 * @param {object} pkg — storefront package/experience shape
 * @param {object} category — { name, slug }
 */
export function renderExperienceDetailPage(pkg, category, esc, WA) {
  const slides = heroSlidesFromPackage(pkg);
  const price = formatMoney(pkg.priceFrom, pkg.currency || "BRL");
  const priceUnitLabel =
    pkg.priceUnit === "PER_COUPLE"
      ? "Por casal"
      : pkg.priceUnit === "TOTAL"
        ? "Valor total"
        : "Por pessoa em acomodação dupla";
  const waSticky = packageWaHref(pkg, WA, "sticky");

  const includesGroup = {
    includes: pkg.included || pkg.includes || [],
    excludes: pkg.notIncluded || pkg.excludes || [],
  };

  const introHtml = "";

  const highlights = packageHighlights(pkg, esc);
  const dateLabel = hasFixedDates(pkg)
    ? formatFixedDateRange(pkg.fixedStartDate, pkg.fixedEndDate)
    : "";
  const heroMeta = [pkg.destination, pkg.duration, dateLabel ? `Datas fixas ${dateLabel}` : ""]
    .filter(Boolean)
    .join(" · ");
  const heroHtml = ImmersiveHero({
    className: "group-hero--gallery",
    carouselHtml: renderTravelHeroCarousel(slides, esc),
    overlay: "strong",
    contentHtml: "",
  });

  const includesHtml = renderIncludesExcludes(includesGroup, esc);
  // Empty facts strip is a white band under the hero. Only mount it when there are highlights.
  const factsHtml = highlights
    ? `<div class="group-facts-after-hero">${highlights}</div>`
    : "";
  const offerHtml = renderExperienceOffer(
    pkg,
    esc,
    price,
    priceUnitLabel,
    packageWaHref(pkg, WA, "specialist"),
  );
  const bodyHtml = `
      <div class="section-container">
        <div class="breadcrumb">
          <a href="/">Início</a><span class="breadcrumb-separator">/</span>
          <a href="/vitrine">Vitrine</a><span class="breadcrumb-separator">/</span>
          <a href="/vitrine/${esc(category.slug)}">${esc(category.name)}</a><span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">${esc(pkg.name)}</span>
        </div>
        <div class="experience-detail-layout">
          <header class="experience-detail-heading">
            <h1>${esc(pkg.name)}</h1>
            ${heroMeta ? `<p class="experience-detail-meta">${esc(heroMeta)}</p>` : ""}
          </header>
          ${offerHtml}
          <div class="experience-detail-main">
            ${factsHtml}
            ${renderAbout(pkg, esc)}
            ${JourneyTimeline({ itinerary: pkg.itinerary, gallery: pkg.gallery }, esc)}
            ${pkg.gallery?.length ? renderTravelGallery(pkg.gallery, pkg.name, esc) : ""}
            ${includesHtml ? `<div id="exp-includes">${includesHtml}</div>` : ""}
            ${renderExperiencePricing(pkg, esc, priceUnitLabel)}
            ${renderExperienceCta(pkg, esc, WA)}
          </div>
        </div>
      </div>`;

  const stickyHtml = StickyConversionCTA({
    priceHtml: price
      ? `<span class="sticky-bottom-price">${esc(price)}</span>`
      : `<span class="sticky-bottom-price">Sob consulta</span>`,
    ctaHref: waSticky,
    ctaLabel: "Falar com especialista",
    className: "experience-sticky-cta",
  });

  return TravelDetailShell({
    introHtml,
    heroHtml,
    subnavHtml: experienceSubnav(pkg),
    bodyHtml,
    stickyHtml,
  });
}
