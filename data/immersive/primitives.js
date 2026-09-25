/**
 * WallTravel Immersive Experience System — reusable markup primitives.
 * CMS-driven copy/media. No country-specific components.
 */

import {
  IMMERSIVE_TOKENS,
  hasPlayedSessionIntro,
  markSessionIntroPlayed,
  prefersReducedMotion,
  isMobileViewport,
} from "./tokens.js";

function escAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * ImmersivePageIntro — cream → brand → line → optional media → dismiss.
 * @param {{ brand?: string, eyebrow?: string, title?: string, line?: string, mediaUrl?: string, mediaAlt?: string, variant?: "home"|"short"|"detail", sessionKey?: string }} opts
 */
export function ImmersivePageIntro(opts = {}) {
  const {
    brand = "WallTravel",
    eyebrow = "",
    title = "",
    line = "",
    mediaUrl = "",
    mediaAlt = "",
    variant = "home",
    sessionKey = IMMERSIVE_TOKENS.sessionIntroKey,
  } = opts;

  const organic =
    variant === "home"
      ? `<div class="wt-page-intro-organic" aria-hidden="true"><span class="wt-page-intro-organic-cutout" data-intro-organic-cutout></span></div>`
      : "";

  return `<div class="wt-page-intro wt-page-intro--${escAttr(variant)}" data-wt-page-intro data-intro-variant="${escAttr(variant)}" data-intro-session-key="${escAttr(sessionKey)}" hidden aria-hidden="true">
    <div class="wt-page-intro-veil" aria-hidden="true"></div>
    ${organic}
    <div class="wt-page-intro-stage">
      ${eyebrow ? `<p class="wt-page-intro-eyebrow">${escAttr(eyebrow)}</p>` : ""}
      <p class="wt-page-intro-brand">${escAttr(brand)}</p>
      ${title ? `<h2 class="wt-page-intro-title">${escAttr(title)}</h2>` : ""}
      ${line ? `<p class="wt-page-intro-line">${escAttr(line)}</p>` : ""}
      ${
        mediaUrl
          ? `<div class="wt-page-intro-media" data-intro-media>
              <img src="${escAttr(mediaUrl)}" alt="${escAttr(mediaAlt)}" width="1200" height="800" decoding="async" fetchpriority="high">
            </div>`
          : ""
      }
    </div>
  </div>`;
}

/**
 * DestinationReveal — clip/opacity image reveal shell.
 */
export function DestinationReveal({ src, alt = "", className = "", eager = false } = {}) {
  if (!src) return "";
  return `<div class="wt-destination-reveal ${escAttr(className)}" data-wt-destination-reveal>
    <img src="${escAttr(src)}" alt="${escAttr(alt)}" width="1600" height="900" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} data-media-reveal>
  </div>`;
}

/**
 * ImmersiveHero — full-bleed hero shell with overlay + content slot.
 */
export function ImmersiveHero({
  carouselHtml = "",
  contentHtml = "",
  overlay = "strong",
  className = "",
} = {}) {
  return `<div class="wt-immersive-hero group-hero group-hero--fullbleed ${escAttr(className)}" data-wt-immersive-hero>
    ${carouselHtml}
    <div class="group-hero-overlay group-hero-overlay--${escAttr(overlay)}" aria-hidden="true"></div>
    <div class="group-hero-content section-container">
      ${contentHtml}
    </div>
  </div>`;
}

/**
 * CarouselProgress — editorial progress tracks (not dots).
 */
export function CarouselProgress({ total = 0, counterId = "" } = {}) {
  if (total < 2) return "";
  const totalDisplay = String(total).padStart(2, "0");
  return `<div class="wt-carousel-progress group-hero-chrome">
    <div class="group-hero-progress-wrapper">
      <span class="group-hero-counter" ${counterId ? `id="${escAttr(counterId)}"` : ""} data-hero-counter>01 / ${totalDisplay}</span>
      <div class="group-hero-progress-nav" data-hero-progress-nav role="tablist" aria-label="Fotos do hero">
        ${Array.from({ length: total }, (_, i) => `
          <button type="button" class="group-hero-progress-track ${i === 0 ? "is-active" : ""}" data-hero-dot="${i}" role="tab" aria-label="Foto ${i + 1}" aria-selected="${i === 0 ? "true" : "false"}">
            <span class="group-hero-progress-fill"></span>
          </button>`).join("")}
      </div>
    </div>
  </div>`;
}

/**
 * HeroCarousel — shared Home/Groups carousel markup (lazy slides after first).
 */
