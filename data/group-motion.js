/**
 * Group Landing Creative V2 — motion + interaction.
 * Reveal ~450ms · hover ~220ms · slow carousel · discreet parallax · reduced-motion.
 */

const REVEAL_MS = 450;
/** Match Home hero autoplay cadence (progress-bar fill duration). */
const CAROUSEL_MS = 5000;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function heroSlides(root) {
  return Array.from(root.querySelectorAll(".group-hero-slide"));
}

export function initGroupHeroCarousel(root) {
  const track = root.querySelector("[data-group-hero-carousel]");
  if (!track) return () => {};

  const slides = heroSlides(track);
  if (slides.length <= 1) {
    slides[0]?.classList.add("is-active");
    return () => {};
  }

  let index = 0;
  let timer = null;
  let paused = false;
  let resumeTimer = null;
  const reduced = prefersReducedMotion();
  const counter = track.querySelector("[data-hero-counter]");
  const progressTracks = Array.from(track.querySelectorAll("[data-hero-dot]"));
  const total = slides.length;

  const activeFill = () =>
    track.querySelector(".group-hero-progress-track.is-active .group-hero-progress-fill");

  const syncChrome = () => {
    if (counter) counter.textContent = `${pad2(index + 1)} / ${pad2(total)}`;
    progressTracks.forEach((t, i) => {
      const on = i === index;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
  };

  /** Restart CSS width transition on the active progress fill (Home primitive). */
  const restartProgressFill = () => {
    const fill = activeFill();
    if (!fill) return;
    fill.style.transition = "none";
    fill.style.width = "0%";
    // Force reflow so the next transition always starts from 0.
    void fill.offsetWidth;
    if (reduced || paused) {
      fill.style.width = "0%";
      return;
    }
    fill.style.transition = `width ${CAROUSEL_MS}ms linear`;
    fill.style.width = "100%";
  };

  const armTimer = () => {
    if (timer) clearInterval(timer);
    timer = null;
    if (reduced || paused) return;
    restartProgressFill();
    timer = window.setInterval(() => show(index + 1), CAROUSEL_MS);
  };

  const show = (next) => {
    slides[index]?.classList.remove("is-active");
    index = ((next % total) + total) % total;
    slides[index]?.classList.add("is-active");
    syncChrome();
    armTimer();
  };

  slides[0].classList.add("is-active");
  syncChrome();
  armTimer();

  const pause = () => {
    paused = true;
    if (timer) clearInterval(timer);
    timer = null;
    const fill = activeFill();
    if (fill) fill.style.animationPlayState = "paused";
    // Freeze width mid-transition
    if (fill) {
      const computed = getComputedStyle(fill).width;
      fill.style.transition = "none";
      fill.style.width = computed;
    }
  };

  const resume = () => {
    if (reduced) return;
    paused = false;
    armTimer();
  };

  const onInteract = (next) => {
    if (resumeTimer) clearTimeout(resumeTimer);
    pause();
    show(next);
    // Reset progress + brief pause, then resume autoplay
    resumeTimer = window.setTimeout(resume, 1200);
  };

  track.querySelector("[data-hero-prev]")?.addEventListener("click", () => onInteract(index - 1));
  track.querySelector("[data-hero-next]")?.addEventListener("click", () => onInteract(index + 1));

  progressTracks.forEach((dot) => {
    dot.addEventListener("click", () => {
      const i = Number(dot.getAttribute("data-hero-dot"));
      if (!Number.isFinite(i)) return;
      onInteract(i);
    });
  });

  // Swipe
  let touchX = null;
  const onTouchStart = (e) => {
    touchX = e.changedTouches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX == null) return;
    const x = e.changedTouches?.[0]?.clientX;
    if (x == null) return;
    const dx = x - touchX;
    touchX = null;
    if (Math.abs(dx) < 40) return;
    onInteract(dx < 0 ? index + 1 : index - 1);
  };
  track.addEventListener("touchstart", onTouchStart, { passive: true });
  track.addEventListener("touchend", onTouchEnd, { passive: true });

  // Keyboard when hero focused / page on group
  const onKey = (e) => {
    if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onInteract(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onInteract(index + 1);
    }
  };
  document.addEventListener("keydown", onKey);

  track.addEventListener("mouseenter", pause);
  track.addEventListener("mouseleave", resume);
  track.addEventListener("focusin", pause);
  track.addEventListener("focusout", (e) => {
    if (!track.contains(e.relatedTarget)) resume();
  });

  return () => {
    if (timer) clearInterval(timer);
    if (resumeTimer) clearTimeout(resumeTimer);
    document.removeEventListener("keydown", onKey);
    track.removeEventListener("touchstart", onTouchStart);
    track.removeEventListener("touchend", onTouchEnd);
  };
}

export function initGroupReveals(root) {
  const targets = root.querySelectorAll("[data-reveal]");
  if (!targets.length) return () => {};

  if (prefersReducedMotion()) {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.getAttribute("data-reveal-delay") || 0);
        window.setTimeout(() => el.classList.add("is-revealed"), delay);
        io.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  targets.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export function initGroupParallax(root) {
  const layers = root.querySelectorAll("[data-parallax]");
  if (!layers.length || prefersReducedMotion()) return () => {};

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      layers.forEach((el) => {
        const factor = Number(el.getAttribute("data-parallax") || 0.08);
        const offset = Math.min(48, y * factor);
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
}

/** Lazy lightbox — code-split via dynamic import path simulated as deferred DOM. */
export function initGroupLightbox(root) {
  const triggers = root.querySelectorAll("[data-lightbox-src]");
  if (!triggers.length) return () => {};

  let overlay = null;
  let img = null;
  let loaded = false;

  const ensure = () => {
    if (loaded) return;
    loaded = true;
    overlay = document.createElement("div");
    overlay.className = "group-lightbox";
    overlay.hidden = true;
    overlay.innerHTML = `
      <button type="button" class="group-lightbox-close" aria-label="Fechar">×</button>
      <img class="group-lightbox-img" alt="">
    `;
    document.body.appendChild(overlay);
    img = overlay.querySelector(".group-lightbox-img");
    overlay.querySelector(".group-lightbox-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  };

  const close = () => {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  const open = (src, alt) => {
    ensure();
    img.src = src;
    img.alt = alt || "";
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const onTrigger = (e) => {
    const btn = e.currentTarget;
    const src = btn.getAttribute("data-lightbox-src");
    if (!src) return;
    open(src, btn.getAttribute("data-lightbox-alt") || "");
  };

  triggers.forEach((el) => el.addEventListener("click", onTrigger));

  const onKey = (e) => {
    if (e.key === "Escape" && overlay && !overlay.hidden) close();
  };
  document.addEventListener("keydown", onKey);

  return () => {
    triggers.forEach((el) => el.removeEventListener("click", onTrigger));
    document.removeEventListener("keydown", onKey);
    close();
    if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
  };
}

export function initItineraryExplorer(root) {
  const section = root.querySelector("[data-itinerary-explorer]");
  if (!section) return () => {};

  const panels = Array.from(section.querySelectorAll("[data-itinerary-panel]"));
  const buttons = Array.from(section.querySelectorAll("[data-itinerary-day-btn]"));
  const counter = section.querySelector("[data-itinerary-counter]");
  const meter = section.querySelector("[data-itinerary-meter] span");
  const total = panels.length;
  if (!total) return () => {};

  let index = 0;

  const sync = () => {
    panels.forEach((p, i) => {
      const on = i === index;
      p.classList.toggle("is-active", on);
      p.setAttribute("aria-hidden", on ? "false" : "true");
    });
    buttons.forEach((b) => {
      const i = Number(b.getAttribute("data-itinerary-index"));
      const on = i === index;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (counter) {
      counter.textContent = `${pad2(index + 1)} / ${pad2(total)}`;
    }
    if (meter) {
      meter.style.transform = `scaleX(${(index + 1) / total})`;
    }
  };

  const go = (next) => {
    index = ((next % total) + total) % total;
    sync();
    const activeBtn = buttons.find(
      (b) => Number(b.getAttribute("data-itinerary-index")) === index,
    );
    activeBtn?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-itinerary-index"));
      if (!Number.isFinite(i)) return;
      go(i);
    });
  });

  section.querySelector("[data-itinerary-prev]")?.addEventListener("click", () => go(index - 1));
  section.querySelector("[data-itinerary-next]")?.addEventListener("click", () => go(index + 1));

  const stage = section.querySelector("[data-itinerary-stage]");
  let touchX = null;
  const onTouchStart = (e) => {
    touchX = e.changedTouches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX == null) return;
    const x = e.changedTouches?.[0]?.clientX;
    if (x == null) return;
    const dx = x - touchX;
    touchX = null;
    if (Math.abs(dx) < 40) return;
    go(dx < 0 ? index + 1 : index - 1);
  };
  stage?.addEventListener("touchstart", onTouchStart, { passive: true });
  stage?.addEventListener("touchend", onTouchEnd, { passive: true });

  const onKey = (e) => {
    if (!section.contains(document.activeElement) && document.activeElement !== document.body) {
      return;
    }
    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.2;
    if (!inView) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  };
  document.addEventListener("keydown", onKey);

  sync();

  return () => {
    document.removeEventListener("keydown", onKey);
    stage?.removeEventListener("touchstart", onTouchStart);
    stage?.removeEventListener("touchend", onTouchEnd);
  };
}

/** @deprecated scroll-rail progress replaced by explorer */
export function initItineraryProgress(root) {
  return initItineraryExplorer(root);
}

export function initJourneyLine(root) {
  const journey = root.querySelector("[data-group-journey]");
  if (!journey) return () => {};

  const nodes = Array.from(journey.querySelectorAll("[data-journey-node]"));
  const stops = Array.from(journey.querySelectorAll("[data-journey-stop]"));
  const panelBody = journey.querySelector("[data-journey-panel-body]");
  if (!nodes.length) return () => {};

  const escText = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const payloads = {};
  nodes.forEach((node) => {
    const i = node.getAttribute("data-journey-node");
    try {
      const raw = node.getAttribute("data-journey-payload") || "";
      payloads[i] = JSON.parse(decodeURIComponent(raw) || "{}");
    } catch {
      payloads[i] = {};
    }
  });

  const renderPanel = (i, data) => {
    if (!panelBody || !data?.name) return;
    const photo = data.photo ? escText(data.photo) : "";
    const total = nodes.length;
    panelBody.innerHTML = `
      ${photo ? `<img class="group-journey-panel-photo" src="${photo}" alt="" loading="lazy">` : ""}
      <p class="group-journey-panel-idx">${pad2(Number(i) + 1)} / ${pad2(total)}</p>
      <h3>${escText(data.name)}</h3>
      ${data.nights ? `<p class="group-journey-panel-nights">${escText(data.nights)}</p>` : ""}
      ${data.hotel ? `<p class="group-journey-panel-hotel">${escText(data.hotel)}</p>` : ""}
      ${data.transportNext ? `<p class="group-journey-panel-transport">${escText(data.transportNext)}</p>` : ""}
    `;
  };

  const activate = (i) => {
    const key = String(i);
    stops.forEach((s) =>
      s.classList.toggle("is-active", s.getAttribute("data-journey-stop") === key),
    );
    nodes.forEach((n) => {
      const on = n.getAttribute("data-journey-node") === key;
      n.classList.toggle("is-active", on);
      n.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderPanel(i, payloads[key]);
    const active = nodes.find((n) => n.getAttribute("data-journey-node") === key);
    active?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  nodes.forEach((node) => {
    node.addEventListener("click", () => activate(node.getAttribute("data-journey-node")));
    node.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        activate(node.getAttribute("data-journey-node"));
      }
    });
  });

  activate("0");
  return () => {};
}

/** @deprecated map replaced by journey line */
export function initRouteMap(root) {
  return initJourneyLine(root);
}

export function initScrollProgress(root) {
  const bar = root.querySelector("[data-group-scroll-progress] span");
  if (!bar) return () => {};

  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = `scaleX(${pct})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
}

export function initSubnavSpy(root) {
  const subnav = root.querySelector("[data-group-subnav]");
  if (!subnav) return () => {};

  const links = Array.from(subnav.querySelectorAll("a[href^='#']"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id));
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
  );

  sections.forEach((s) => io.observe(s));

  // Stick subnav after hero
  const hero = root.querySelector(".group-hero");
  const onScroll = () => {
    if (!hero) return;
    const past = window.scrollY > hero.offsetHeight - 40;
    subnav.classList.toggle("is-stuck", past);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  return () => {
    io.disconnect();
    window.removeEventListener("scroll", onScroll);
  };
}

export function bindGroupExperience(root) {
  const cleanups = [
    initGroupHeroCarousel(root),
    initGroupReveals(root),
    initGroupParallax(root),
    initGroupLightbox(root),
    initItineraryProgress(root),
    initRouteMap(root),
    initScrollProgress(root),
    initSubnavSpy(root),
  ];

  // Analytics hooks (Phase 14) — soft dependency
  root.addEventListener(
    "click",
    (e) => {
      const dayBtn = e.target.closest?.("[data-itinerary-day-btn]");
      if (dayBtn) {
        try {
          import("./storefront-events.js").then((m) =>
            m.trackGroupInteraction?.("itinerary", {
              day: dayBtn.getAttribute("data-itinerary-day-btn"),
            }),
          );
        } catch {
          /* ignore */
        }
      }
      const journey = e.target.closest?.("[data-journey-node]");
      if (journey) {
        try {
          import("./storefront-events.js").then((m) =>
            m.trackGroupInteraction?.("journey", {
              stop: journey.getAttribute("data-journey-node"),
            }),
          );
        } catch {
          /* ignore */
        }
      }
      const gallery = e.target.closest?.("[data-lightbox-src]");
      if (gallery) {
        try {
          import("./storefront-events.js").then((m) =>
            m.trackGroupInteraction?.("gallery", {}),
          );
        } catch {
          /* ignore */
        }
      }
      const specialist = e.target.closest?.(".group-specialist-link, [data-specialist-cta]");
      if (specialist) {
        try {
          import("./storefront-events.js").then((m) =>
            m.trackStorefrontEvent?.("specialist_cta", {
              path: window.location.pathname,
            }),
          );
        } catch {
          /* ignore */
        }
      }
    },
    true,
  );

  return () => cleanups.forEach((fn) => fn && fn());
}

export { prefersReducedMotion, REVEAL_MS };
