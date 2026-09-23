function formatMoney(priceFrom, currency = "BRL") {
  if (priceFrom == null || priceFrom === "") return null;
  const n = Number(String(priceFrom).replace(",", "."));
  if (!Number.isFinite(n)) return String(priceFrom);
  const sym = currency === "USD" ? "US$" : currency === "EUR" ? "€" : "R$";
  return `${sym} ${n.toLocaleString("pt-BR")}`;
}

function waLink(WA, message) {
  return `https://wa.me/${WA}?text=${encodeURIComponent(message)}`;
}

export function buildGroupWhatsappMessage(group, formData = {}) {
  const base =
    group.ctaWhatsappMessage ||
    `Olá! Gostaria de saber mais sobre o grupo ${group.name} da WallTravel.`;
  const parts = [base];
  if (formData.name) parts.push(`Nome: ${formData.name}`);
  if (formData.whatsapp) parts.push(`WhatsApp: ${formData.whatsapp}`);
  if (formData.travelers) parts.push(`Viajantes: ${formData.travelers}`);
  if (formData.notes) parts.push(`Mensagem: ${formData.notes}`);
  return parts.join("\n");
}

function heroGallery(group) {
  const imgs = [];
  if (group.coverImageUrl) imgs.push(group.coverImageUrl);
  for (const g of group.gallery || []) {
    if (g && !imgs.includes(g)) imgs.push(g);
  }
  return imgs.slice(0, 8);
}