export function HeroCarousel({ slides = [], name = "", esc = escAttr } = {}) {
  const list = (slides || []).filter(Boolean).slice(0, 8);
  if (!list.length) return `<div class="group-hero-fallback" data-wt-hero-carousel></div>`;
  const total = list.length;
  const totalDisplay = String(total).padStart(2, "0");

  return `
    <div class="group-hero-carousel" data-group-hero-carousel data-wt-hero-carousel data-parallax="0.05" data-hero-total="${total}">
      ${list
        .map(
          (src, i) => `
        <div class="group-hero-slide ${i === 0 ? "is-active" : ""}" data-hero-slide="${i}">
          ${
            i === 0
              ? `<img src="${esc(src)}" alt="${esc(name)}" class="group-hero-img" width="1600" height="900" decoding="async" fetchpriority="high" onerror="this.closest('.group-hero-slide')?.remove()">`
              : `<img data-src="${esc(src)}" alt="" class="group-hero-img" width="1600" height="900" decoding="async" onerror="this.closest('.group-hero-slide')?.remove()">`
          }
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
        ${CarouselProgress({ total })}`
          : ""
      }
    </div>`;
}

/**
 * SectionReveal / MediaReveal — attribute wrappers for motion init.
 */
export function SectionReveal({ html = "", delay = 0, className = "" } = {}) {
  return `<div class="${escAttr(className)}" data-reveal data-reveal-delay="${delay}">${html}</div>`;
}

export function MediaReveal({ src, alt = "", className = "" } = {}) {
  if (!src) return "";
  return `<figure class="wt-media-reveal ${escAttr(className)}" data-reveal data-media-reveal>
    <img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy" decoding="async" width="1200" height="800">
  </figure>`;
}

/**
 * EditorialSection — one job: tag + title + lede + body slot.
 */
export function EditorialSection({
  id = "",
  tag = "",
  title = "",
  lede = "",
  bodyHtml = "",
  className = "",
} = {}) {
  return `<section class="wt-editorial-section ${escAttr(className)}" ${id ? `id="${escAttr(id)}"` : ""} data-reveal>
    <div class="section-container">
      ${tag ? `<span class="section-tag">${escAttr(tag)}</span>` : ""}
      ${title ? `<h2 class="package-section-title">${escAttr(title)}</h2>` : ""}
      ${lede ? `<p class="group-editorial group-editorial--lead">${escAttr(lede)}</p>` : ""}
      ${bodyHtml}
    </div>
  </section>`;
}

/**
 * DestinationPreview — single editorial destination for Home Explorer.
 */
export function DestinationPreview({
  name,
  description = "",
  image = "",
  href = "#",
  meta = "",
  active = false,
} = {}) {
  return `<a href="${escAttr(href)}" class="wt-dest-preview ${active ? "is-active" : ""}" data-dest-preview role="listitem" aria-label="${escAttr(name)}">
    <span class="wt-dest-preview-media" aria-hidden="true">
      ${image ? `<img src="${escAttr(image)}" alt="" width="960" height="720" loading="lazy" decoding="async">` : ""}
    </span>
    <span class="wt-dest-preview-copy">
      ${meta ? `<span class="wt-dest-preview-meta">${escAttr(meta)}</span>` : ""}
      <strong class="wt-dest-preview-title">${escAttr(name)}</strong>
      ${description ? `<span class="wt-dest-preview-desc">${escAttr(description)}</span>` : ""}
    </span>
  </a>`;
}

/**
 * Home Destination Explorer — 3–4 featured destinations (not full catalog).
 */
export function renderDestinationExplorer(destinations = [], esc = escAttr) {
  const items = destinations.slice(0, 4);
  if (!items.length) {
    return `<div class="wt-dest-explorer wt-dest-explorer--empty" data-wt-dest-explorer>
      <p class="wt-dest-explorer-empty">Novas experiências em breve. Explore a <a href="/vitrine">vitrine completa</a>.</p>
    </div>`;
  }

  const active = items[0];
  return `<div class="wt-dest-explorer" data-wt-dest-explorer>
    <div class="wt-dest-explorer-stage" data-explorer-stage aria-live="polite">
      <div class="wt-dest-explorer-image" data-explorer-image>
        ${
          active?.image
            ? `<img src="${esc(active.image)}" alt="${esc(active.name)}" width="1400" height="900" decoding="async" fetchpriority="low" data-explorer-img>`
            : ""
        }
      </div>
      <div class="wt-dest-explorer-panel">
        <span class="wt-dest-explorer-meta" data-explorer-meta>${esc(active.meta || "")}</span>
        <h3 class="wt-dest-explorer-title" data-explorer-title>${esc(active.name)}</h3>
        <p class="wt-dest-explorer-desc" data-explorer-desc>${esc(active.description || "")}</p>
        <a class="wt-dest-explorer-link" data-explorer-link href="${esc(active.href)}">Explorar destino</a>
      </div>
    </div>
    <div class="wt-dest-explorer-rail" data-explorer-rail role="list" aria-label="Destinos em destaque">
      ${items
        .map((d, i) =>
          DestinationPreview({
            ...d,
            active: i === 0,
          }),
        )
        .join("")}
    </div>
    <div class="wt-dest-explorer-cta">
      <a href="/vitrine" class="btn-primary wt-dest-explorer-cta-primary">Ver vitrine completa</a>
    </div>
  </div>`;
}

