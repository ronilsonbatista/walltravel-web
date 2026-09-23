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

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Match a CMS gallery URL to a route stop by filename tokens — no invented imagery. */
function photoForStop(stopName, gallery = []) {
  const key = normalizeKey(stopName);
  if (!key) return null;
  const aliases = {
    atenas: ["atenas", "athens", "acropole"],
    mykonos: ["mykonos"],
    santorini: ["santorini", "oia"],
    corfu: ["corfu", "kerkyra"],
  };
  const tokens = aliases[key] || [key];
  for (const url of gallery) {
    const file = normalizeKey(String(url).split("/").pop() || "");
    if (tokens.some((t) => file.includes(t))) return url;
  }
  return null;
}

function transportKind(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("voo") || t.includes("avi")) return "plane";
  if (t.includes("ferry") || t.includes("barco") || t.includes("navio")) return "ferry";
  return "path";
}

function padIndex(i, total) {
  const digits = String(Math.max(total, 1)).length;
  return String(i + 1).padStart(Math.max(2, digits), "0");
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

function renderSubnav(group) {
  const links = [];
  if (group.routeStops?.length) links.push(["#group-route", "Roteiro"]);
  if (group.routeStops?.some((s) => s.hotel)) links.push(["#group-hotels", "Hotéis"]);
  if (group.gallery?.length) links.push(["#group-gallery", "Galeria"]);
  if (group.itinerary?.length) links.push(["#group-itinerary", "Dia a dia"]);
  if (group.investmentOptions?.length || group.priceFrom) links.push(["#group-investment", "Investimento"]);
  links.push(["#group-form", "Contato"]);
  if (links.length < 3) return "";
  return `<nav class="group-subnav" data-group-subnav aria-label="Seções da expedição">
    <div class="group-subnav-inner">
      ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
    </div>
  </nav>
  <div class="group-scroll-progress" data-group-scroll-progress aria-hidden="true"><span></span></div>`;
}

export function renderWhyGroup(group, esc) {
  if (!group.whyGroup?.length) return "";
  const gallery = group.gallery || [];
  return `<section class="group-band group-band--dark group-why-band" id="group-why" data-reveal>
    <div class="section-container group-band-inner">
      <div class="group-why-head">
        <span class="section-tag section-tag--on-dark">Por que em grupo</span>
        <h2 class="group-band-title">Por que viajar com a WallTravel</h2>
      </div>
      <div class="group-why-visual">
        ${group.whyGroup
          .map((w, i) => {
            const num = padIndex(i, group.whyGroup.length);
            const photo = gallery[i % Math.max(gallery.length, 1)] || group.coverImageUrl;
            return `
          <article class="group-why-card group-why-card--visual" data-reveal data-reveal-delay="${(i % 4) * 60}">
            ${
              photo
                ? `<div class="group-why-photo"><img src="${esc(photo)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>`
                : ""
            }
            <div class="group-why-copy">
              <span class="group-why-num" aria-hidden="true">${num}</span>
              <h3>${esc(w.title)}</h3>
              <p>${esc(w.description)}</p>
            </div>
          </article>`;
          })
          .join("")}
      </div>
    </div>
  </section>`;
}

/** Primary destination key from itinerary location (CMS text only). */
function destinationKeyFromLocation(location) {
  const raw = String(location || "").split(/→|->|–|—/)[0].trim();
  return normalizeKey(raw);
}

function groupItineraryByDestination(itinerary = []) {
  const groups = [];
  for (const day of itinerary) {
    const key = destinationKeyFromLocation(day.location) || `day-${day.day}`;
    const label =
      String(day.location || "")
        .split(/→|->|–|—/)[0]
        .trim() || `Dia ${day.day}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.days.push(day);
    } else {
      groups.push({ key, label, days: [day] });
    }
  }
  return groups;
}

/**
 * Didactic journey line (primary). Geographic map removed — confusing and not approved.
 * Each stop: point · nights · next transport · small CMS-matched image.
 * Desktop: click panel · Mobile: horizontal carousel.
 */
export function renderJourneyLine(group, esc) {
  if (!group.routeStops?.length) return "";

  const stops = group.routeStops.map((s, i) => {
    const photo = photoForStop(s.name, group.gallery || []);
    const kind = transportKind(s.transportNext);
    return { ...s, i, photo, kind };
  });

  return `<section class="group-section group-journey-section" id="group-route" data-reveal>
    <div class="group-journey-head">
      <span class="section-tag">Roteiro</span>
      <h2 class="package-section-title">A jornada, parada a parada</h2>
      ${group.destinationLabel ? `<p class="group-journey-lede">${esc(group.destinationLabel)}</p>` : ""}
    </div>
    <div class="group-journey" data-group-journey>
      <ol class="group-journey-line" data-journey-line>
        ${stops
          .map((s, i) => {
            const isLast = i === stops.length - 1;
            const payload = encodeURIComponent(
              JSON.stringify({
                name: s.name,
                nights: s.nights || "",
                hotel: s.hotel || "",
                transportNext: s.transportNext || "",
                photo: s.photo || "",
                kind: s.kind,
              }),
            );
            return `<li class="group-journey-stop ${i === 0 ? "is-active" : ""}" data-journey-stop="${s.i}">
              <button type="button" class="group-journey-node" data-journey-node="${s.i}" data-journey-payload="${payload}" aria-pressed="${i === 0 ? "true" : "false"}" aria-label="${esc(s.name)}${s.nights ? `, ${esc(s.nights)}` : ""}">
                <span class="group-journey-idx" aria-hidden="true">${padIndex(s.i, stops.length)}</span>
                ${
                  s.photo
                    ? `<span class="group-journey-thumb"><img src="${esc(s.photo)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></span>`
                    : `<span class="group-journey-thumb group-journey-thumb--empty" aria-hidden="true"></span>`
                }
                <span class="group-journey-meta">
                  <strong>${esc(s.name)}</strong>
                  ${s.nights ? `<em>${esc(s.nights)}</em>` : ""}
                </span>
              </button>
              ${
                !isLast && s.transportNext
                  ? `<div class="group-journey-leg" aria-hidden="true">
                      <span class="group-journey-leg-icon group-journey-leg-icon--${esc(s.kind)}"></span>
                      <span class="group-journey-leg-label">${esc(s.transportNext)}</span>
                    </div>`
                  : !isLast
                    ? `<div class="group-journey-leg group-journey-leg--empty" aria-hidden="true"></div>`
                    : ""
              }
            </li>`;
          })
          .join("")}
      </ol>
      <aside class="group-journey-panel" data-journey-panel aria-live="polite">
        <div data-journey-panel-body>
          ${
            stops[0]
              ? `${stops[0].photo ? `<img class="group-journey-panel-photo" src="${esc(stops[0].photo)}" alt="" loading="lazy">` : ""}
            <p class="group-journey-panel-idx">${padIndex(0, stops.length)} / ${padIndex(stops.length - 1, stops.length)}</p>
            <h3>${esc(stops[0].name)}</h3>
            ${stops[0].nights ? `<p class="group-journey-panel-nights">${esc(stops[0].nights)}</p>` : ""}
            ${stops[0].hotel ? `<p class="group-journey-panel-hotel">${esc(stops[0].hotel)}</p>` : ""}
            ${stops[0].transportNext ? `<p class="group-journey-panel-transport">${esc(stops[0].transportNext)}</p>` : ""}`
              : ""
          }
        </div>
      </aside>
    </div>
  </section>`;
}

/** @deprecated Use renderJourneyLine — kept as alias for callers. */
export function renderInteractiveRouteMap(group, esc) {
  return renderJourneyLine(group, esc);
}

export function renderHotels(group, esc) {
  const hotels = (group.routeStops || []).filter((s) => s.hotel);
  if (!hotels.length) return "";
  return `<section class="group-section" id="group-hotels" data-reveal>
    <span class="section-tag">Hospedagem</span>
    <h2 class="package-section-title">Onde vamos ficar</h2>
    <div class="group-hotel-carousel" data-hotel-carousel>
      ${hotels
        .map((s, i) => {
          const photo = photoForStop(s.name, group.gallery || []);
          return `<article class="group-hotel-card group-hotel-card--large" data-reveal data-reveal-delay="${i * 70}">
            ${
              photo
                ? `<div class="group-hotel-media"><img src="${esc(photo)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>`
                : ""
            }
            <div class="group-hotel-body">
              <span class="group-hotel-place">${esc(s.name)}</span>
              <h3>${esc(s.hotel)}</h3>
              ${s.nights ? `<p>${esc(s.nights)}</p>` : ""}
            </div>
          </article>`;
        })
        .join("")}
    </div>
  </section>`;
}

export function renderRoute(group, esc) {
  // Kept for compatibility; published pages use interactive map + hotels.
  if (!group.routeStops?.length) return "";
  return renderInteractiveRouteMap(group, esc) + renderHotels(group, esc);
}

function renderDayBody(day, esc) {
  return `
    ${day.location ? `<p class="group-itinerary-location">${esc(day.location)}</p>` : ""}
    <p class="group-itinerary-desc">${esc(day.description)}</p>
    ${
      day.highlights?.length
        ? `<ul class="group-itinerary-highlights">${day.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
        : ""
    }
    ${day.overnight ? `<p class="group-itinerary-overnight">${esc(day.overnight)}</p>` : ""}
  `;
}

/**
 * Day-nav grouped by destination + large day panel (desktop).
 * Mobile: horizontal day selector + swipe + NN/TT progress.
 * Full day content stays in DOM for SEO/a11y (visually panel-switched, not removed).
 */
export function renderItineraryAccordion(group, esc) {
  if (!group.itinerary?.length) return "";
  const days = group.itinerary;
  const total = days.length;
  const totalLabel = String(total).padStart(2, "0");
  const destGroups = groupItineraryByDestination(days);

  return `<section class="group-section group-itinerary-section" id="group-itinerary" data-reveal data-itinerary-explorer data-itinerary-total="${total}">
    <div class="group-itinerary-head">
      <span class="section-tag">Dia a dia</span>
      <h2 class="package-section-title">Itinerário completo</h2>
      <p class="group-itinerary-progress-label" data-itinerary-counter aria-live="polite">01 / ${totalLabel}</p>
    </div>
    <div class="group-itinerary-explorer">
      <nav class="group-itinerary-nav" data-itinerary-nav aria-label="Dias do roteiro">
        ${destGroups
          .map(
            (g) => `
          <div class="group-itinerary-nav-group">
            <p class="group-itinerary-nav-dest">${esc(g.label)}</p>
            <ol class="group-itinerary-nav-days">
              ${g.days
                .map((day) => {
                  const idx = days.findIndex((d) => d.day === day.day);
                  const n = String(day.day).padStart(2, "0");
                  return `<li>
                    <button type="button" class="group-itinerary-day-btn ${idx === 0 ? "is-active" : ""}" data-itinerary-day-btn="${esc(String(day.day))}" data-itinerary-index="${idx}" aria-pressed="${idx === 0 ? "true" : "false"}">
                      <span class="group-itinerary-day-btn-num">${n}</span>
                      <span class="group-itinerary-day-btn-title">${esc(day.title)}</span>
                    </button>
                  </li>`;
                })
                .join("")}
            </ol>
          </div>`,
          )
          .join("")}
      </nav>
      <div class="group-itinerary-stage" data-itinerary-stage>
        <div class="group-itinerary-stage-chrome">
          <button type="button" class="group-itinerary-nav-btn" data-itinerary-prev aria-label="Dia anterior">‹</button>
          <div class="group-itinerary-stage-meter" data-itinerary-meter aria-hidden="true"><span></span></div>
          <button type="button" class="group-itinerary-nav-btn" data-itinerary-next aria-label="Próximo dia">›</button>
        </div>
        <div class="group-itinerary-panels" data-itinerary-panels>
          ${days
            .map(
              (day, i) => `
            <article class="group-itinerary-panel ${i === 0 ? "is-active" : ""}" data-itinerary-panel data-day="${esc(String(day.day))}" data-itinerary-index="${i}" ${i === 0 ? "" : 'aria-hidden="true"'}>
              <div class="group-itinerary-step-head">
                <span class="group-itinerary-day-num">Dia ${esc(String(day.day))}</span>
                ${day.dateLabel ? `<span class="group-itinerary-date">${esc(day.dateLabel)}</span>` : ""}
              </div>
              <h3 class="group-itinerary-day-title">${esc(day.title)}</h3>
              ${renderDayBody(day, esc)}
            </article>`,
            )
            .join("")}
        </div>
      </div>
    </div>
    <!-- SEO fallback: full content always in document (crawlers); interactive panels are the a11y surface -->
    <div class="group-itinerary-seo" aria-hidden="true">
      <h3>Itinerário — lista completa</h3>
      <ol>
        ${days
          .map(
            (day) => `
          <li>
            <h4>Dia ${esc(String(day.day))}${day.title ? ` — ${esc(day.title)}` : ""}</h4>
            ${renderDayBody(day, esc)}
          </li>`,
          )
          .join("")}
      </ol>
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

  const capacity =
    group.groupSize != null
      ? `<p class="group-investment-capacity">Grupo de ${esc(String(group.groupSize))} viajantes — sem urgência artificial.</p>`
      : "";

  return `<section class="group-band group-band--dark group-investment-band" id="group-investment" data-reveal>
    <div class="section-container group-band-inner">
      <span class="section-tag section-tag--on-dark">Investimento</span>
      <h2 class="group-band-title">Valores e formas de pagamento</h2>
      ${capacity}
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
          <h3 class="group-subheading group-subheading--on-dark">Formas de pagamento</h3>
          <ul>${group.paymentMethods.map((p) => `<li><strong>${esc(p.title)}</strong>${p.description ? ` — ${esc(p.description)}` : ""}</li>`).join("")}</ul>
        </div>`
          : ""
      }
      ${group.priceNote && !group.investmentOptions?.length ? `<p class="group-price-note">${esc(group.priceNote)}</p>` : ""}
    </div>
  </section>`;
}

export function renderFaq(group, esc) {
  if (!group.faq?.length) return "";
  return `<section class="group-section group-faq-section" data-reveal>
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
  return `<section class="group-band group-band--photo group-leader-band" data-reveal>
    ${
      leader.photoUrl
        ? `<div class="group-leader-bg" aria-hidden="true"><img src="${esc(leader.photoUrl)}" alt="" loading="lazy"></div>`
        : ""
    }
    <div class="section-container group-band-inner group-leader-inner">
      <span class="section-tag section-tag--on-dark">Liderança</span>
      <h2 class="group-band-title">Líder da expedição</h2>
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

  return `<section class="group-section group-form-section group-final-cta" id="group-form" data-reveal>
    <div class="group-final-cta-copy">
      <span class="section-tag">Contato</span>
      <h2 class="package-section-title">${group.comingSoon ? "Quero ser avisado" : `Fale sobre ${esc(group.name)}`}</h2>
      <p class="group-final-cta-lede">${
        group.comingSoon
          ? "Deixe seu WhatsApp. Avisamos quando datas e investimento forem publicados."
          : group.groupSize
            ? `Grupo de ${esc(String(group.groupSize))} pessoas. Fale com a equipe — sem falsa urgência.`
            : "Fale com a equipe WallTravel pelo WhatsApp."
      }</p>
    </div>
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
    <div class="included-grid group-includes-panels">
      <div class="group-includes-panel">
        <h3 class="group-subheading">Incluso</h3>
        <ul class="included-list">${(group.includes || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>
      <div class="group-includes-panel">
        <h3 class="group-subheading">Não incluso</h3>
        <ul class="not-included-list">${(group.excludes || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>
    </div>
  </section>`;
}

/** Shared hero carousel — used by Groups and Experience (/viagens) landings. */
export function renderTravelHeroCarousel(slides, esc) {
  return renderHeroCarouselV2({ name: "" }, esc, slides);
}

export function renderTravelHighlights(highlights, esc) {
  return renderHighlights({ highlights }, esc);
}

export function renderTravelSubnav(sections) {
  return renderSubnav(sections);
}

export function renderTravelGallery(gallery, name, esc) {
  return renderGalleryCinematic({ gallery, name }, esc);
}

export { formatMoney, waLink, renderHeroCarouselV2 };

export function renderBomSaber(group, esc) {
  if (!group.bomSaber?.length) return "";
  return `<section class="group-section" data-reveal>
    <span class="section-tag">Bom saber</span>
    <h2 class="package-section-title">Informações importantes</h2>
    <ol class="group-bom-saber-list group-bom-saber-numbered">
      ${group.bomSaber
        .map(
          (item, i) =>
            `<li><span class="group-bom-num">${esc(item.title || padIndex(i, group.bomSaber.length))}</span><span class="group-bom-text">${esc(item.text)}</span></li>`,
        )
        .join("")}
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

function manifestoHeadline(editorial) {
  const first = String(editorial || "").trim().split(/\n+/)[0] || "";
  const match = first.match(/^(.{8,72}?[.!?])(?:\s|$)/);
  const sentence = (match && match[1]) || first;
  return sentence.length > 72 ? `${sentence.slice(0, 69).trim()}…` : sentence;
}

function renderManifesto(group, esc) {
  const text = group.editorial;
  if (!text) return "";
  const lines = String(text).trim().split(/\n+/).filter(Boolean);
  const lead = lines[0] || text;
  const rest = lines.slice(1).join("\n\n");
  const sticky = manifestoHeadline(text);
  return `<section class="group-manifesto" data-reveal>
    <div class="section-container group-manifesto-layout">
      <h2 class="group-manifesto-sticky" data-manifesto-sticky>${esc(sticky)}</h2>
      <div class="group-manifesto-body">
        <p class="group-editorial group-editorial--lead">${esc(lead)}</p>
        ${rest ? `<p class="group-editorial">${esc(rest)}</p>` : ""}
        ${group.description ? `<p class="group-manifesto-meta">${esc(group.description)}</p>` : ""}
      </div>
    </div>
  </section>`;
}

function renderPhotoMoment(group, esc, index = 2) {
  const gallery = group.gallery || [];
  const src = gallery[index] || gallery[0] || group.coverImageUrl;
  if (!src) return "";
  return `<section class="group-photo-moment" data-reveal aria-hidden="false">
    <img src="${esc(src)}" alt="" loading="lazy" onerror="this.closest('.group-photo-moment')?.remove()">
    <div class="group-photo-moment-veil"></div>
  </section>`;
}

function renderGalleryCinematic(group, esc) {
  if (!group.gallery?.length) return "";
  return `<section class="group-section group-gallery-section" id="group-gallery" data-reveal>
    <div class="group-gallery-head">
      <span class="section-tag">Galeria</span>
      <h2 class="package-section-title">Atmosfera da viagem</h2>
    </div>
    <div class="group-gallery-cinematic" data-gallery-strip>
      ${group.gallery
        .map(
          (img, i) => `
        <button type="button" class="group-gallery-item ${i % 3 === 0 ? "group-gallery-item--tall" : ""}" data-lightbox-src="${esc(img)}" data-lightbox-alt="${esc(group.name)}" data-reveal data-reveal-delay="${(i % 5) * 40}">
          <img src="${esc(img)}" alt="" loading="lazy" onerror="this.parentElement.remove()">
        </button>`,
        )
        .join("")}
    </div>
  </section>`;
}

export function renderGroupsCatalog(groups, esc) {
  const heroImg =
    groups.find((g) => g.coverImageUrl && !g.comingSoon)?.coverImageUrl ||
    groups.find((g) => g.coverImageUrl)?.coverImageUrl ||
    null;

  return `<div class="groups-page group-landing-ds" data-group-over-hero>
    <section class="groups-intro-hero">
      ${
        heroImg
          ? `<div class="groups-intro-hero-media" aria-hidden="true"><img src="${esc(heroImg)}" alt="" fetchpriority="high"></div>`
          : ""
      }
      <div class="groups-intro-hero-veil"></div>
      <div class="groups-intro-copy" data-reveal>
        <div class="breadcrumb breadcrumb--light">
          <a href="/">Início</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">Viagens em grupo</span>
        </div>
        <span class="category-meta-info">Expedições WallTravel</span>
        <h1 class="groups-intro-title">Viagens em grupo</h1>
        <p class="groups-header-desc">Roteiros em grupo pequeno, com curadoria, logística completa e líder WallTravel quando indicado.</p>
      </div>
    </section>

    <section class="group-manifesto groups-catalog-manifesto" data-reveal>
      <div class="section-container group-manifesto-layout">
        <h2 class="group-manifesto-sticky" data-manifesto-sticky>Viajar junto muda o ritmo.</h2>
        <div class="group-manifesto-body">
          <p class="group-editorial group-editorial--lead">Grupos pequenos, destinos com intenção e a WallTravel cuidando do que precisa estar resolvido — para sobrar presença no caminho.</p>
          <p class="group-editorial">Cada expedição tem sua própria página: abertas para reserva ou em breve, sempre com o que já está fechado no CMS — sem inventar o restante.</p>
        </div>
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
          return `<a href="/grupos/${esc(g.slug)}" class="group-card" data-reveal data-reveal-delay="${i * 100}">
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

function renderHeroCarouselV2(group, esc, slides) {
  if (!slides.length) {
    return `<div class="group-hero-fallback"></div>`;
  }
  const total = slides.length;
  const totalDisplay = String(total).padStart(2, "0");

  return `
    <div class="group-hero-carousel" data-group-hero-carousel data-parallax="0.05" data-hero-total="${total}">
      ${slides
        .map(
          (src, i) => `
        <div class="group-hero-slide ${i === 0 ? "is-active" : ""}" data-hero-slide="${i}">
          <img src="${esc(src)}" alt="" class="group-hero-img" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} onerror="this.closest('.group-hero-slide')?.remove()">
        </div>`,
        )
        .join("")}
      ${
        total > 1
          ? `
        <div class="group-hero-nav-arrows" aria-hidden="false">
          <button type="button" class="group-hero-arrow-btn" data-hero-prev aria-label="Foto anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 16.58L10.83 12l4.58-4.58L14 6l-6 6 6 6 1.41-1.42z"/></svg>
          </button>
          <button type="button" class="group-hero-arrow-btn" data-hero-next aria-label="Próxima foto">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z"/></svg>
          </button>
        </div>
        <div class="group-hero-chrome">
          <div class="group-hero-progress-wrapper">
            <span class="group-hero-counter" data-hero-counter>01 / ${totalDisplay}</span>
            <div class="group-hero-progress-nav" data-hero-progress-nav role="tablist" aria-label="Fotos do hero">
              ${slides
                .map(
                  (_src, i) => `
                <button type="button" class="group-hero-progress-track ${i === 0 ? "is-active" : ""}" data-hero-dot="${i}" role="tab" aria-label="Foto ${i + 1}" aria-selected="${i === 0 ? "true" : "false"}">
                  <span class="group-hero-progress-fill"></span>
                </button>`,
                )
                .join("")}
            </div>
          </div>
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
      <div class="group-hero group-hero--teaser group-hero--fullbleed">
        ${renderHeroCarouselV2(group, esc, slides.slice(0, 5))}
        <div class="group-hero-overlay"></div>
        <div class="group-hero-content section-container">
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
      <div class="group-detail-body">
        ${
          group.editorial
            ? `<section class="group-manifesto group-manifesto--teaser" data-reveal>
            <div class="section-container group-manifesto-layout">
              <h2 class="group-manifesto-sticky" data-manifesto-sticky>${esc(group.name)}</h2>
              <div class="group-manifesto-body"><p class="group-editorial">${esc(group.editorial)}</p></div>
            </div>
          </section>`
            : ""
        }
        <div class="section-container">
          ${renderGalleryCinematic({ ...group, gallery: (group.gallery || []).slice(0, 5) }, esc)}
          <section class="group-section group-coming-banner" data-reveal>
            <span class="section-tag">Em breve</span>
            <h2 class="package-section-title">Estamos preparando esta expedição</h2>
            <p>Datas, investimento e roteiro serão publicados quando o grupo abrir — sem inventar o que ainda não está fechado.</p>
          </section>
          ${renderGroupForm(group, esc, WA)}
          <a href="${waLink(WA, waMsg)}" target="_blank" rel="noopener" class="btn-outline group-specialist-link">Falar com especialista</a>
        </div>
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
    <div class="group-hero group-hero--fullbleed">
      ${renderHeroCarouselV2(group, esc, slides)}
      <div class="group-hero-overlay"></div>
      <div class="group-hero-content section-container">
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
    ${renderSubnav(group)}
    <div class="group-detail-body">
      ${renderManifesto(group, esc)}
      ${renderWhyGroup(group, esc)}
      ${renderPhotoMoment(group, esc, 3)}
      <div class="section-container">
        ${renderJourneyLine(group, esc)}
        ${renderHotels(group, esc)}
      </div>
      ${renderGalleryCinematic(group, esc)}
      <div class="section-container">
        ${renderItineraryAccordion(group, esc)}
      </div>
      ${renderInvestment(group, esc)}
      <div class="section-container">
        ${renderIncludesExcludes(group, esc)}
        ${renderOptionals(group, esc)}
        ${renderBomSaber(group, esc)}
        ${renderFaq(group, esc)}
      </div>
      ${renderLeader(group, esc)}
      <div class="section-container">
        ${renderGroupForm(group, esc, WA)}
      </div>
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