function renderHighlights(group, esc) {
  if (!group.highlights?.length) return "";
  return `<div class="group-highlights" data-reveal>
    ${group.highlights
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

export function renderWhyGroup(group, esc) {
  if (!group.whyGroup?.length) return "";
  return `<section class="group-section" data-reveal>
    <span class="section-tag">Por que em grupo</span>
    <h2 class="package-section-title">Por que viajar com a WallTravel</h2>
    <div class="group-why-grid">
      ${group.whyGroup
        .map(
          (w, i) => `
        <div class="group-why-card" data-reveal data-reveal-delay="${(i % 4) * 60}">
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.description)}</p>
        </div>`,
        )
        .join("")}
    </div>
  </section>`;
}

export function renderRoute(group, esc) {
  if (!group.routeStops?.length) return "";
  const hotels = group.routeStops.filter((s) => s.hotel);
  return `<section class="group-section" data-reveal>
    <span class="section-tag">Roteiro</span>
    <h2 class="package-section-title">Paradas da viagem</h2>
    <ol class="group-route-timeline">
      ${group.routeStops
        .map(
          (s, i) => `
        <li class="group-route-item" data-reveal data-reveal-delay="${i * 50}">
          <span class="group-route-marker" aria-hidden="true">${i + 1}</span>
          <div class="group-route-copy">
            <div class="group-route-name">${esc(s.name)}</div>
            ${s.nights ? `<div class="group-route-meta">${esc(s.nights)}</div>` : ""}
            ${s.transportNext ? `<div class="group-route-transport">${esc(s.transportNext)}</div>` : ""}
          </div>
        </li>`,
        )
        .join("")}
    </ol>
    ${
      hotels.length
        ? `<div class="group-hotel-grid">
      ${hotels
        .map(
          (s) => `
        <article class="group-hotel-card" data-reveal>
          <span class="group-hotel-place">${esc(s.name)}</span>
          <h3>${esc(s.hotel)}</h3>
          ${s.nights ? `<p>${esc(s.nights)}</p>` : ""}
        </article>`,
        )
        .join("")}
    </div>`
        : ""
    }
  </section>`;
}

export function renderItineraryAccordion(group, esc) {
  if (!group.itinerary?.length) return "";
  return `<section class="group-section" data-reveal>
    <span class="section-tag">Dia a dia</span>
    <h2 class="package-section-title">Itinerário completo</h2>
    <div class="group-itinerary-progress" data-itinerary-progress aria-hidden="true"></div>
    <div class="group-itinerary-scroll">
      ${group.itinerary
        .map(
          (day) => `
        <article class="group-itinerary-step" data-itinerary-step data-reveal>
          <div class="group-itinerary-step-head">
            <span class="group-itinerary-day-num">Dia ${esc(day.day)}</span>
            ${day.dateLabel ? `<span class="group-itinerary-date">${esc(day.dateLabel)}</span>` : ""}
          </div>
          <h3 class="group-itinerary-day-title">${esc(day.title)}</h3>
          ${day.location ? `<p class="group-itinerary-location">${esc(day.location)}</p>` : ""}
          <p>${esc(day.description)}</p>
          ${
            day.highlights?.length
              ? `<ul class="group-itinerary-highlights">${day.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
              : ""
          }
          ${day.overnight ? `<p class="group-itinerary-overnight">${esc(day.overnight)}</p>` : ""}
        </article>`,
        )
        .join("")}
    </div>
    <div class="group-itinerary-accordion">
      ${group.itinerary
        .map(
          (day, i) => `
        <details class="group-itinerary-day" ${i === 0 ? "open" : ""}>
          <summary>
            <span class="group-itinerary-day-num">Dia ${esc(day.day)}</span>
            <span class="group-itinerary-day-title">${esc(day.title)}</span>
            ${day.dateLabel ? `<span class="group-itinerary-date">${esc(day.dateLabel)}</span>` : ""}
          </summary>
          <div class="group-itinerary-body">
            ${day.location ? `<p class="group-itinerary-location">${esc(day.location)}</p>` : ""}
            <p>${esc(day.description)}</p>
            ${
              day.highlights?.length
                ? `<ul class="group-itinerary-highlights">${day.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
                : ""
            }
            ${day.overnight ? `<p class="group-itinerary-overnight">${esc(day.overnight)}</p>` : ""}
          </div>
        </details>`,
        )
        .join("")}
    </div>
  </section>`;
}

export function renderInvestment(group, esc) {
  if (!group.investmentOptions?.length && !group.priceFrom) return "";
  const options = group.investmentOptions?.length
    ? group.investmentOptions
    : [
        {
          key: "default",
          title: "Investimento",
          description: group.priceNote,
          price: group.priceFrom,
          priceNote: null,
        },
      ];

  return `<section class="group-section" id="group-investment" data-reveal>
    <span class="section-tag">Investimento</span>
    <h2 class="package-section-title">Valores e formas de pagamento</h2>
    <div class="group-investment-grid">
      ${options
        .map((opt) => {
          const price = formatMoney(opt.price, group.currency);
          return `<div class="group-investment-card" data-reveal>
            <h3>${esc(opt.title)}</h3>
            ${opt.description ? `<p>${esc(opt.description)}</p>` : ""}
            <div class="group-investment-price">${price ? esc(price) : "Sob consulta"}</div>
            ${opt.priceNote ? `<p class="group-investment-note">${esc(opt.priceNote)}</p>` : ""}
          </div>`;
        })
        .join("")}
    </div>
    ${
      group.paymentMethods?.length
        ? `<div class="group-payment-methods" data-reveal>
        <h3 class="group-subheading">Formas de pagamento</h3>
        <ul>${group.paymentMethods.map((p) => `<li><strong>${esc(p.title)}</strong>${p.description ? ` — ${esc(p.description)}` : ""}</li>`).join("")}</ul>
      </div>`
        : ""
    }
    ${group.priceNote && !group.investmentOptions?.length ? `<p class="group-price-note">${esc(group.priceNote)}</p>` : ""}
  </section>`;
}

export function renderFaq(group, esc) {
  if (!group.faq?.length) return "";
  return `<section class="group-section" data-reveal>
    <span class="section-tag">FAQ</span>
    <h2 class="package-section-title">Perguntas frequentes</h2>
    <div class="group-faq-list">
      ${group.faq
        .map(
          (item) => `
        <details class="group-faq-item">
          <summary>${esc(item.question)}</summary>
          <p>${esc(item.answer)}</p>
        </details>`,
        )
        .join("")}
    </div>
  </section>`;
}

export function renderLeader(group, esc) {
  const leader = group.leader;
  if (!leader?.name) return "";
  return `<section class="group-section group-leader-section" data-reveal>
    <span class="section-tag">Liderança</span>
    <h2 class="package-section-title">Líder da expedição</h2>
    <div class="group-leader-card">
      ${
        leader.photoUrl
          ? `<img src="${esc(leader.photoUrl)}" alt="${esc(leader.name)}" class="group-leader-photo" loading="lazy" onerror="this.style.display='none'">`
          : ""
      }
      <div>
        <h3>${esc(leader.name)}</h3>
        ${leader.title ? `<p class="group-leader-title">${esc(leader.title)}</p>` : ""}
        ${leader.bio ? `<p class="group-leader-bio">${esc(leader.bio)}</p>` : ""}
        ${leader.note ? `<p class="group-leader-note">${esc(leader.note)}</p>` : ""}
      </div>
    </div>
  </section>`;
}

export function renderGroupForm(group, esc, WA) {
  const fields = group.formFields?.length
    ? group.formFields
    : [
        { key: "name", label: "Nome", required: true },
        { key: "whatsapp", label: "WhatsApp", required: true },
      ];

  return `<section class="group-section group-form-section" id="group-form" data-reveal>
    <span class="section-tag">Contato</span>
    <h2 class="package-section-title">${group.comingSoon ? "Quero ser avisado" : "Fale com a equipe"}</h2>
    <form class="group-lead-form" data-group-slug="${esc(group.slug)}" data-wa-message="${esc(group.ctaWhatsappMessage || "")}" novalidate>
      ${fields
        .map(
          (f) => `
        <label class="group-form-field">
          <span>${esc(f.label)}${f.required ? " *" : ""}</span>
          ${
            f.key === "notes"
              ? `<textarea name="${esc(f.key)}" rows="3" ${f.required ? "required" : ""}></textarea>`
              : `<input type="text" name="${esc(f.key)}" ${f.required ? "required" : ""} autocomplete="${f.key === "name" ? "name" : f.key === "whatsapp" ? "tel" : "off"}">`
          }
        </label>`,
        )
        .join("")}
      <button type="submit" class="btn-primary">${esc(group.ctaLabel || "Enviar pelo WhatsApp")}</button>
    </form>
    <p class="group-form-hint">Ao enviar, você será direcionado ao WhatsApp com sua mensagem.</p>
  </section>`;
}

export function renderIncludesExcludes(group, esc) {
  if (!group.includes?.length && !group.excludes?.length) return "";
  return `<section class="group-section" data-reveal>
    <h2 class="package-section-title">O que está incluso</h2>
    <div class="included-grid">
      <div>
        <h3 class="group-subheading">Incluso</h3>
        <ul class="included-list">${(group.includes || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>
      <div>
        <h3 class="group-subheading">Não incluso</h3>
        <ul class="not-included-list">${(group.excludes || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>
    </div>
  </section>`;
}

export function renderBomSaber(group, esc) {
  if (!group.bomSaber?.length) return "";
  return `<section class="group-section" data-reveal>
    <span class="section-tag">Bom saber</span>
    <h2 class="package-section-title">Informações importantes</h2>
    <ol class="group-bom-saber-list">
      ${group.bomSaber.map((item) => `<li><strong>${esc(item.title || "")}</strong> ${esc(item.text)}</li>`).join("")}
    </ol>
  </section>`;
}

export function renderOptionals(group, esc) {
  if (!group.optionals?.length) return "";
  return `<section class="group-section" data-reveal>
    <h2 class="package-section-title">Opcionais</h2>
    <ul class="group-optionals-list">
      ${group.optionals.map((o) => `<li><strong>${esc(o.title)}</strong>${o.description ? ` — ${esc(o.description)}` : ""}</li>`).join("")}
    </ul>
  </section>`;
}

function renderGalleryMosaic(group, esc) {
  if (!group.gallery?.length) return "";
  return `<section class="group-section" data-reveal>
    <span class="section-tag">Galeria</span>
    <h2 class="package-section-title">Atmosfera da viagem</h2>
    <div class="group-gallery-mosaic">
      ${group.gallery
        .map(
          (img, i) => `
        <button type="button" class="group-gallery-item ${i === 0 ? "group-gallery-item--wide" : ""}" data-lightbox-src="${esc(img)}" data-lightbox-alt="${esc(group.name)}" data-reveal data-reveal-delay="${(i % 5) * 40}">
          <img src="${esc(img)}" alt="" loading="lazy" onerror="this.parentElement.remove()">
        </button>`,
        )
        .join("")}
    </div>
  </section>`;
}

export function renderGroupsCatalog(groups, esc) {
  return `<div class="groups-page group-landing-ds">
    <section class="groups-intro">
      <div class="groups-intro-copy" data-reveal>
        <div class="breadcrumb">
          <a href="/">Início</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">Viagens em grupo</span>
        </div>
        <span class="category-meta-info">Expedições WallTravel</span>
        <h1 class="section-title">Viagens em grupo</h1>
        <p class="groups-header-desc">Roteiros em grupo pequeno, com curadoria, logística completa e líder WallTravel quando indicado. Cada expedição tem sua própria página — abertas ou em breve.</p>
      </div>
    </section>
    <div class="groups-catalog-grid">
      ${groups
        .map((g, i) => {
          const price = formatMoney(g.priceFrom, g.currency);
          const badge = g.comingSoon
            ? '<span class="group-card-badge">Em breve</span>'
            : g.durationLabel
              ? `<span class="group-card-badge group-card-badge--live">${esc(g.durationLabel)}</span>`
              : "";
          const imgBlock = g.coverImageUrl
            ? `<div class="group-card-img-wrap"><img src="${esc(g.coverImageUrl)}" alt="${esc(g.name)}" loading="${i === 0 ? "eager" : "lazy"}" ${i === 0 ? 'fetchpriority="high"' : ""} onerror="this.parentElement.remove()"></div>`
            : "";
          return `<a href="/grupos/${esc(g.slug)}" class="group-card" data-reveal data-reveal-delay="${i * 80}">
            ${imgBlock}
            <div class="group-card-body">
              ${badge}
              <h2>${esc(g.name)}</h2>
              ${g.shortDescription || g.destinationLabel ? `<p>${esc(g.shortDescription || g.destinationLabel)}</p>` : ""}
              ${g.destinationLabel && g.shortDescription ? `<p class="group-card-meta">${esc(g.destinationLabel)}</p>` : ""}
              ${price && !g.comingSoon ? `<p class="group-card-price">A partir de ${esc(price)}</p>` : ""}
              <span class="category-card-cta">${g.comingSoon ? "Quero ser avisado" : "Ver detalhes"}</span>
            </div>
          </a>`;
        })
        .join("")}
    </div>
  </div>`;
}

function renderHeroCarousel(group, esc, slides) {
  if (!slides.length) {
    return `<div class="group-hero-fallback"></div>`;
  }
  return `
    <div class="group-hero-carousel" data-group-hero-carousel data-parallax="0.06">
      ${slides
        .map(
          (src, i) => `
        <div class="group-hero-slide ${i === 0 ? "is-active" : ""}">
          <img src="${esc(src)}" alt="" class="group-hero-img" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} onerror="this.closest('.group-hero-slide')?.remove()">
        </div>`,
        )
        .join("")}
      ${
        slides.length > 1
          ? `<div class="group-hero-dots" role="tablist" aria-label="Fotos do hero">
          ${slides.map((_, i) => `<button type="button" class="group-hero-dot" data-hero-dot="${i}" aria-label="Foto ${i + 1}"></button>`).join("")}
        </div>`
          : ""
      }
    </div>`;
}

export function renderGroupDetailPage(group, esc, WA) {
  const price = formatMoney(group.priceFrom, group.currency);
  const slides = heroGallery(group);
  const waMsg = group.ctaWhatsappMessage || `Olá! Quero saber mais sobre ${group.name}.`;

  if (group.comingSoon) {
    return `<div class="group-detail group-detail--teaser group-landing-ds" data-group-over-hero>
      <div class="group-hero group-hero--teaser">
        ${renderHeroCarousel(group, esc, slides.slice(0, 5))}
        <div class="group-hero-overlay"></div>
        <div class="group-hero-content">
          <div class="breadcrumb breadcrumb--light">
            <a href="/">Início</a><span class="breadcrumb-separator">/</span>
            <a href="/grupos">Viagens em grupo</a><span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-active">${esc(group.name)}</span>
          </div>
          <span class="group-card-badge">Em breve</span>
          <h1 data-reveal>${esc(group.name)}</h1>
          ${group.shortDescription ? `<p data-reveal>${esc(group.shortDescription)}</p>` : ""}
          ${group.destinationLabel ? `<p class="group-hero-dest" data-reveal>${esc(group.destinationLabel)}</p>` : ""}
        </div>
      </div>
      <div class="group-detail-body section-container">
        ${group.editorial ? `<section class="group-section" data-reveal><p class="group-editorial">${esc(group.editorial)}</p></section>` : ""}
        ${renderGalleryMosaic({ ...group, gallery: (group.gallery || []).slice(0, 5) }, esc)}
        <section class="group-section group-coming-banner" data-reveal>
          <span class="section-tag">Em breve</span>
          <h2 class="package-section-title">Estamos preparando esta expedição</h2>
          <p>Datas, investimento e roteiro serão publicados quando o grupo abrir — sem inventar o que ainda não está fechado.</p>
        </section>
        ${renderGroupForm(group, esc, WA)}
        <a href="${waLink(WA, waMsg)}" target="_blank" rel="noopener" class="btn-outline group-specialist-link">Falar com especialista</a>
      </div>
      <div class="sticky-bottom-bar group-sticky-bar">
        <div class="sticky-bottom-price-box">
          <span class="sticky-bottom-price">Em breve</span>
        </div>
        <a href="#group-form" class="sticky-bottom-btn">${esc(group.ctaLabel || "Quero ser avisado")}</a>
      </div>
    </div>`;
  }

  return `<div class="group-detail group-landing-ds" data-group-over-hero>
    <div class="group-hero">
      ${renderHeroCarousel(group, esc, slides)}
      <div class="group-hero-overlay"></div>
      <div class="group-hero-content">
        <div class="breadcrumb breadcrumb--light">
          <a href="/">Início</a><span class="breadcrumb-separator">/</span>
          <a href="/grupos">Viagens em grupo</a><span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">${esc(group.name)}</span>
        </div>
        <h1 data-reveal>${esc(group.name)}</h1>
        ${group.description || group.shortDescription ? `<p class="group-hero-sub" data-reveal>${esc(group.description || group.shortDescription)}</p>` : ""}
        ${renderHighlights(group, esc)}
      </div>
    </div>
    <div class="group-detail-body section-container">
      ${group.editorial ? `<section class="group-section" data-reveal><p class="group-editorial">${esc(group.editorial)}</p></section>` : ""}
      ${renderWhyGroup(group, esc)}
      ${renderRoute(group, esc)}
      ${renderGalleryMosaic(group, esc)}
      ${renderItineraryAccordion(group, esc)}
      ${renderInvestment(group, esc)}
      ${renderIncludesExcludes(group, esc)}
      ${renderOptionals(group, esc)}
      ${renderBomSaber(group, esc)}
      ${renderFaq(group, esc)}
      ${renderLeader(group, esc)}
      ${renderGroupForm(group, esc, WA)}
    </div>
    <div class="sticky-bottom-bar group-sticky-bar">
      <div class="sticky-bottom-price-box">
        ${price ? `<span class="sticky-bottom-price-label">A partir de</span><span class="sticky-bottom-price">${esc(price)}</span>` : `<span class="sticky-bottom-price">Fale conosco</span>`}
      </div>
      <a href="${waLink(WA, waMsg)}" target="_blank" rel="noopener" class="sticky-bottom-btn">${esc(group.ctaLabel || "WhatsApp")}</a>
    </div>
  </div>`;
}

export function bindGroupForms(root, WA) {
  root.querySelectorAll(".group-lead-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const slug = form.getAttribute("data-group-slug");
      const data = {};
      new FormData(form).forEach((val, key) => {
        data[key] = String(val).trim();
      });
      const group = { slug, name: slug, ctaWhatsappMessage: null };
      const msgField = form.closest(".group-detail, .groups-page");
      const title = msgField?.querySelector("h1")?.textContent || slug;
      group.name = title;
      const message = buildGroupWhatsappMessage(
        {
          ...group,
          ctaWhatsappMessage:
            form.getAttribute("data-wa-message") ||
            `Olá! Gostaria de informações sobre o grupo ${title} da WallTravel.`,
        },
        data,
      );
      window.open(waLink(WA, message), "_blank", "noopener");
    });
  });
}

export { formatMoney, waLink };
