/**
 * Experience landing (/viagens/[slug]) — shared visual family with Groups.
 * Modules render only when data exists. Exact CMS/local copy; no invented fields.
 */
import {
  formatMoney,
  renderItineraryAccordion,
  renderIncludesExcludes,
  renderTravelHeroCarousel,
  renderTravelGallery,
} from "./group-render.js";
import { buildWhatsAppCTA } from "./whatsapp-cta.js";

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
  if (pkg.gallery?.length) links.push(["#group-gallery", "Galeria"]);
  if (pkg.itinerary?.length) links.push(["#group-itinerary", "Roteiro"]);
  if (pkg.included?.length || pkg.notIncluded?.length) links.push(["#exp-includes", "Incluso"]);
  if (pkg.priceFrom != null || pkg.importantNotes?.length) links.push(["#exp-investment", "Investimento"]);
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

function renderExperiencePricing(pkg, esc, priceUnitLabel) {
  const price = formatMoney(pkg.priceFrom, pkg.currency || "BRL");
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
      pkg.importantNotes?.length
        ? `<ul class="sidebar-notes-list experience-notes">${pkg.importantNotes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
        : ""
    }
  </section>`;
}

function packageWaHref(pkg, WA, placement, customMessage) {
  return buildWhatsAppCTA({
    number: WA,
    pageType: "VITRINE",
    entity: { name: pkg.name, slug: pkg.slug },
    customMessage: customMessage || pkg.ctaWhatsappMessage || undefined,
    placement,
    source: "experience",
  }).href;
}

function renderExperienceCta(pkg, esc, WA) {
  const primary = packageWaHref(pkg, WA, "product");
  const specialist = packageWaHref(
    pkg,
    WA,
    "specialist",
    `Olá! Gostaria de falar com um especialista sobre ${pkg.name} da WallTravel.`,
  );
  return `<section class="group-section group-form-section group-final-cta" id="exp-cta" data-reveal>
    <div class="group-final-cta-copy">
      <span class="section-tag">Contato</span>
      <h2 class="package-section-title">Planeje ${esc(pkg.name)}</h2>
      <p class="group-final-cta-lede">Fale com a equipe WallTravel pelo WhatsApp — roteiro sob medida a partir desta experiência.</p>
    </div>
    <div class="sidebar-ctas experience-cta-row">
      <a href="${primary}" target="_blank" rel="noopener" class="btn-primary" style="background-color:#25d366;border-color:#25d366;color:#fff;" data-storefront-cta="whatsapp">
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

  const itineraryGroup = {
    itinerary: (pkg.itinerary || []).map((d) => ({
      day: d.day,
      title: d.title,
      description: d.description || "",
      location: d.location || pkg.destination || "",
      highlights: d.highlights || [],
      overnight: d.overnight || null,
      dateLabel: d.dateLabel || null,
    })),
  };

  const includesGroup = {
    includes: pkg.included || pkg.includes || [],
    excludes: pkg.notIncluded || pkg.excludes || [],
  };

  return `<div class="group-detail experience-detail group-landing-ds" data-group-over-hero data-experience-landing>
    <div class="group-hero group-hero--fullbleed">
      ${renderTravelHeroCarousel(slides, esc)}
      <div class="group-hero-overlay group-hero-overlay--strong"></div>
      <div class="group-hero-content section-container">
        <div class="breadcrumb breadcrumb--light">
          <a href="/">Início</a><span class="breadcrumb-separator">/</span>
          <a href="/vitrine">Vitrine</a><span class="breadcrumb-separator">/</span>
          <a href="/vitrine/${esc(category.slug)}">${esc(category.name)}</a><span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">${esc(pkg.name)}</span>
        </div>
        <h1 data-reveal>${esc(pkg.name)}</h1>
        <p class="group-hero-sub" data-reveal>
          ${esc([pkg.destination, pkg.duration].filter(Boolean).join(" · "))}
        </p>
        ${packageHighlights(pkg, esc)}
      </div>
    </div>
    ${experienceSubnav(pkg)}
    <div class="group-detail-body">
      <div class="section-container">
        ${renderAbout(pkg, esc)}
      </div>
      ${pkg.gallery?.length ? renderTravelGallery(pkg.gallery, pkg.name, esc) : ""}
      <div class="section-container">
        ${pkg.itinerary?.length ? renderItineraryAccordion(itineraryGroup, esc) : ""}
        <div id="exp-includes">
          ${renderIncludesExcludes(includesGroup, esc)}
        </div>
        ${renderExperiencePricing(pkg, esc, priceUnitLabel)}
        ${renderExperienceCta(pkg, esc, WA)}
      </div>
    </div>
    <div class="sticky-bottom-bar group-sticky-bar">
      <div class="sticky-bottom-price-box">
        ${price ? `<span class="sticky-bottom-price-label">A partir de</span><span class="sticky-bottom-price">${esc(price)}</span>` : `<span class="sticky-bottom-price">Fale conosco</span>`}
      </div>
      <a href="${waSticky}" target="_blank" rel="noopener" class="sticky-bottom-btn" data-storefront-cta="whatsapp">${esc(pkg.ctaLabel || "WhatsApp")}</a>
    </div>
  </div>`;
}
