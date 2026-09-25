import { 
  getOrderedHeroSlides, 
  getCategories,
  getFeaturedCategories,
  getCategoryBySlug, 
  getPackagesByCategory, 
  hydrateStorefront,
  getStorefrontSource,
  getStorefrontHydrateError,
  resolvePackageBySlug,
} from './data/helpers.js';
import {
  hydrateGroups,
  getGroups,
  resolveGroupBySlug,
} from './data/groups-helpers.js';
import {
  renderVitrineCategoryCard,
  renderCategoryHeroImage,
} from './data/storefront-render.js';
import {
  renderGroupsCatalog,
  renderGroupDetailPage,
  bindGroupForms,
} from './data/group-render.js';
import {
  trackStorefrontEvent,
  bindWhatsappTracking,
  bindAnalyticsPageHooks,
} from './data/storefront-events.js';
import { getWhatsappNumber } from './data/platform-api.js';
import { buildWhatsAppCTA, hydrateWhatsAppCTAs } from './data/whatsapp-cta.js';
import {
  renderHomeOpeningIntro,
  renderDestinationExplorer,
  playPageIntro,
  initDestinationExplorer,
  hasPlayedSessionIntro,
  prefersReducedMotion as immersivePrefersReducedMotion,
  IMMERSIVE_TOKENS,
} from './data/immersive/primitives.js';

/** Lazy-load motion/experience modules — not needed for first paint on Home. */
async function loadGroupExperienceBinder() {
  const mod = await import('./data/group-motion.js');
  return mod.bindGroupExperience;
}
async function loadExperienceRenderer() {
  const mod = await import('./data/experience-render.js');
  return mod.renderExperienceDetailPage;
}

