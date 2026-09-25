/**
 * WallTravel Immersive Experience System — reusable markup primitives.
 * CMS-driven copy/media. No country-specific components.
 */

import {
  IMMERSIVE_TOKENS,
  INTRO_PRESETS,
  resolveIntroPreset,
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

const HOME_APERTURE_SRC = "/images/vitrine/africa-do-sul.webp";

/** Map legacy variant names → ImmersiveIntro preset ids */
function normalizePreset(preset, variant) {
  const raw = preset || variant || "home";
  if (raw === "detail" || raw === "group-detail") return "groupDetail";
  if (raw === "experience" || raw === "experience-detail") return "experienceDetail";
  if (raw === "short" || raw === "vitrine") return "catalog";
  if (raw === "grupos" || raw === "groups") return "groupCatalog";
  if (INTRO_PRESETS[raw]) return raw;
  if (variant === "detail") return "groupDetail";
  if (variant === "groupCatalog" || variant === "grupos") return "groupCatalog";
  if (variant === "catalog" || variant === "vitrine" || variant === "short") return "catalog";
  if (variant === "home") return "home";
  return "home";
}

/** CSS modifier class for a preset */
function presetCssMod(preset) {
  if (preset === "groupCatalog") return "group-catalog";
  if (preset === "groupDetail") return "group-detail";
  if (preset === "experienceDetail") return "experience-detail";
  if (preset === "catalog") return "catalog";
  return preset;
}

/**
 * IntroProgress — one editorial hairline for every opening.
 * Variants: subtle (home, groups, detail) · compact (catalog).
 * It marks continuity. It is not a network meter.
 */
export function IntroProgress({ variant = "subtle" } = {}) {
  const name = variant === "compact" ? "compact" : "subtle";
  return `<span class="wt-intro-progress wt-intro-progress--${name}" data-intro-progress data-intro-progress-variant="${name}" aria-hidden="true"><span class="wt-intro-progress-fill"></span></span>`;
}

/**
 * ImmersiveIntro — shared cream opening for home / catalog / groupCatalog / detail.
 * Alias: ImmersivePageIntro.
 * @param {{ brand?: string, eyebrow?: string, title?: string, line?: string, mediaUrl?: string, mediaAlt?: string, preset?: "home"|"catalog"|"groupCatalog"|"groupDetail"|"experienceDetail", variant?: string, sessionKey?: string, cssFirst?: boolean, skipLabel?: string }} opts
 */
export function ImmersiveIntro(opts = {}) {
  const {
    brand = "",
    eyebrow = "",
    title = "",
    line = "",
    mediaUrl = "",
    skipLabel = "Pular introdução",
    cssFirst = false,
  } = opts;

  const preset = normalizePreset(opts.preset, opts.variant);
  const presetCfg = resolveIntroPreset(preset);
  const sessionKey =
    opts.sessionKey ||
    presetCfg.sessionKey ||
    `${IMMERSIVE_TOKENS.sessionPageIntroPrefix}${preset}`;
  const cssMod = presetCssMod(preset);
  const handoff = presetCfg.handoff || "hero";
  const grade = presetCfg.grade || "home";
  const progress = presetCfg.progress || "subtle";
  const src = preset === "home" ? HOME_APERTURE_SRC : mediaUrl;
  const compact = handoff === "content" ? " wt-intro-aperture--compact" : "";
  const aperture = src
    ? `<div class="wt-intro-aperture wt-home-aperture${compact}" data-intro-aperture data-intro-grade="${escAttr(grade)}" aria-hidden="true"><img src="${escAttr(src)}" alt="" width="1600" height="900" decoding="async" fetchpriority="high"><span class="wt-intro-aperture-grade wt-home-aperture-grade" aria-hidden="true"></span></div>`
    : "";
  const hiddenAttr = cssFirst ? "" : "hidden";
  const ariaHidden = cssFirst ? "false" : "true";
  const target = presetCfg.target || "";

  return `<div class="wt-page-intro wt-page-intro--seat wt-page-intro--${escAttr(cssMod)}" data-wt-page-intro data-intro-preset="${escAttr(preset)}" data-intro-variant="${escAttr(cssMod)}" data-intro-session-key="${escAttr(sessionKey)}" data-intro-state="arrival" data-intro-handoff="${escAttr(handoff)}" data-intro-target="${escAttr(target)}" ${hiddenAttr} aria-hidden="${ariaHidden}" role="dialog" aria-label="Introdução WallTravel">
    <div class="wt-page-intro-veil" aria-hidden="true"></div>
    ${aperture}
    <div class="wt-page-intro-stage">
      ${eyebrow ? `<p class="wt-page-intro-eyebrow">${escAttr(eyebrow)}</p>` : ""}
      ${brand ? `<p class="wt-page-intro-brand" data-intro-brand>${escAttr(brand)}</p>` : ""}
      ${title ? `<h2 class="wt-page-intro-title">${escAttr(title)}</h2>` : ""}
      ${line ? `<p class="wt-page-intro-line" data-intro-line>${escAttr(line)}</p>` : ""}
      ${preset === "home" ? `<p class="wt-intro-count" data-intro-count>0</p>` : IntroProgress({ variant: progress })}
    </div>
  </div>`;
}

/** @deprecated prefer ImmersiveIntro — kept as alias */
export function ImmersivePageIntro(opts = {}) {
  return ImmersiveIntro(opts);
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
function formatIntroDates(entity) {
  if (entity.dateLabel || entity.datesLabel) return entity.dateLabel || entity.datesLabel;
  const start = entity.departureDate;
  const end = entity.returnDate;
  if (!start || !end) return entity.durationLabel || entity.departureLabel || "";
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return entity.durationLabel || "";
  }
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${months[s.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
}

export function renderDetailPersonalityIntro(entity = {}, esc = escAttr) {
  const preset = normalizePreset(entity.introPreset || "groupDetail");
  const name = entity.name || entity.title || "";
  const dest = entity.destinationLabel || entity.destination || "";
  const cover = entity.coverImageUrl || entity.image || "";
  const title = name || dest;
  const line =
    preset === "experienceDetail"
      ? [dest, entity.durationLabel || entity.dateLabel || ""].filter(Boolean).join(" · ")
      : formatIntroDates(entity);

  return ImmersiveIntro({
    brand: "",
    title,
    line,
    mediaUrl: cover,
    preset,
    sessionKey: `${IMMERSIVE_TOKENS.sessionPageIntroPrefix}${entity.slug || title}`,
  });
}

/**
 * Vitrine / catalog short intro markup.
 */
export function renderVitrineIntro(mediaUrl = "") {
  return ImmersiveIntro({
    brand: "",
    title: "Vitrine de experiências",
    mediaUrl,
    preset: "catalog",
    sessionKey: INTRO_PRESETS.catalog.sessionKey,
  });
}

/**
 * Groups catalog intro markup.
 */
export function renderGroupCatalogIntro({ mediaUrl = "" } = {}) {
  return ImmersiveIntro({
    brand: "",
    title: "Viagens em grupo",
    mediaUrl,
    preset: "groupCatalog",
    sessionKey: INTRO_PRESETS.groupCatalog.sessionKey,
  });
}

/**
 * Home opening intro (also used as CSS-first shell source of truth).
 */
export function renderHomeOpeningIntro({ cssFirst = false } = {}) {
  return ImmersiveIntro({
    brand: "WallTravel",
    line: "Experiências extraordinárias desenhadas com propósito.",
    preset: "home",
    sessionKey: INTRO_PRESETS.home.sessionKey,
    cssFirst,
  });
}

function waitMs(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve("aborted");
      return;
    }
    const id = window.setTimeout(() => resolve("done"), ms);
    const onAbort = () => {
      window.clearTimeout(id);
      resolve("aborted");
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function setIntroInert(on, selector) {
  document.querySelector(".header")?.toggleAttribute("inert", on);
  const target = selector ? document.querySelector(selector) : null;
  (target || document.querySelector(".hero"))?.toggleAttribute("inert", on);
}

function finishIntro(el, key) {
  markSessionIntroPlayed(key);
  setIntroInert(false);
  el.remove();
  const root = document.documentElement;
  root.classList.remove("wt-intro-active", "wt-intro-pending");
  root.classList.add("wt-intro-done");
  delete root.dataset.introState;
  try {
    document.dispatchEvent(new CustomEvent("wt:immersive-intro-end", { detail: { key } }));
  } catch {
    /* ignore */
  }
}

function setIntroState(el, state) {
  el.dataset.introState = state;
  document.documentElement.dataset.introState = state;
}

/** Keep the opening window locked to the real hero box. Does not restart the sequence. */
function bindApertureToHero(aperture, selector) {
  const hero = selector ? document.querySelector(selector) : null;
  if (!hero || !aperture || aperture.classList.contains("wt-intro-aperture--compact")) return () => {};
  const sync = () => {
    const rect = hero.getBoundingClientRect();
    aperture.style.top = `${rect.top}px`;
    aperture.style.left = `${rect.left}px`;
    aperture.style.width = `${rect.width}px`;
    aperture.style.height = `${rect.height}px`;
  };
  sync();
  window.addEventListener("resize", sync, { passive: true });
  window.addEventListener("orientationchange", sync);
  window.visualViewport?.addEventListener("resize", sync, { passive: true });
  return () => {
    window.removeEventListener("resize", sync);
    window.removeEventListener("orientationchange", sync);
    window.visualViewport?.removeEventListener("resize", sync);
  };
}

/**
 * Play ImmersiveIntro once per session key; resolves when finished.
 * Home state machine: ARRIVAL → READING → REVEAL → EXPANDING → HERO → COMPLETE.
 * SKIPPING accelerates the same handoff. It does not cut the frame.
 * Skip via click/tap/scroll/swipe/Escape/Skip button.
 */
export function playPageIntro(root = document) {
  const el =
    root.querySelector?.("[data-wt-page-intro]") || document.querySelector("[data-wt-page-intro]");
  if (!el) return Promise.resolve(false);

  const presetEarly = normalizePreset(
    el.getAttribute("data-intro-preset"),
    el.getAttribute("data-intro-variant"),
  );
  if (presetEarly !== "home") {
    el.remove();
    return Promise.resolve(false);
  }

  const key = el.getAttribute("data-intro-session-key") || IMMERSIVE_TOKENS.sessionIntroKey;
  const preset = normalizePreset(
    el.getAttribute("data-intro-preset"),
    el.getAttribute("data-intro-variant"),
  );
  const cfg = resolveIntroPreset(preset);
  const mobile = isMobileViewport();
  const reduced = prefersReducedMotion();

  if (hasPlayedSessionIntro(key)) {
    el.remove();
    document.documentElement.classList.remove("wt-intro-active", "wt-intro-pending");
    document.documentElement.classList.add("wt-intro-skip");
    delete document.documentElement.dataset.introState;
    return Promise.resolve(false);
  }

  el.hidden = false;
  el.removeAttribute("hidden");
  el.setAttribute("aria-hidden", "false");
  el.classList.add("is-playing");
  document.documentElement.classList.add("wt-intro-active");
  document.documentElement.classList.remove("wt-intro-skip", "wt-intro-pending", "wt-hero-live");

  const exitMs = cfg.exitMs || IMMERSIVE_TOKENS.durationFast;
  el.style.setProperty("--duration-intro-exit", `${exitMs}ms`);

  return new Promise((resolve) => {
    let settled = false;
    let exiting = false;
    let handoffStarted = false;
    let failsafe = 0;
    const ac = new AbortController();
    const { signal } = ac;
    const handoffMode = el.getAttribute("data-intro-handoff") || cfg.handoff || "hero";
    const target = el.getAttribute("data-intro-target") || cfg.target || "";
    const unbindAperture = bindApertureToHero(el.querySelector("[data-intro-aperture]"), target);

    const settle = (played) => {
      if (settled) return;
      settled = true;
      unbindAperture();
      if (failsafe) window.clearTimeout(failsafe);
      try {
        ac.abort();
      } catch {
        /* ignore */
      }
      resolve(played);
    };

    const paintFrame = () =>
      new Promise((resolveFrame) => {
        requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
      });

    const arriveHero = async () => {
      if (handoffStarted || settled) return;
      handoffStarted = true;
      exiting = true;
      try {
        ac.abort();
      } catch {
        /* ignore */
      }
      setIntroState(el, "hero");
      if (handoffMode === "content") {
        el.classList.add("is-content-exit");
        window.setTimeout(() => {
          if (settled) return;
          finishIntro(el, key);
          document.documentElement.classList.add("wt-hero-live");
          document.dispatchEvent(new CustomEvent("wt:hero-live"));
          settle(true);
        }, cfg.contentExitMs || 200);
        return;
      }
      document.documentElement.classList.add("wt-intro-handoff", "wt-intro-receive");
      await paintFrame();
      if (settled) return;
      finishIntro(el, key);
      const heroMs = reduced ? 160 : cfg.heroMs || 480;
      window.setTimeout(() => {
        document.documentElement.classList.add("wt-hero-live");
        document.documentElement.classList.remove("wt-intro-handoff", "wt-intro-receive");
        document.dispatchEvent(new CustomEvent("wt:hero-live"));
        settle(true);
      }, heroMs);
    };

    const paintCount = (n) => {
      const node = el.querySelector("[data-intro-count]");
      if (node) node.textContent = String(n);
    };

    const run = () => {
      const reading = reduced ? cfg.reducedReadingMs : mobile ? cfg.readingMobileMs : cfg.readingMs;
      const reveal = reduced ? 0 : mobile ? cfg.revealMobileMs : cfg.revealMs;
      const expansion = reduced ? 0 : mobile ? cfg.expansionMobileMs : cfg.expansionMs;
      const total = Math.max(1, reading + reveal + expansion);
      el.dataset.introReadingMs = String(reading);
      el.dataset.introRevealMs = String(reveal);
      el.dataset.introExpansionMs = String(expansion);
      el.dataset.introTotalMs = String(total);
      el.style.setProperty("--duration-intro-reading", `${reading}ms`);
      el.style.setProperty("--duration-intro-reveal", `${reveal}ms`);
      el.style.setProperty("--duration-intro-expansion", `${expansion}ms`);
      el.style.setProperty("--easing-intro", IMMERSIVE_TOKENS.easingIntro);
      setIntroInert(true, target);
      setIntroState(el, "reading");
      paintCount(0);

      failsafe = window.setTimeout(() => {
        if (!settled && !handoffStarted) {
          paintCount(100);
          arriveHero();
        }
      }, total + (cfg.heroMs || 0) + 900);

      const t0 = performance.now();
      const frame = () => {
        if (settled || handoffStarted) return;
        const elapsed = performance.now() - t0;
        const p = Math.min(1, elapsed / total);
        paintCount(Math.min(100, Math.round(p * 100)));
        if (!reduced) {
          const state = el.dataset.introState;
          if (elapsed >= reading + reveal && state !== "expanding" && state !== "hero") {
            setIntroState(el, "expanding");
          } else if (elapsed >= reading && state === "reading") {
            setIntroState(el, "reveal");
          }
        }
        if (p < 1) {
          requestAnimationFrame(frame);
          return;
        }
        paintCount(100);
        if (reduced) {
          el.classList.add("is-reduced-exit");
          window.setTimeout(() => {
            if (!settled && !handoffStarted) arriveHero();
          }, cfg.reducedRevealMs || 200);
          return;
        }
        arriveHero();
      };
      requestAnimationFrame(frame);
    };

    run();
  });
}

/** Alias for shared system naming */
export const playImmersiveIntro = playPageIntro;

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
export const PageIntro = ImmersiveIntro;
export const HeroReveal = ImmersiveHero;
export const ImageReveal = MediaReveal;
export const StaggerGroup = SectionReveal;
export const DestinationTransition = DestinationReveal;
export const JourneyTransition = SectionReveal;

export {
  IMMERSIVE_TOKENS,
  INTRO_PRESETS,
  resolveIntroPreset,
  hasPlayedSessionIntro,
  markSessionIntroPlayed,
  prefersReducedMotion,
  isMobileViewport,
};
