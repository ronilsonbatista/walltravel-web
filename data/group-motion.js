/**
 * Group Landing motion system — purposeful, CWV-friendly, reduced-motion aware.
 * Timing: reveal 350–550ms · hover 180–250ms · slow carousel · discreet parallax.
 */

const REVEAL_MS = 450;
const CAROUSEL_MS = 6500;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const reduced = prefersReducedMotion();

  const show = (next) => {
    slides[index]?.classList.remove("is-active");
    index = (next + slides.length) % slides.length;
    slides[index]?.classList.add("is-active");
  };

  slides[0].classList.add("is-active");

  if (!reduced) {
    timer = window.setInterval(() => show(index + 1), CAROUSEL_MS);
  }

  track.querySelectorAll("[data-hero-dot]").forEach((dot) => {
    dot.addEventListener("click", () => {
      const i = Number(dot.getAttribute("data-hero-dot"));
      if (!Number.isFinite(i)) return;
      if (timer) {
        clearInterval(timer);
        timer = reduced
          ? null
          : window.setInterval(() => show(index + 1), CAROUSEL_MS);
      }
      show(i);
    });
  });

  return () => {
    if (timer) clearInterval(timer);
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

export function initGroupLightbox(root) {
  const triggers = root.querySelectorAll("[data-lightbox-src]");
  if (!triggers.length) return () => {};

  let overlay = document.querySelector(".group-lightbox");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "group-lightbox";
    overlay.hidden = true;
    overlay.innerHTML = `
      <button type="button" class="group-lightbox-close" aria-label="Fechar">×</button>
      <img class="group-lightbox-img" alt="">
    `;
    document.body.appendChild(overlay);
  }

  const img = overlay.querySelector(".group-lightbox-img");
  const closeBtn = overlay.querySelector(".group-lightbox-close");

  const close = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  const open = (src, alt) => {
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
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const onKey = (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  };
  document.addEventListener("keydown", onKey);

  return () => {
    triggers.forEach((el) => el.removeEventListener("click", onTrigger));
    document.removeEventListener("keydown", onKey);
    close();
  };
}

export function initItineraryProgress(root) {
  const rail = root.querySelector("[data-itinerary-progress]");
  const items = root.querySelectorAll("[data-itinerary-step]");
  if (!rail || !items.length || prefersReducedMotion()) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-active");
        }
      });
      const active = Array.from(items).filter((el) =>
        el.classList.contains("is-active"),
      ).length;
      const pct = Math.round((active / items.length) * 100);
      rail.style.setProperty("--itinerary-progress", `${pct}%`);
    },
    { threshold: 0.35 },
  );

  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export function bindGroupExperience(root) {
  const cleanups = [
    initGroupHeroCarousel(root),
    initGroupReveals(root),
    initGroupParallax(root),
    initGroupLightbox(root),
    initItineraryProgress(root),
  ];
  return () => cleanups.forEach((fn) => fn && fn());
}

export { prefersReducedMotion, REVEAL_MS };
