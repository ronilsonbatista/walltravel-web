/**
 * Group Landing Creative V2 — motion + interaction.
 * Reveal ~450ms · hover ~220ms · slow carousel · discreet parallax · reduced-motion.
 */

const REVEAL_MS = 450;
const CAROUSEL_MS = 7000;

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
  let progressRaf = null;
  let startedAt = 0;
  let paused = false;
  const reduced = prefersReducedMotion();
  const counter = track.querySelector("[data-hero-counter]");
  const progress = track.querySelector("[data-hero-progress] span");
  const thumbs = track.querySelectorAll("[data-hero-dot]");
  const total = slides.length;

  const syncChrome = () => {
    if (counter) counter.textContent = `${pad2(index + 1)} / ${pad2(total)}`;
    thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));
  };

  const stopProgress = () => {
    if (progressRaf) cancelAnimationFrame(progressRaf);
    progressRaf = null;
  };

  const tickProgress = () => {
    if (!progress || paused || reduced) return;
    const elapsed = performance.now() - startedAt;
    const pct = Math.min(1, elapsed / CAROUSEL_MS);
    progress.style.transform = `scaleX(${pct})`;
    if (pct < 1) progressRaf = requestAnimationFrame(tickProgress);
  };

  const armTimer = () => {
    if (timer) clearInterval(timer);
    stopProgress();
    if (reduced || paused) return;
    startedAt = performance.now();
    if (progress) progress.style.transform = "scaleX(0)";
    progressRaf = requestAnimationFrame(tickProgress);
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
    stopProgress();
  };

  const resume = () => {
    if (reduced) return;
    paused = false;
    armTimer();
  };

  const onInteract = (next) => {
    pause();
    show(next);
    // Brief pause then resume autoplay
    window.setTimeout(resume, 1200);
  };

  track.querySelector("[data-hero-prev]")?.addEventListener("click", () => onInteract(index - 1));
  track.querySelector("[data-hero-next]")?.addEventListener("click", () => onInteract(index + 1));

  thumbs.forEach((dot) => {
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
    stopProgress();
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

export function initItineraryProgress(root) {
  const rail = root.querySelector("[data-itinerary-progress]");
  const items = root.querySelectorAll("[data-itinerary-step]");
  const railItems = root.querySelectorAll("[data-itinerary-rail-item]");
  if (!items.length) return () => {};

  if (prefersReducedMotion()) {
    items.forEach((el) => el.classList.add("is-active"));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-active");
          const day = entry.target.getAttribute("data-day");
          railItems.forEach((ri) => {
            ri.classList.toggle(
              "is-active",
              ri.getAttribute("data-itinerary-rail-item") === day,
            );
          });
        }
      });
      const active = Array.from(items).filter((el) =>
        el.classList.contains("is-active"),
      ).length;
      const pct = Math.round((active / items.length) * 100);
      if (rail) {
        rail.style.setProperty("--itinerary-progress", `${pct}%`);
        const fill = rail.querySelector("span");
        if (fill) fill.style.height = `${pct}%`;
      }
    },
    { threshold: 0.35 },
  );

  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export function initRouteMap(root) {
  const map = root.querySelector("[data-group-route-map]");
  if (!map) return () => {};

  const panel = map.querySelector("[data-map-panel]");
  const panelBody = map.querySelector("[data-map-panel-body]");
  const path = map.querySelector("[data-map-path]");
  const chips = map.querySelectorAll("[data-map-payload]");
  const svgStops = map.querySelectorAll(".group-map-stop");

  const payloads = {};
  const escText = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  chips.forEach((chip) => {
    const i = chip.getAttribute("data-map-stop");
    try {
      const raw = chip.getAttribute("data-map-payload") || "";
      payloads[i] = JSON.parse(decodeURIComponent(raw) || "{}");
    } catch {
      payloads[i] = {};
    }
  });

  const renderPanel = (data) => {
    if (!panel || !panelBody || !data?.name) return;
    const photo = data.photo ? escText(data.photo) : "";
    panelBody.innerHTML = `
      ${photo ? `<img class="group-map-panel-photo" src="${photo}" alt="" loading="lazy">` : ""}
      <h3>${escText(data.name)}</h3>
      ${data.nights ? `<p class="group-map-panel-nights">${escText(data.nights)}</p>` : ""}
      ${data.hotel ? `<p class="group-map-panel-hotel">${escText(data.hotel)}</p>` : ""}
      ${data.transportNext ? `<p class="group-map-panel-transport">${escText(data.transportNext)}</p>` : ""}
    `;
    panel.hidden = false;
  };

  const activate = (i) => {
    svgStops.forEach((s) =>
      s.classList.toggle("is-active", s.getAttribute("data-map-stop") === String(i)),
    );
    chips.forEach((c) =>
      c.classList.toggle("is-active", c.getAttribute("data-map-stop") === String(i)),
    );
    renderPanel(payloads[i]);
  };

  const onChip = (e) => {
    const btn = e.currentTarget;
    activate(btn.getAttribute("data-map-stop"));
  };
  chips.forEach((c) => c.addEventListener("click", onChip));

  const onSvg = (e) => {
    const g = e.currentTarget;
    activate(g.getAttribute("data-map-stop"));
  };
  svgStops.forEach((s) => {
    s.addEventListener("click", onSvg);
    s.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSvg(e);
      }
    });
    s.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        activate(s.getAttribute("data-map-stop"));
      }
    });
  });

  map.querySelector("[data-map-panel-close]")?.addEventListener("click", () => {
    if (panel) panel.hidden = true;
  });

  // Draw path on viewport
  if (path && !prefersReducedMotion()) {
    const len = path.getTotalLength?.() || 800;
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          path.classList.add("is-drawn");
          path.style.strokeDashoffset = "0";
          io.disconnect();
        });
      },
      { threshold: 0.35 },
    );
    io.observe(map);
  } else if (path) {
    path.classList.add("is-drawn");
  }

  // Default first stop
  activate("0");

  return () => {
    chips.forEach((c) => c.removeEventListener("click", onChip));
  };
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
  return () => cleanups.forEach((fn) => fn && fn());
}

export { prefersReducedMotion, REVEAL_MS };
