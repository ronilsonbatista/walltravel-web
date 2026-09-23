const ARROW_SVG =
  '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21 12l-8.15-8.15-1.42 1.42 5.43 5.43H5v2z"/></svg>';

function imgOnErrorAttr() {
  return `onerror="this.onerror=null; this.src='/images/vitrine/fallback.svg';"`;
}

/**
 * Home destinos card (editorial grid).
 */
export function renderDestinoCard(cat, esc, { href }) {
  const count = cat.packageCount || 0;
  const countLabel = `${count} ${count === 1 ? "Pacote" : "Pacotes"}`;
  const noImgClass = cat.image ? "" : " destino-card--no-image";
  const imgBlock = cat.image
    ? `<div class="destino-card-img-wrapper">
        <img src="${esc(cat.image)}" alt="${esc(cat.name)}" class="destino-card-img" loading="lazy" ${imgOnErrorAttr()}>
      </div>`
    : "";

  return `<a href="${esc(href)}" class="destino-card${noImgClass}">
    ${imgBlock}
    <div class="destino-card-content">
      <span class="category-card-meta">${countLabel}</span>
      <h3 class="destino-card-title">${esc(cat.name)}</h3>
      <p class="destino-card-desc">${esc(cat.description)}</p>
      <span class="category-card-cta">Ver pacotes ${ARROW_SVG}</span>
    </div>
  </a>`;
}

/**
 * Vitrine category card.
 */
export function renderVitrineCategoryCard(cat, esc) {
  const count = cat.packageCount || 0;
  const countLabel = `${count} ${count === 1 ? "experiência" : "experiências"}`;
  const noImgClass = cat.image ? "" : " category-card--no-image";
  const imgBlock = cat.image
    ? `<div class="category-card-img-wrapper">
        <img src="${esc(cat.image)}" alt="${esc(cat.name)}" class="category-card-img" loading="lazy" ${imgOnErrorAttr()}>
      </div>`
    : "";

  return `<a href="/vitrine/${esc(cat.slug)}" class="category-card${noImgClass}">
    ${imgBlock}
    <div class="category-card-content">
      <div>
        <span class="category-card-meta">${countLabel}</span>
        <h3 class="category-card-title">${esc(cat.name)}</h3>
        <p class="category-card-desc">${esc(cat.description)}</p>
      </div>
      <span class="category-card-cta">Ver experiências <svg viewBox="0 0 24 24"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21 12l-8.15-8.15-1.42 1.42 5.43 5.43H5v2z"/></svg></span>
    </div>
  </a>`;
}

export function renderCategoryHeroImage(cat, esc) {
  if (!cat.image) return "";
  return `<img src="${esc(cat.image)}" alt="${esc(cat.name)}" class="category-hero-img" ${imgOnErrorAttr()}>`;
}