/**
 * StickyConversionCTA — shared sticky bar.
 */
export function StickyConversionCTA({
  priceHtml = "",
  ctaHref = "#",
  ctaLabel = "WhatsApp",
  className = "",
  external = true,
} = {}) {
  const linkAttrs = external
    ? `href="${escAttr(ctaHref)}" target="_blank" rel="noopener" data-storefront-cta="whatsapp"`
    : `href="${escAttr(ctaHref)}"`;
  return `<div class="sticky-bottom-bar group-sticky-bar wt-sticky-cta ${escAttr(className)}" data-wt-sticky-cta>
    <div class="sticky-bottom-price-box">${priceHtml}</div>
    <a ${linkAttrs} class="sticky-bottom-btn">${escAttr(ctaLabel)}</a>
  </div>`;
}

/**
 * TravelDetailShell — experience / package landing anatomy.
 */
export function TravelDetailShell({
  introHtml = "",
  heroHtml = "",
  subnavHtml = "",
  bodyHtml = "",
  stickyHtml = "",
  className = "",
} = {}) {
  return `<div class="group-detail experience-detail group-landing-ds wt-travel-detail-shell ${escAttr(className)}" data-group-over-hero data-experience-landing data-wt-travel-shell>
    ${introHtml}
    ${heroHtml}
    ${subnavHtml}
    <div class="group-detail-body">${bodyHtml}</div>
    ${stickyHtml}
  </div>`;
}

/**
 * GroupDetailTemplate — group landing anatomy (CMS fields only).
 */
export function GroupDetailTemplate({
  introHtml = "",
  heroHtml = "",
  subnavHtml = "",
  bodyHtml = "",
  stickyHtml = "",
  comingSoon = false,
  className = "",
} = {}) {
  return `<div class="group-detail group-landing-ds wt-group-detail-template ${comingSoon ? "group-detail--teaser" : ""} ${escAttr(className)}" data-group-over-hero data-wt-group-template>
    ${introHtml}
    ${heroHtml}
    ${subnavHtml}
    <div class="group-detail-body">${bodyHtml}</div>
    ${stickyHtml}
  </div>`;
}

/**
 * Detail personality intro — cream → title → date → cover → hero.
 * All strings from CMS; never hardcodes a country.
 */
export function renderDetailPersonalityIntro(entity = {}, esc = escAttr) {
  const title = entity.name || entity.title || "";
  const date =
    entity.dateLabel ||
    entity.datesLabel ||
    entity.durationLabel ||
    entity.departureLabel ||
    "";
  const dest = entity.destinationLabel || entity.destination || "";
  const cover = entity.coverImageUrl || entity.image || "";
  const eyebrow = dest ? `Entrando em ${dest}` : "WallTravel";

  return ImmersivePageIntro({
    brand: "WallTravel",
    eyebrow,
    title,
    line: date,
    mediaUrl: cover,
    mediaAlt: title,
    variant: "detail",
    sessionKey: `${IMMERSIVE_TOKENS.sessionPageIntroPrefix}${entity.slug || title}`,
  });
}

/**
 * Vitrine short intro markup.
 */
export function renderVitrineIntro() {
  return ImmersivePageIntro({
    brand: "WallTravel",
    line: "Vitrine de experiências",
    variant: "short",
    sessionKey: `${IMMERSIVE_TOKENS.sessionPageIntroPrefix}vitrine`,
  });
}

/**
 * Home opening intro.
 */
export function renderHomeOpeningIntro() {
  return ImmersivePageIntro({
    brand: "WallTravel",
    line: "Experiências extraordinárias desenhadas com propósito.",
    variant: "home",
    sessionKey: IMMERSIVE_TOKENS.sessionIntroKey,
  });
}

/**
 * Play ImmersivePageIntro once per session key; resolves when finished.
 */