document.addEventListener('DOMContentLoaded', async () => {
  const bootPathEarly = window.location.pathname;
  const bootIsHomeEarly = bootPathEarly === "/" || bootPathEarly === "/index.html";
  let homeIntroPromise = Promise.resolve(false);
  if (bootIsHomeEarly && document.querySelector("[data-wt-page-intro][data-intro-preset='home']")) {
    homeIntroPromise = playPageIntro(document.getElementById("home-view") || document);
  }

  const WA = getWhatsappNumber();
  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  await Promise.all([hydrateStorefront(), hydrateGroups()]);
  hydrateWhatsAppCTAs(document);
  bindWhatsappTracking(document);

  const bootPath = window.location.pathname;
  const bootIsHome = bootPath === "/" || bootPath === "/index.html";
  const deferHomePageView =
    bootIsHome &&
    !hasPlayedSessionIntro(IMMERSIVE_TOKENS.sessionIntroKey) &&
    !immersivePrefersReducedMotion();
  bindAnalyticsPageHooks(document, { deferPageView: deferHomePageView });

  const renderHomeDestinosExplorer = () => {
    const mount = document.getElementById('destinos-explorer');
    if (!mount) return;
    const featured = getFeaturedCategories();
    const pool = featured.length ? featured : getCategories();
    const destinations = pool.slice(0, 4).map((cat) => {
      const count = cat.packageCount || 0;
      return {
        name: cat.name,
        description: cat.description || "",
        image: cat.image || "",
        href: `/vitrine/${cat.slug}`,
        meta: count ? `${count} ${count === 1 ? "experiência" : "experiências"}` : "Curadoria WallTravel",
      };
    });
    mount.innerHTML = renderDestinationExplorer(destinations, esc);
    initDestinationExplorer(mount);
  };

  const updateFooterDestinosLinks = () => {
    const list = document.getElementById('footer-destinos-links');
    if (!list) return;
    const categories = getCategories();
    const dynamic = categories
      .slice(0, 5)
      .map(
        (cat) =>
          `<li><a href="/vitrine/${esc(cat.slug)}">${esc(cat.name)}</a></li>`,
      )
      .join('');
    list.innerHTML = `
      ${dynamic}
      <li><a href="/vitrine">Vitrine completa</a></li>
      <li><a href="/grupos">Viagens em grupo</a></li>
    `;
  };

  renderHomeDestinosExplorer();
  updateFooterDestinosLinks();

  // Home opening intro — CSS-first shell already in HTML; ensure markup once
  const homeIntroMount = document.getElementById("wt-home-intro-mount");
  if (homeIntroMount) {
    if (document.documentElement.classList.contains("wt-intro-skip")) {
      homeIntroMount.querySelector("[data-wt-page-intro]")?.remove();
    } else if (!homeIntroMount.querySelector("[data-wt-page-intro]")) {
      homeIntroMount.innerHTML = renderHomeOpeningIntro({ cssFirst: true });
    }
  }

  if (getStorefrontSource() === "local" && getStorefrontHydrateError()) {
    const banner = document.createElement("div");
    banner.className = "wt-storefront-fallback";
    banner.setAttribute("role", "status");
      banner.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;z-index:900;background:var(--surface-olive,#3F4328);color:var(--text-inverse,#F6F1E8);padding:0.65rem 1rem;padding-bottom:max(0.65rem, env(safe-area-inset-bottom, 0px));text-align:center;font-size:0.85rem;pointer-events:none;";
    banner.textContent =
      "Catálogo temporariamente em modo local — tente novamente em instantes.";
    document.body.prepend(banner);
  }
  // ==========================================================================
  // GLOBAL IMAGE ERROR FALLBACK (BUILT-IN PREMIUM RESCUE)
  // ==========================================================================
  window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
      // Prevent loop if fallback itself is missing
      if (!e.target.src.endsWith('/images/vitrine/fallback.svg')) {
        e.target.src = '/images/vitrine/fallback.svg';
      }
    }
  }, true);

  // ==========================================================================
  // DYNAMIC SEO META-TAGS HELPER
  // ==========================================================================
  const updateSEO = (title, description, ogImage) => {
    document.title = `${title} | WallTravel`;
    
    // Meta Description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      document.head.appendChild(descMeta);
    }
    descMeta.content = description;
    
    // OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
    
    // OG Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = description;
    
    // OG Image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.content = ogImage || '/images/vitrine/noronha.jpg';
    
    // Twitter Image
    let twImg = document.querySelector('meta[name="twitter:image"]');
    if (twImg) twImg.content = ogImage || '/images/vitrine/noronha.jpg';
  };

  /** Staging / preview: noindex. Production host stays indexable unless VITE_NOINDEX=true. */
  const applyStagingNoindex = () => {
    const host = window.location.hostname || "";
    const envFlag =
      import.meta.env.VITE_NOINDEX === "true" || import.meta.env.VITE_NOINDEX === "1";
    const stagingHost =
      /\bstaging\b/i.test(host) ||
      /\.vercel\.app$/i.test(host) ||
      /\.up\.railway\.app$/i.test(host);
    if (!envFlag && !stagingHost) return;
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = "noindex, nofollow";
  };
  applyStagingNoindex();

  // ==========================================================================
  // 1. STICKY HEADER SCROLL EFFECT (DYNAMIC TRANSPARENT -> SCROLLED)
  // Shared Home header: transparent over home + group heroes; solid otherwise.
  // ==========================================================================
  const header = document.querySelector('.header');
  let groupExperienceCleanup = null;

  const isHomePath = (path) => path === '/' || path === '/index.html';
  const isGroupDetailPath = (path) =>
    path.startsWith('/grupos/') && path !== '/grupos/' && path.length > '/grupos/'.length;
  const isGroupsCatalogPath = (path) => path === '/grupos' || path === '/grupos/';

  const handleHeaderScroll = () => {
    const path = window.location.pathname;
    if (isHomePath(path)) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      return;
    }

    const mobileOverlay = window.matchMedia("(max-width: 768px)").matches;
    if (
      mobileOverlay &&
      (path === "/vitrine" || path === "/vitrine/" || path.startsWith("/vitrine/") || path.startsWith("/viagens/") || path.startsWith("/pacote/"))
    ) {
      const band = document.querySelector(".wt-vitrine-mast, #package-view .group-hero, #category-view .category-hero-right");
      if (band) {
        header.classList.toggle("scrolled", window.scrollY > Math.max(48, band.offsetHeight * 0.45));
        return;
      }
    }

    if (isGroupDetailPath(path) || isGroupsCatalogPath(path)) {
      const hero =
        document.querySelector('[data-group-over-hero] .group-hero') ||
        document.querySelector('[data-group-over-hero] .groups-intro-hero');
      if (hero) {
        const threshold = Math.max(80, hero.offsetHeight * 0.55);
        if (window.scrollY > threshold) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        return;
      }
    }

    // Other subpages: solid header
    header.classList.add('scrolled');
  };

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll(); // Run once at init

  // ==========================================================================
  // 2. MOBILE MENU INTERACTION (ACCESSIBLE & COMPREHENSIVE CLOSED TRIGGERS)
  // ==========================================================================
  const menuBtn = document.querySelector('.menu-btn');
  const navMenu = document.getElementById('nav-menu') || document.querySelector('nav.nav-menu');
  const navLinks = navMenu ? navMenu.querySelectorAll('a') : [];

  const setMobileMenuOpen = (open) => {
    if (!menuBtn || !navMenu) return;
    menuBtn.classList.toggle('active', open);
    navMenu.classList.toggle('active', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (window.matchMedia('(max-width: 768px)').matches) {
      navMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    } else {
      navMenu.removeAttribute('aria-hidden');
    }
    document.body.classList.toggle('nav-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  const syncMobileNavA11y = () => {
    if (!navMenu) return;
    if (window.matchMedia('(max-width: 768px)').matches) {
      const open = navMenu.classList.contains('active');
      navMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    } else {
      navMenu.removeAttribute('aria-hidden');
      setMobileMenuOpen(false);
    }
  };
  syncMobileNavA11y();
  window.addEventListener('resize', syncMobileNavA11y, { passive: true });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!navMenu.classList.contains('active'));
  };

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const path = window.location.pathname;
        const targetHref = link.getAttribute('href');
        
        if (targetHref && (targetHref.startsWith('#') || targetHref.startsWith('/#'))) {
          // Extract visual element ID from path (converts "/#sobre" -> "#sobre")
          let anchorId = targetHref;
          if (anchorId.startsWith('/#')) anchorId = anchorId.substring(1);
          
          if (path !== '/' && path !== '/index.html') {
            e.preventDefault();
            window.history.pushState(null, '', '/' + anchorId);
            handleRouting();
            setTimeout(() => {
              const element = document.querySelector(anchorId);
              if (element) {
                const headerHeight = header.offsetHeight;
                window.scrollTo({
                  top: element.getBoundingClientRect().top + window.scrollY - headerHeight,
                  behavior: 'smooth'
                });
              }
            }, 150);
          }
        }
        
        if (navMenu.classList.contains('active')) {
          setMobileMenuOpen(false);
        }
      });
    });

    // Close mobile menu when clicking outside of it
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('active')) {
        if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
          setMobileMenuOpen(false);
        }
      }
    });

    // Close mobile menu on ESC key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        setMobileMenuOpen(false);
        menuBtn.focus();
      }
    });
  }

  // ==========================================================================
  // 3. HERO AUTOMATIC FULLSCREEN SLIDESHOW & TEXT CARD SYNC (FROM JSON)
  // ==========================================================================
  const heroSlidesData = getOrderedHeroSlides();
  let currentIndex = 0;
  const heroRoot = document.querySelector('.hero');
  const slides = document.querySelectorAll('.hero-slide');
  const progressTracks = document.querySelectorAll('.progress-bar-track');
  const cardTitleEl = document.getElementById('slide-card-title');
  const cardDescEl = document.getElementById('slide-card-desc');
  const cardCtaEl = document.getElementById('slide-card-cta');
  const numberIndicatorEl = document.getElementById('slide-number-indicator');
  const slideCard = document.getElementById('hero-slide-card');
  let autoplayInterval;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;
  const padSlide = (n) => String(n).padStart(2, '0');

  /** First slide is eager on Home only; later slides use data-src until needed. */
  const hydrateHeroImage = (slideEl) => {
    const img = slideEl?.querySelector?.('.hero-slide-img');
    if (!img || img.dataset.hydrated === '1') return;
    const picture = img.closest('picture');
    const source = picture?.querySelector('source[data-srcset]');
    if (source?.dataset.srcset) {
      source.srcset = source.dataset.srcset;
      delete source.dataset.srcset;
    }
    if (img.dataset.src) {
      img.src = img.dataset.src;
      delete img.dataset.src;
    }
    img.dataset.hydrated = '1';
  };

  const injectHeroPreload = (href) => {
    if (!href || document.querySelector(`link[data-hero-preload="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.type = 'image/webp';
    link.setAttribute('fetchpriority', 'high');
    link.dataset.heroPreload = href;
    document.head.appendChild(link);
  };

  const prefetchHeroSlide = (index) => {
    if (!slides.length) return;
    const i = ((index % slides.length) + slides.length) % slides.length;
    hydrateHeroImage(slides[i]);
  };

  const applySlideVisuals = (slideInfo) => {
    if (!slideInfo || !heroRoot) return;
    heroRoot.setAttribute('data-hero-overlay', slideInfo.overlay || 'balanced');
    const activeSlide = slides[currentIndex];
    const img = activeSlide?.querySelector('.hero-slide-img');
    if (img) {
      const pos = isMobileViewport()
        ? slideInfo.objectPositionMobile || 'center center'
        : slideInfo.objectPositionDesktop || 'center center';
      img.style.objectPosition = pos;
    }
  };

  const changeSlide = (index) => {
    if (slides.length === 0 || heroSlidesData.length === 0) return;
    
    // Remove active state from current slide and track
    slides[currentIndex].classList.remove('active');
    progressTracks[currentIndex]?.classList.remove('active');

    currentIndex = index;

    // Hydrate target + prefetch only the next slide (not the full catalog)
    hydrateHeroImage(slides[currentIndex]);
    prefetchHeroSlide(currentIndex + 1);

    // Add active state to new slide and track
    slides[currentIndex].classList.add('active');
    progressTracks[currentIndex]?.classList.add('active');

    const slideInfo = heroSlidesData[currentIndex];
    applySlideVisuals(slideInfo);

    // Fade and transition the destination card on the right
    if (slideCard && slideInfo) {
      slideCard.style.opacity = 0;
      slideCard.style.transform = 'translateY(8px)';
      setTimeout(() => {
        if (cardTitleEl) cardTitleEl.textContent = slideInfo.title;
        if (cardDescEl) cardDescEl.textContent = slideInfo.subtitle;
        if (cardCtaEl) {
          const label = slideInfo.ctaLabel || "Planejar minha viagem";
          const svg = cardCtaEl.querySelector("svg");
          cardCtaEl.textContent = label;
          if (svg) {
            cardCtaEl.appendChild(document.createTextNode(" "));
            cardCtaEl.appendChild(svg);
          }
          const cta = buildWhatsAppCTA({
            pageType: 'HOME',
            placement: 'hero-slide',
            entity: { name: slideInfo.title, slug: slideInfo.id },
            customMessage: slideInfo.ctaWhatsappMessage,
            source: 'home-hero-slide',
          });
          cardCtaEl.href = cta.href;
          cardCtaEl.setAttribute('data-wa-analytics', JSON.stringify(cta.analytics));
        }
        if (numberIndicatorEl) {
          numberIndicatorEl.textContent = `${padSlide(currentIndex + 1)} / ${padSlide(slides.length)}`;
        }
        slideCard.style.opacity = 1;
        slideCard.style.transform = 'translateY(0)';
      }, 300);
    } else if (numberIndicatorEl) {
      numberIndicatorEl.textContent = `${padSlide(currentIndex + 1)} / ${padSlide(slides.length)}`;
    }

    if (!prefersReducedMotion) {
      startAutoplay();
    }
  };

  const homeIntroBlocking = () => {
    const root = document.documentElement;
    if (root.classList.contains("wt-intro-pending") || root.classList.contains("wt-intro-active")) {
      return true;
    }
    return root.classList.contains("wt-intro-done") && !root.classList.contains("wt-hero-live");
  };

  const startAutoplay = () => {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/index.html') return; // only run on home page
    if (homeIntroBlocking()) return;
    
    clearInterval(autoplayInterval);
    if (prefersReducedMotion) return;
    
    autoplayInterval = setInterval(() => {
      let nextIndex = (currentIndex + 1) % slides.length;
      changeSlide(nextIndex);
    }, 6000); // 6 seconds autoplay interval
  };

  // Add click listeners to progress bar tracks to manually switch slides
  progressTracks.forEach((track, i) => {
    track.addEventListener('click', () => {
      changeSlide(i);
    });
  });

  // Prev / Next arrow buttons click
  const prevBtn = document.getElementById('hero-prev-btn');
  const nextBtn = document.getElementById('hero-next-btn');

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      changeSlide(prevIndex);
    });
    nextBtn.addEventListener('click', () => {
      let nextIndex = (currentIndex + 1) % slides.length;
      changeSlide(nextIndex);
    });
  }

  // Keyboard navigation accessibility
  document.addEventListener('keydown', (e) => {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/index.html') return; // only navigate hero on home page
    if (homeIntroBlocking()) return;
    
    if (e.key === 'ArrowLeft') {
      let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      changeSlide(prevIndex);
    } else if (e.key === 'ArrowRight') {
      let nextIndex = (currentIndex + 1) % slides.length;
      changeSlide(nextIndex);
    }
  });

  // Swipe gesture navigation for Mobile
  const heroSection = document.getElementById('destinos');
  let touchStartX = 0;
  let touchStartY = 0;

  if (heroSection) {
    heroSection.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    heroSection.addEventListener('touchend', (e) => {
      if (homeIntroBlocking()) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) changeSlide((currentIndex + 1) % slides.length);
      else changeSlide((currentIndex - 1 + slides.length) % slides.length);
    }, { passive: true });
  }

  window.matchMedia("(max-width: 768px)").addEventListener("change", () => {
    applySlideVisuals(heroSlidesData[currentIndex]);
  });

  // Pause Autoplay on Hover
  const hero = document.getElementById('destinos');
  if (hero && !prefersReducedMotion) {
    hero.addEventListener('mouseenter', () => {
      clearInterval(autoplayInterval);
      const activeFill = hero.querySelector('.progress-bar-track.active .progress-bar-fill');
      if (activeFill) {
        activeFill.style.animationPlayState = 'paused';
      }
    });
    hero.addEventListener('mouseleave', () => {
      startAutoplay();
      const activeFill = hero.querySelector('.progress-bar-track.active .progress-bar-fill');
      if (activeFill) {
        activeFill.style.animationPlayState = 'running';
      }
    });
  }

  // ==========================================================================
  // 4. CLIENT SIDE HISTORY ROUTER (SPA ROUTER CONTROLLER)
  // ==========================================================================
  const homeView = document.getElementById('home-view');
  const vitrineView = document.getElementById('vitrine-view');
  const categoryView = document.getElementById('category-view');
  const packageView = document.getElementById('package-view');
  const groupsView = document.getElementById('groups-view');

  const hideAllViews = () => {
    homeView.style.display = 'none';
    vitrineView.style.display = 'none';
    categoryView.style.display = 'none';
    packageView.style.display = 'none';
    if (groupsView) groupsView.style.display = 'none';
    
    // Clean up any sticky bottom bar that might be active
    const oldSticky = document.querySelector('.sticky-bottom-bar');
    if (oldSticky) oldSticky.remove();
  };

  // Route router logic
  const handleRouting = async () => {
    const path = window.location.pathname;
    hideAllViews();
    
    if (path === '/' || path === '/index.html') {
      homeView.style.display = 'block';
      if (!document.querySelector("[data-wt-page-intro][data-intro-preset='home']")) {
        document.documentElement.classList.add("wt-hero-live");
      }
      handleHeaderScroll(); 
      injectHeroPreload('/images/vitrine/africa-do-sul.webp');
      hydrateHeroImage(slides[0]);
      applySlideVisuals(heroSlidesData[0]);
      const scheduleIdle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1400));
      scheduleIdle(() => prefetchHeroSlide(1));
      // Opening already started at boot. Autoplay waits until the hero is seated.
      homeIntroPromise.finally(() => {
        startAutoplay();
        if (deferHomePageView) {
          trackStorefrontEvent("page_view", { path: "/" });
        }
      });
      updateSEO(
        "WallTravel — Experiências Incríveis",
        "WallTravel – Descubra destinos incríveis e viva experiências de viagem personalizadas. Veja diferenciais exclusivos, depoimentos reais de clientes e planeje sua próxima aventura com quem entende de viagem."
      );
    } else {
      clearInterval(autoplayInterval);
      
      if (path === '/vitrine' || path === '/vitrine/') {
        header.classList.add('scrolled');
        vitrineView.style.display = 'block';
        renderVitrine();
      } else if (path.startsWith('/vitrine/')) {
        header.classList.add('scrolled');
        categoryView.style.display = 'block';
        let categorySlug = path.substring('/vitrine/'.length);
        if (categorySlug.endsWith('/')) categorySlug = categorySlug.slice(0, -1);
        renderCategory(categorySlug);
      } else if (path.startsWith('/pacote/') || path.startsWith('/viagens/')) {
        header.classList.add('scrolled');
        packageView.style.display = 'block';
        const prefix = path.startsWith('/viagens/') ? '/viagens/' : '/pacote/';
        let packageSlug = path.substring(prefix.length);
        if (packageSlug.endsWith('/')) packageSlug = packageSlug.slice(0, -1);
        await renderPackage(packageSlug);
      } else if (path === '/grupos' || path === '/grupos/') {
        groupsView.style.display = 'block';
        await renderGroupsList();
      } else if (path.startsWith('/grupos/')) {
        groupsView.style.display = 'block';
        let groupSlug = path.substring('/grupos/'.length);
        if (groupSlug.endsWith('/')) groupSlug = groupSlug.slice(0, -1);
        await renderGroupPage(groupSlug);
      } else {
        // Unknown route → 404 (do not silently fall back to Home)
        header.classList.add('scrolled');
        packageView.style.display = 'block';
        renderEmptyState(
          packageView,
          "Página não encontrada",
          "O endereço que você tentou abrir não existe ou foi removido."
        );
      }
    }
  };

  // Click interceptor for SPA navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href) {
      const url = new URL(link.href);
      if (url.host === window.location.host) {
        const path = url.pathname;
        const hash = url.hash;
        
        // Handle home anchors
        if (path === '/' || path === '/index.html') {
          if (hash) {
            e.preventDefault();
            // If already on homepage, smooth scroll to anchor
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
              const target = document.querySelector(hash);
              if (target) {
                const headerHeight = header.offsetHeight;
                window.scrollTo({
                  top: target.getBoundingClientRect().top + window.scrollY - headerHeight,
                  behavior: 'smooth'
                });
                
                // Update history without trigger routing
                window.history.pushState(null, '', hash);
                return;
              }
            }
          }
        }
        
        if (path === '/' || path.startsWith('/vitrine') || path.startsWith('/pacote') || path.startsWith('/viagens') || path.startsWith('/grupos')) {
          e.preventDefault();
          window.history.pushState(null, '', path + hash);
          handleRouting();
          
          if (!hash) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setTimeout(() => {
              const target = document.querySelector(hash);
              if (target) {
                const headerHeight = header.offsetHeight;
                window.scrollTo({
                  top: target.getBoundingClientRect().top + window.scrollY - headerHeight,
                  behavior: 'smooth'
                });
              }
            }, 100);
          }
        }
      }
    }
  });

  // Listen for browser forward/backward buttons
  window.addEventListener('popstate', handleRouting);

  // ==========================================================================
  // 5. VIEW RENDER FUNCTIONS (VITRINE, CATEGORIES & PACKAGES DETAIL)
  // ==========================================================================

  // A. Render main Category Vitrine (/vitrine)
  const renderVitrine = () => {
    const categories = getCategories();
    trackStorefrontEvent("vitrine_view", { source: getStorefrontSource() });
    
    updateSEO(
      "Vitrine de Viagens",
      "Explore experiências exclusivas sob medida, divididas por estilos de viagem curados pela WallTravel."
    );

    const leadImage = categories.find((cat) => cat.image)?.image || "/images/vitrine/europa.webp";
    vitrineView.innerHTML = `
      <figure class="wt-vitrine-mast">
        <img src="${esc(leadImage)}" alt="" width="1600" height="900" decoding="async">
        <figcaption>
          <h1>Vitrine de Viagens</h1>
          <p>Experiências exclusivas, divididas por estilos de viagem.</p>
        </figcaption>
      </figure>
      <div class="vitrine-header wt-vitrine-header" data-reveal>
        <div class="breadcrumb">
          <a href="/">Início</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">Vitrine</span>
        </div>
        <span class="category-meta-info">Curadoria WallTravel</span>
        <h1 class="section-title" style="margin-bottom: 1rem;">Vitrine de Viagens</h1>
        <p style="color: var(--color-text-muted);">Explore experiências exclusivas sob medida, divididas por estilos de viagem curados.</p>
      </div>
      
      <div class="vitrine-grid wt-vitrine-grid">
        ${categories.map((cat) => renderVitrineCategoryCard(cat, esc)).join('')}
      </div>
    `;
    vitrineView.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
    handleHeaderScroll();
  };

  // B. Render dynamic Category page (/vitrine/[categorySlug])
  const renderCategory = (slug) => {
    const category = getCategoryBySlug(slug);
    
    if (!category) {
      renderEmptyState(categoryView, "Categoria não encontrada", "Desculpe, a categoria procurada não foi localizada ou foi removida.");
      return;
    }

    trackStorefrontEvent("category_view", { slug, source: getStorefrontSource() });
    
    const packages = getPackagesByCategory(slug);
    
    updateSEO(
      category.title || category.name,
      category.description,
      category.image
    );

    // Setup Category Hero and Packages lists
    categoryView.innerHTML = `
      <!-- Category Premium Hero Section (Off-White Background) -->
      <section class="category-hero">
        <div class="category-hero-container">
          <div class="category-hero-left">
            <div class="breadcrumb">
              <a href="/">Início</a>
              <span class="breadcrumb-separator">/</span>
              <a href="/vitrine">Vitrine</a>
              <span class="breadcrumb-separator">/</span>
              <span class="breadcrumb-active">${esc(category.name)}</span>
            </div>
            <h1 class="section-title" style="margin-bottom: 1.2rem; text-align: left;">${esc(category.title || category.name)}</h1>
            <p style="color: var(--color-text-muted); margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.6;">${esc(category.description)}</p>
            <a href="${buildWhatsAppCTA({ pageType: 'VITRINE', placement: 'category', entity: { name: category.name, slug: category.slug }, source: 'category-hero' }).href}" target="_blank" rel="noopener" class="btn-primary" data-storefront-cta="specialist">
              Falar com especialista
            </a>
          </div>
          <div class="category-hero-right">
            ${renderCategoryHeroImage(category, esc)}
          </div>
        </div>
      </section>

      <!-- Search + tag filters -->
      <div class="filter-bar" id="category-filter-bar">
        <span class="filter-label">Filtrar:</span>
        <input type="search" id="category-search" placeholder="Buscar experiência…" style="min-width:12rem;padding:0.45rem 0.75rem;border:1px solid var(--color-border,#ddd);border-radius:0.4rem;font:inherit;" />
        <button class="filter-btn active" data-filter="todos" type="button">Todos</button>
        <button class="filter-btn" data-filter="lua-de-mel" type="button">Lua de Mel</button>
        <button class="filter-btn" data-filter="natureza" type="button">Natureza</button>
        <button class="filter-btn" data-filter="praia" type="button">Praia</button>
        <button class="filter-btn" data-filter="luxo" type="button">Luxo</button>
        <button class="filter-btn" data-filter="aventura" type="button">Aventura</button>
      </div>

      <div style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 1.5rem;">
        <span style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500;" id="packages-counter">
          ${packages.length} ${packages.length === 1 ? 'experiência localizada' : 'experiências localizadas'}
        </span>
      </div>

      <!-- Packages Grid -->
      <div id="category-packages-container">
        ${packages.length === 0 ? `
          <div class="empty-state-view">
            <h2 class="empty-state-title" style="font-size: 1.5rem; color: var(--color-text);">Nenhuma experiência disponível</h2>
            <p class="empty-state-desc">Estamos desenhando novos roteiros para esta categoria. Fale com um especialista para solicitar um planejamento personalizado.</p>
            <a href="${buildWhatsAppCTA({ pageType: 'VITRINE', placement: 'category-empty', entity: { name: category.name, slug: category.slug }, customMessage: `Olá! Gostaria de solicitar um roteiro personalizado para a categoria ${category.name}.`, source: 'category-empty' }).href}" target="_blank" rel="noopener" class="btn-primary">Falar com especialista</a>
          </div>
        ` : `
          <div class="packages-grid">
            ${packages.map(pkg => `
              <div class="package-card" data-tags="${esc((pkg.tags || []).join(',').toLowerCase())}" data-name="${esc((pkg.name || '').toLowerCase())}">
                <div class="package-card-img-wrapper">
                  <img src="${esc(pkg.image)}" alt="${esc(pkg.name)}" class="package-card-img" width="800" height="600" loading="lazy" decoding="async" sizes="(max-width:768px) 100vw, 33vw" onerror="this.onerror=null; this.src='/images/vitrine/fallback.svg';">
                </div>
                <div class="package-card-content">
                  <div>
                    <div class="package-card-tags">
                      ${(pkg.tags || []).map(tag => `<span class="package-tag">${esc(tag)}</span>`).join('')}
                    </div>
                    <h3 class="package-card-title">${esc(pkg.name)}</h3>
                    <div class="package-card-meta-line">
                      <div class="package-card-meta-item">
                        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        ${esc(pkg.destination)}
                      </div>
                      <div class="package-card-meta-item">
                        <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        ${esc(pkg.duration)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="package-card-price">
                      ${pkg.priceFrom ? `
                        A partir de: <span>${pkg.currency === 'BRL' ? 'R$' : pkg.currency === 'USD' ? 'US$' : '€'} ${Number(pkg.priceFrom).toLocaleString('pt-BR')}</span>
                      ` : `
                        Preço: <span>Sob Consulta</span>
                      `}
                    </div>
                    <div class="package-card-ctas">
                      <a href="/viagens/${esc(pkg.slug)}" class="btn-outline">Ver detalhes</a>
                      <a href="${buildWhatsAppCTA({ pageType: 'VITRINE', placement: 'product', entity: { name: pkg.name, slug: pkg.slug }, customMessage: pkg.ctaWhatsappMessage, source: 'category-card' }).href}" target="_blank" rel="noopener" class="btn-primary" style="background-color: #25d366; border-color: #25d366; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
                        <svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.88 14c-.24.69-1.23 1.26-1.7 1.32-.47.06-.94.24-3.04-.6-2.52-1.01-4.14-3.57-4.26-3.73-.12-.17-.99-1.31-.99-2.5 0-1.19.62-1.77.84-2.01.22-.24.47-.3.63-.3.16 0 .32.01.46.01.15 0 .35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.17-.12.27-.24.41-.12.14-.26.32-.37.43-.13.13-.26.27-.11.53.15.26.67 1.1 1.43 1.78.98.88 1.81 1.15 2.07 1.28.26.13.41.11.56-.06.15-.17.65-.75.82-1.01.17-.26.34-.22.57-.14.24.08 1.5.71 1.76.84.26.13.43.2.49.31.06.12.06.69-.18 1.38z"/></svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    // Filter Buttons Interactivity (fixed: query within categoryView)
    const filterButtons = categoryView.querySelectorAll('.filter-btn');
    const packageCards = categoryView.querySelectorAll('.package-card');
    const counterEl = categoryView.querySelector('#packages-counter');
    const searchEl = categoryView.querySelector('#category-search');
    let activeFilter = 'todos';

    const applyFilters = () => {
      const q = (searchEl?.value || '').trim().toLowerCase();
      let count = 0;
      packageCards.forEach(card => {
        const tags = card.getAttribute('data-tags') || '';
        const name = card.getAttribute('data-name') || '';
        let tagOk = activeFilter === 'todos';
        if (!tagOk) {
          if (activeFilter === 'lua-de-mel') {
            tagOk = tags.includes('lua-de-mel') || tags.includes('romance');
          } else {
            tagOk = tags.includes(activeFilter);
          }
        }
        const qOk = !q || name.includes(q) || tags.includes(q);
        const show = tagOk && qOk;
        card.style.display = show ? 'flex' : 'none';
        if (show) count += 1;
      });
      if (counterEl) {
        counterEl.textContent = `${count} ${count === 1 ? 'experiência localizada' : 'experiências localizadas'}`;
      }
    };

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter') || 'todos';
        applyFilters();
      });
    });
    searchEl?.addEventListener('input', applyFilters);
    handleHeaderScroll();
  };

  // C. Render experience detail (/viagens/[slug] · /pacote/[slug] alias) — Groups visual family
  const renderPackage = async (slug) => {
    if (groupExperienceCleanup) {
      groupExperienceCleanup();
      groupExperienceCleanup = null;
    }
    const pkg = await resolvePackageBySlug(slug);

    if (!pkg) {
      renderEmptyState(packageView, "Experiência não encontrada", "Desculpe, a viagem procurada não foi localizada ou ainda não está publicada.");
      handleHeaderScroll();
      return;
    }

    trackStorefrontEvent("viagem_view", { slug, source: getStorefrontSource() });
    trackStorefrontEvent("package_view", { slug, source: getStorefrontSource() });

    updateSEO(
      pkg.seoTitle || pkg.name,
      pkg.seoDescription || `${pkg.destination} – ${pkg.duration}. ${pkg.shortDescription || pkg.description}`,
      pkg.image
    );

    const category = getCategoryBySlug(pkg.categorySlug) || { name: "Vitrine", slug: "vitrine" };
    const renderExperienceDetailPage = await loadExperienceRenderer();
    const bindGroupExperience = await loadGroupExperienceBinder();
    packageView.innerHTML = renderExperienceDetailPage(pkg, category, esc, WA);
    groupExperienceCleanup = bindGroupExperience(packageView);
    handleHeaderScroll();
  };

  const renderGroupsList = async () => {
    if (groupExperienceCleanup) {
      groupExperienceCleanup();
      groupExperienceCleanup = null;
    }
    const groups = getGroups();
    updateSEO(
      "Viagens em grupo",
      "Expedições em grupo pequeno com curadoria WallTravel — destinos com intenção e logística completa.",
    );
    groupsView.innerHTML = renderGroupsCatalog(groups, esc);
    bindGroupForms(groupsView, WA);
    const bindGroupExperience = await loadGroupExperienceBinder();
    groupExperienceCleanup = bindGroupExperience(groupsView);
    handleHeaderScroll();
  };

  const renderGroupPage = async (slug) => {
    if (groupExperienceCleanup) {
      groupExperienceCleanup();
      groupExperienceCleanup = null;
    }
    const group = await resolveGroupBySlug(slug);
    if (!group) {
      renderEmptyState(
        groupsView,
        "Grupo não encontrado",
        "Este grupo não está disponível no momento.",
      );
      handleHeaderScroll();
      return;
    }

    const seoTitle = group.seoTitle || group.name;
    const seoDesc =
      group.seoDescription ||
      group.shortDescription ||
      `Viagem em grupo WallTravel — ${group.name}.`;
    updateSEO(seoTitle, seoDesc, group.coverImageUrl);

    groupsView.innerHTML = renderGroupDetailPage(group, esc, WA);
    bindGroupForms(groupsView, WA);
    const bindGroupExperience = await loadGroupExperienceBinder();
    groupExperienceCleanup = bindGroupExperience(groupsView);
    trackStorefrontEvent("group_view", { groupSlug: group.slug, slug: group.slug });
    trackStorefrontEvent("viagem_view", { slug: group.slug });
    handleHeaderScroll();
  };

  // Helper to render beautiful error/empty views
  const renderEmptyState = (element, title, description) => {
    updateSEO("Erro 404 - Página Não Encontrada", description);
    element.innerHTML = `
      <div class="empty-state-view" style="padding-top: 150px; padding-bottom: 100px;">
        <h1 class="empty-state-title" style="font-size: 2.2rem; color: var(--color-accent); margin-bottom: 1rem;">${title}</h1>
        <p class="empty-state-desc" style="color: var(--color-text-muted); margin-bottom: 2.5rem; line-height: 1.6;">${description}</p>
        <a href="/vitrine" class="btn-primary">Ir para a Vitrine</a>
      </div>
    `;
  };

  // Run Router initial load
  handleRouting();

  // ==========================================================================
  // 6. INITIALIZE HERO COMPOSITION ON PAGE LOAD (Home only)
  // ==========================================================================
  if (slides.length > 0) {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      changeSlide(0); // sync initial slide from JSON immediately
    }
  }

  // ==========================================================================
  // 7. SMOOTH ANCHOR LINK NAVIGATION
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') {
        e.preventDefault();
        return;
      }

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = header.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==========================================================================
  // 8. SCROLL REVEAL EFFECT (FADE IN SECTIONS)
  // ==========================================================================
  const fadeSections = document.querySelectorAll('.fade-in-section');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeSections.forEach(section => {
      sectionObserver.observe(section);
    });
  } else {
    fadeSections.forEach(section => {
      section.classList.add('is-visible');
    });
  }

  // ==========================================================================
  // 9. FLOATING WHATSAPP BUTTON SCROLL EFFECT
  // ==========================================================================
  const whatsappFloat = document.getElementById('whatsapp-float');
  if (whatsappFloat) {
    const handleFloatScroll = () => {
      const mobile = window.matchMedia("(max-width: 768px)").matches;
      const band = Array.from(
        document.querySelectorAll(".hero, .wt-vitrine-mast, .group-hero, .category-hero-right"),
      ).find((el) => el.getClientRects().length > 0 && el.offsetHeight > 40);
      let threshold = 400;
      if (mobile && band) {
        const top = band.getBoundingClientRect().top + window.scrollY;
        threshold = top + band.offsetHeight - 8;
      }
      whatsappFloat.classList.toggle("visible", window.scrollY > threshold);
    };
    
    window.addEventListener('scroll', handleFloatScroll, { passive: true });
    handleFloatScroll();
  }
});