export function playPageIntro(root = document) {
  const el = root.querySelector?.("[data-wt-page-intro]") || document.querySelector("[data-wt-page-intro]");
  if (!el) return Promise.resolve(false);

  const key = el.getAttribute("data-intro-session-key") || IMMERSIVE_TOKENS.sessionIntroKey;
  const variant = el.getAttribute("data-intro-variant") || "home";

  if (hasPlayedSessionIntro(key) || prefersReducedMotion()) {
    el.remove();
    return Promise.resolve(false);
  }

  el.hidden = false;
  el.setAttribute("aria-hidden", "false");
  el.classList.add("is-playing");
  document.documentElement.classList.add("wt-intro-active");

  const duration =
    variant === "short"
      ? IMMERSIVE_TOKENS.introShortMs
      : variant === "detail"
        ? isMobileViewport()
          ? 1100
          : 1500
        : isMobileViewport()
          ? IMMERSIVE_TOKENS.introMobileMs
          : IMMERSIVE_TOKENS.introDesktopMs;

  if (variant === "home") {
    el.style.setProperty("--duration-intro", `${duration}ms`);
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      el.classList.add("is-exiting");
      window.setTimeout(() => {
        markSessionIntroPlayed(key);
        el.remove();
        document.documentElement.classList.remove("wt-intro-active");
        resolve(true);
      }, IMMERSIVE_TOKENS.durationFast);
    }, duration);
  });
}

/**
 * Destination Explorer interactions — desktop hover / mobile swipe peek.
 */
export function initDestinationExplorer(root = document) {
  const explorer = root.querySelector?.("[data-wt-dest-explorer]") || document.querySelector("[data-wt-dest-explorer]");
  if (!explorer || explorer.classList.contains("wt-dest-explorer--empty")) return () => {};

  const previews = Array.from(explorer.querySelectorAll("[data-dest-preview]"));
  const img = explorer.querySelector("[data-explorer-img]");
  const title = explorer.querySelector("[data-explorer-title]");
  const desc = explorer.querySelector("[data-explorer-desc]");
  const meta = explorer.querySelector("[data-explorer-meta]");
  const link = explorer.querySelector("[data-explorer-link]");
  const rail = explorer.querySelector("[data-explorer-rail]");

  const activate = (preview) => {
    if (!preview) return;
    previews.forEach((p) => p.classList.toggle("is-active", p === preview));
    const nextImg = preview.querySelector("img");
    const nextTitle = preview.querySelector(".wt-dest-preview-title")?.textContent || "";
    const nextDesc = preview.querySelector(".wt-dest-preview-desc")?.textContent || "";
    const nextMeta = preview.querySelector(".wt-dest-preview-meta")?.textContent || "";
    const href = preview.getAttribute("href") || "#";
    if (img && nextImg?.src) {
      const stage = explorer.querySelector("[data-explorer-image]");
      stage?.classList.add("is-transitioning");
      img.style.opacity = "0";
      img.style.transform = prefersReducedMotion() ? "none" : "scale(1.03)";
      window.setTimeout(() => {
        img.src = nextImg.src;
        img.alt = nextTitle;
        img.style.opacity = "1";
        img.style.transform = "none";
        stage?.classList.remove("is-transitioning");
      }, prefersReducedMotion() ? 0 : 220);
    }
    if (title) title.textContent = nextTitle;
    if (desc) desc.textContent = nextDesc;
    if (meta) meta.textContent = nextMeta;
    if (link) link.href = href;
  };

  const onEnter = (e) => {
    const preview = e.currentTarget;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      activate(preview);
    }
  };

  previews.forEach((p) => {
    p.addEventListener("mouseenter", onEnter);
    p.addEventListener("focus", onEnter);
    p.addEventListener("click", (e) => {
      // On touch, first tap activates; second follows link
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        if (!p.classList.contains("is-active")) {
          e.preventDefault();
          activate(p);
          p.scrollIntoView({ inline: "center", block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
        }
      }
    });
  });

  // Mobile swipe on rail
  let touchX = null;
  const onTouchStart = (e) => {
    touchX = e.changedTouches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX == null) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? touchX) - touchX;
    touchX = null;
    if (Math.abs(dx) < 40) return;
    const idx = previews.findIndex((p) => p.classList.contains("is-active"));
    const next = dx < 0 ? Math.min(idx + 1, previews.length - 1) : Math.max(idx - 1, 0);
    activate(previews[next]);
    previews[next]?.scrollIntoView({ inline: "center", block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };
  rail?.addEventListener("touchstart", onTouchStart, { passive: true });
  rail?.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    previews.forEach((p) => {
      p.removeEventListener("mouseenter", onEnter);
      p.removeEventListener("focus", onEnter);
    });
    rail?.removeEventListener("touchstart", onTouchStart);
    rail?.removeEventListener("touchend", onTouchEnd);
  };
}

/** Shared motion primitive aliases (CSS/WAAPI system names). */
export const PageIntro = ImmersivePageIntro;
export const HeroReveal = ImmersiveHero;
export const ImageReveal = MediaReveal;
export const StaggerGroup = SectionReveal;
export const DestinationTransition = DestinationReveal;
export const JourneyTransition = SectionReveal;

export {
  IMMERSIVE_TOKENS,
  hasPlayedSessionIntro,
  markSessionIntroPlayed,
  prefersReducedMotion,
  isMobileViewport,
};
