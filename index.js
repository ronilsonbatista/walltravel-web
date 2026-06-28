import { 
  getOrderedHeroSlides, 
  getCategories, 
  getCategoryBySlug, 
  getPackagesByCategory, 
  getPackageBySlug,
  getHoneymoonSection
} from './data/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
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

  // ==========================================================================
  // 1. STICKY HEADER SCROLL EFFECT (DYNAMIC TRANSPARENT -> SCROLLED)
  // ==========================================================================
  const header = document.querySelector('.header');
  
  const handleHeaderScroll = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    } else {
      // Subpages always solid white/scrolled header style
      header.classList.add('scrolled');
    }
  };

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll(); // Run once at init

  // ==========================================================================
  // 2. MOBILE MENU INTERACTION
  // ==========================================================================
  const menuBtn = document.querySelector('.menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  const toggleMobileMenu = () => {
    menuBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  };

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', toggleMobileMenu);

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const path = window.location.pathname;
        if (path !== '/' && path !== '/index.html') {
          // If on subpage, navigate to homepage anchor
          const targetHref = link.getAttribute('href');
          if (targetHref && targetHref.startsWith('#')) {
            e.preventDefault();
            window.history.pushState(null, '', '/');
            handleRouting();
            setTimeout(() => {
              const element = document.querySelector(targetHref);
              if (element) {
                const headerHeight = header.offsetHeight;
                window.scrollTo({
                  top: element.getBoundingClientRect().top + window.scrollY - headerHeight,
                  behavior: 'smooth'
                });
              }
            }, 100);
          }
        }
        
        if (navMenu.classList.contains('active')) {
          toggleMobileMenu();
        }
      });
    });
  }

  // ==========================================================================
  // 3. HERO AUTOMATIC FULLSCREEN SLIDESHOW & TEXT CARD SYNC (FROM JSON)
  // ==========================================================================
  const heroSlidesData = getOrderedHeroSlides();
  let currentIndex = 0;
  const slides = document.querySelectorAll('.hero-slide');
  const progressTracks = document.querySelectorAll('.progress-bar-track');
  const cardTitleEl = document.getElementById('slide-card-title');
  const cardDescEl = document.getElementById('slide-card-desc');
  const cardCtaEl = document.getElementById('slide-card-cta');
  const numberIndicatorEl = document.getElementById('slide-number-indicator');
  const slideCard = document.getElementById('hero-slide-card');
  let autoplayInterval;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const changeSlide = (index) => {
    if (slides.length === 0 || heroSlidesData.length === 0) return;
    
    // Remove active state from current slide and track
    slides[currentIndex].classList.remove('active');
    progressTracks[currentIndex].classList.remove('active');

    currentIndex = index;

    // Add active state to new slide and track
    slides[currentIndex].classList.add('active');
    progressTracks[currentIndex].classList.add('active');

    // Fade and transition the destination card on the right
    if (slideCard && heroSlidesData[currentIndex]) {
      slideCard.style.opacity = 0;
      slideCard.style.transform = 'translateY(8px)';
      setTimeout(() => {
        const slideInfo = heroSlidesData[currentIndex];
        if (cardTitleEl) cardTitleEl.textContent = slideInfo.title;
        if (cardDescEl) cardDescEl.textContent = slideInfo.subtitle;
        if (cardCtaEl) {
          cardCtaEl.textContent = slideInfo.ctaLabel || "Planejar minha viagem";
          cardCtaEl.href = `https://wa.me/5521997138461?text=${encodeURIComponent(slideInfo.ctaWhatsappMessage)}`;
        }
        if (numberIndicatorEl) {
          numberIndicatorEl.textContent = `0${currentIndex + 1} / 0${slides.length}`;
        }
        slideCard.style.opacity = 1;
        slideCard.style.transform = 'translateY(0)';
      }, 300);
    }

    if (!prefersReducedMotion) {
      startAutoplay();
    }
  };

  const startAutoplay = () => {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/index.html') return; // only run on home page
    
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
  let touchEndX = 0;

  if (heroSection) {
    heroSection.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    heroSection.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  const handleSwipe = () => {
    const swipeThreshold = 55;
    if (touchStartX - touchEndX > swipeThreshold) {
      let nextIndex = (currentIndex + 1) % slides.length;
      changeSlide(nextIndex);
    } else if (touchEndX - touchStartX > swipeThreshold) {
      let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      changeSlide(prevIndex);
    }
  };

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

  const hideAllViews = () => {
    homeView.style.display = 'none';
    vitrineView.style.display = 'none';
    categoryView.style.display = 'none';
    packageView.style.display = 'none';
    
    // Clean up any sticky bottom bar that might be active
    const oldSticky = document.querySelector('.sticky-bottom-bar');
    if (oldSticky) oldSticky.remove();
  };

  // Route router logic
  const handleRouting = () => {
    const path = window.location.pathname;
    hideAllViews();
    
    if (path === '/' || path === '/index.html') {
      homeView.style.display = 'block';
      handleHeaderScroll(); 
      startAutoplay();
      updateSEO(
        "WallTravel — Experiências Incríveis",
        "WallTravel – Descubra destinos incríveis e viva experiências de viagem personalizadas. Veja diferenciais exclusivos, depoimentos reais de clientes e planeje sua próxima aventura com quem entende de viagem."
      );
    } else {
      header.classList.add('scrolled');
      clearInterval(autoplayInterval);
      
      if (path === '/vitrine' || path === '/vitrine/') {
        vitrineView.style.display = 'block';
        renderVitrine();
      } else if (path.startsWith('/vitrine/')) {
        categoryView.style.display = 'block';
        const categorySlug = path.substring('/vitrine/'.length);
        renderCategory(categorySlug);
      } else if (path.startsWith('/pacote/')) {
        packageView.style.display = 'block';
        const packageSlug = path.substring('/pacote/'.length);
        renderPackage(packageSlug);
      } else {
        // Fallback
        homeView.style.display = 'block';
        startAutoplay();
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
        
        if (path === '/' || path.startsWith('/vitrine') || path.startsWith('/pacote')) {
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
    
    updateSEO(
      "Vitrine de Pacotes",
      "Explore nossas experiências exclusivas sob medida, divididas por estilos de viagens curadas da WallTravel."
    );

    vitrineView.innerHTML = `
      <div class="vitrine-header">
        <div class="breadcrumb">
          <a href="/">Início</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">Vitrine</span>
        </div>
        <span class="category-meta-info">Selecione uma categoria</span>
        <h1 class="section-title" style="margin-bottom: 1rem;">Vitrine de Viagens</h1>
        <p style="color: var(--color-text-muted);">Explore nossas experiências exclusivas sob medida, divididas por estilos de viagens curadas.</p>
      </div>
      
      <div class="vitrine-grid">
        ${categories.map(cat => `
          <a href="/vitrine/${cat.slug}" class="category-card">
            <div class="category-card-img-wrapper">
              <img src="${cat.image}" alt="${cat.name}" class="category-card-img" loading="lazy" onerror="this.onerror=null; this.src='/images/vitrine/fallback.svg';">
            </div>
            <div class="category-card-content">
              <div>
                <span class="category-card-meta">${cat.packageCount || 0} ${cat.packageCount === 1 ? 'Pacote' : 'Pacotes'}</span>
                <h3 class="category-card-title">${cat.name}</h3>
                <p class="category-card-desc">${cat.description}</p>
              </div>
              <span class="category-card-cta">Ver pacotes <svg viewBox="0 0 24 24"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21 12l-8.15-8.15-1.42 1.42 5.43 5.43H5v2z"/></svg></span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  };

  // B. Render dynamic Category page (/vitrine/[categorySlug])
  const renderCategory = (slug) => {
    const category = getCategoryBySlug(slug);
    
    if (!category) {
      renderEmptyState(categoryView, "Categoria não encontrada", "Desculpe, a categoria procurada não foi localizada ou foi removida.");
      return;
    }
    
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
              <span class="breadcrumb-active">${category.name}</span>
            </div>
            <h1 class="section-title" style="margin-bottom: 1.2rem; text-align: left;">${category.title || category.name}</h1>
            <p style="color: var(--color-text-muted); margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.6;">${category.description}</p>
            <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de conhecer os pacotes da categoria ${category.name} da WallTravel.`)}" target="_blank" rel="noopener" class="btn-primary">
              Falar com especialista
            </a>
          </div>
          <div class="category-hero-right">
            <img src="${category.image}" alt="${category.name}" class="category-hero-img" onerror="this.onerror=null; this.src='/images/vitrine/fallback.svg';">
          </div>
        </div>
      </section>

      <!-- Pill Tags Filters Bar -->
      <div class="filter-bar" id="category-filter-bar">
        <span class="filter-label">Filtrar por:</span>
        <button class="filter-btn active" data-filter="todos">Todos</button>
        <button class="filter-btn" data-filter="lua-de-mel">Lua de Mel</button>
        <button class="filter-btn" data-filter="natureza">Natureza</button>
        <button class="filter-btn" data-filter="praia">Praia</button>
        <button class="filter-btn" data-filter="luxo">Luxo</button>
        <button class="filter-btn" data-filter="aventura">Aventura</button>
      </div>

      <div style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 1.5rem;">
        <span style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500;" id="packages-counter">
          ${packages.length} ${packages.length === 1 ? 'pacote localizado' : 'pacotes localizados'}
        </span>
      </div>

      <!-- Packages Grid -->
      <div id="category-packages-container">
        ${packages.length === 0 ? `
          <div class="empty-state-view">
            <h2 class="empty-state-title" style="font-size: 1.5rem; color: var(--color-text);">Nenhum pacote disponível</h2>
            <p class="empty-state-desc">Estamos desenhando novos roteiros para esta categoria. Fale com um especialista para solicitar um roteiro personalizado.</p>
            <a href="https://wa.me/5521997138461?text=Olá!%20Gostaria%20de%20solicitar%20um%20roteiro%20personalizado%20para%20a%20categoria%20${encodeURIComponent(category.name)}." target="_blank" rel="noopener" class="btn-primary">Falar com especialista</a>
          </div>
        ` : `
          <div class="packages-grid">
            ${packages.map(pkg => `
              <div class="package-card" data-tags="${pkg.tags.join(',').toLowerCase()}">
                <div class="package-card-img-wrapper">
                  <img src="${pkg.image}" alt="${pkg.name}" class="package-card-img" loading="lazy" onerror="this.onerror=null; this.src='/images/vitrine/fallback.svg';">
                </div>
                <div class="package-card-content">
                  <div>
                    <div class="package-card-tags">
                      ${pkg.tags.map(tag => `<span class="package-tag">${tag}</span>`).join('')}
                    </div>
                    <h3 class="package-card-title">${pkg.name}</h3>
                    <div class="package-card-meta-line">
                      <div class="package-card-meta-item">
                        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        ${pkg.destination}
                      </div>
                      <div class="package-card-meta-item">
                        <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        ${pkg.duration}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="package-card-price">
                      ${pkg.priceFrom ? `
                        A partir de: <span>${pkg.currency === 'BRL' ? 'R$' : pkg.currency === 'USD' ? 'US$' : '€'} ${pkg.priceFrom.toLocaleString('pt-BR')}</span>
                      ` : `
                        Preço: <span>Sob Consulta</span>
                      `}
                    </div>
                    <div class="package-card-ctas">
                      <a href="/pacote/${pkg.slug}" class="btn-outline">Ver detalhes</a>
                      <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de mais detalhes sobre o pacote ${pkg.name} da WallTravel.`)}" target="_blank" rel="noopener" class="btn-primary" style="background-color: #25d366; border-color: #25d366; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
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

    // Filter Buttons Interactivity
    const filterButtons = categoryView.querySelectorAll('.filter-btn');
    const packageCards = categoryView.querySelectorAll('.package-card');
    const counterEl = categoryView.getElementById('packages-counter');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle Active
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterVal = btn.getAttribute('data-filter');
        let count = 0;

        packageCards.forEach(card => {
          const tags = card.getAttribute('data-tags') || '';
          // Simple tag filter matching logic
          if (filterVal === 'todos') {
            card.style.display = 'flex';
            count++;
          } else if (filterVal === 'lua-de-mel') {
            if (tags.includes('lua-de-mel') || tags.includes('romance')) {
              card.style.display = 'flex';
              count++;
            } else {
              card.style.display = 'none';
            }
          } else {
            if (tags.includes(filterVal)) {
              card.style.display = 'flex';
              count++;
            } else {
              card.style.display = 'none';
            }
          }
        });

        // Update counter
        if (counterEl) {
          counterEl.textContent = `${count} ${count === 1 ? 'pacote localizado' : 'pacotes localizados'}`;
        }
      });
    });
  };

  // C. Render dynamic Package Detail page (/pacote/[packageSlug])
  const renderPackage = (slug) => {
    const pkg = getPackageBySlug(slug);
    
    if (!pkg) {
      renderEmptyState(packageView, "Pacote não encontrado", "Desculpe, o pacote de viagem procurado não foi localizado.");
      return;
    }
    
    updateSEO(
      pkg.name,
      `${pkg.destination} – ${pkg.duration}. ${pkg.shortDescription || pkg.description}`,
      pkg.image
    );

    // Get category name for breadcrumb
    const category = getCategoryBySlug(pkg.categorySlug) || { name: "Vitrine", slug: "vitrine" };

    packageView.innerHTML = `
      <div class="package-detail">
        <!-- Hero cinematográfico (Responsive Height) -->
        <div class="package-detail-hero">
          <img src="${pkg.image}" alt="${pkg.name}" class="package-detail-hero-img" onerror="this.onerror=null; this.src='/images/vitrine/fallback.svg';">
          <div class="package-detail-hero-overlay"></div>
          <div class="package-detail-hero-container">
            <!-- Breadcrumbs -->
            <div class="breadcrumb" style="margin-bottom: 1.2rem;">
              <a href="/" style="color: rgba(255,255,255,0.7);">Início</a>
              <span class="breadcrumb-separator" style="color: rgba(255,255,255,0.4);">/</span>
              <a href="/vitrine" style="color: rgba(255,255,255,0.7);">Vitrine</a>
              <span class="breadcrumb-separator" style="color: rgba(255,255,255,0.4);">/</span>
              <a href="/vitrine/${category.slug}" style="color: rgba(255,255,255,0.7);">${category.name}</a>
              <span class="breadcrumb-separator" style="color: rgba(255,255,255,0.4);">/</span>
              <span class="breadcrumb-active" style="color: #FFFFFF;">${pkg.name}</span>
            </div>
            
            <h1 class="package-detail-title">${pkg.name}</h1>
            <div class="package-detail-meta">
              <div class="package-detail-meta-item">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                ${pkg.destination}
              </div>
              <div class="package-detail-meta-item">
                <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                Duração: ${pkg.duration}
              </div>
              <div class="package-detail-meta-item">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
                Tipo: ${pkg.type}
              </div>
            </div>
          </div>
        </div>

        <!-- Conteúdo Principal em Grid (2 Colunas Desktop) -->
        <div class="package-detail-body">
          <!-- Coluna Esquerda: Informações -->
          <div class="package-detail-content">
            <div class="package-section">
              <h2 class="package-section-title">Sobre a Viagem</h2>
              <p class="package-description-text">${pkg.description}</p>
            </div>

            <!-- Galeria Premium (Swipe no Mobile, Grid no Desktop) -->
            ${pkg.gallery && pkg.gallery.length > 0 ? `
              <div class="package-section">
                <h2 class="package-section-title">Galeria de Experiências</h2>
                <div class="package-detail-gallery-carousel">
                  ${pkg.gallery.map(img => `
                    <div class="gallery-item" onclick="window.open('${img}', '_blank')">
                      <img src="${img}" alt="Imagem da Galeria" loading="lazy" onerror="this.onerror=null; this.src='/images/vitrine/fallback.svg';">
                    </div>
                  `).join('')}
                </div>
                <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.5rem; text-align: center;" class="whatsapp-float-text">
                  * Clique em qualquer foto para ver em tamanho real. Deslize para navegar.
                </p>
              </div>
            ` : ''}

            <!-- Mobile-only In-flow Price Info (Renders under description on viewports <= 768px) -->
            <div class="package-section sidebar-box-mobile-only" style="display: none; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.8rem;">
              <div class="sidebar-price-label">Valor do pacote</div>
              ${pkg.priceFrom ? `
                <div class="sidebar-price" style="font-size: 1.8rem; margin-bottom: 1.2rem;">
                  <span>${pkg.currency === 'BRL' ? 'R$' : pkg.currency === 'USD' ? 'US$' : '€'} ${pkg.priceFrom.toLocaleString('pt-BR')}</span>
                  <span style="display:block; font-size: 0.78rem; color: var(--color-text-muted); font-weight: normal; margin-top: 0.2rem;">Por pessoa em acomodação dupla</span>
                </div>
              ` : `
                <div class="sidebar-price-muted" style="margin-bottom: 1.2rem;">Sob Consulta</div>
              `}
              <div class="sidebar-ctas">
                <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de mais detalhes sobre o pacote ${pkg.name} da WallTravel.`)}" target="_blank" rel="noopener" class="btn-primary" style="background-color: #25d366; border-color: #25d366; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
                  <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.88 14c-.24.69-1.23 1.26-1.7 1.32-.47.06-.94.24-3.04-.6-2.52-1.01-4.14-3.57-4.26-3.73-.12-.17-.99-1.31-.99-2.5 0-1.19.62-1.77.84-2.01.22-.24.47-.3.63-.3.16 0 .32.01.46.01.15 0 .35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.17-.12.27-.24.41-.12.14-.26.32-.37.43-.13.13-.26.27-.11.53.15.26.67 1.1 1.43 1.78.98.88 1.81 1.15 2.07 1.28.26.13.41.11.56-.06.15-.17.65-.75.82-1.01.17-.26.34-.22.57-.14.24.08 1.5.71 1.76.84.26.13.43.2.49.31.06.12.06.69-.18 1.38z"/></svg>
                  Quero este pacote
                </a>
              </div>
            </div>

            <!-- O que está incluso/não incluso -->
            <div class="package-section">
              <h2 class="package-section-title">Itens do Pacote</h2>
              <div class="included-grid">
                <div>
                  <h3 style="font-size: 1.05rem; margin-bottom: 1rem; color: #55a630; display: inline-flex; align-items: center; gap: 0.4rem;">
                    ✓ O que está Incluso
                  </h3>
                  <ul class="included-list">
                    ${pkg.included.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
                <div>
                  <h3 style="font-size: 1.05rem; margin-bottom: 1rem; color: #d90429; display: inline-flex; align-items: center; gap: 0.4rem;">
                    ✕ Não Incluso
                  </h3>
                  <ul class="not-included-list">
                    ${pkg.notIncluded.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>

            <!-- Roteiro Sugerido -->
            ${pkg.itinerary && pkg.itinerary.length > 0 ? `
              <div class="package-section">
                <h2 class="package-section-title">Sugestão de Roteiro Dia a Dia</h2>
                <div class="itinerary-timeline">
                  ${pkg.itinerary.map(item => `
                    <div class="itinerary-day">
                      <span class="itinerary-day-tag">Dia ${item.day}</span>
                      <h3 class="itinerary-day-title">${item.title}</h3>
                      <p class="itinerary-day-desc">${item.description}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Coluna Direita: Sidebar Reserva (Sticky on Desktop) -->
          <div class="package-detail-sidebar">
            <div class="package-sidebar-box">
              <div class="sidebar-price-label">Valor do pacote</div>
              ${pkg.priceFrom ? `
                <div class="sidebar-price">
                  <span>${pkg.currency === 'BRL' ? 'R$' : pkg.currency === 'USD' ? 'US$' : '€'} ${pkg.priceFrom.toLocaleString('pt-BR')}</span>
                  <span style="display:block; font-size: 0.8rem; color: var(--color-text-muted); font-weight: normal; margin-top: 0.3rem;">Por pessoa em acomodação dupla</span>
                </div>
              ` : `
                <div class="sidebar-price-muted">Sob Consulta</div>
              `}

              <div class="sidebar-ctas">
                <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de mais detalhes sobre o pacote ${pkg.name} da WallTravel.`)}" target="_blank" rel="noopener" class="btn-primary" style="background-color: #25d366; border-color: #25d366; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.88 14c-.24.69-1.23 1.26-1.7 1.32-.47.06-.94.24-3.04-.6-2.52-1.01-4.14-3.57-4.26-3.73-.12-.17-.99-1.31-.99-2.5 0-1.19.62-1.77.84-2.01.22-.24.47-.3.63-.3.16 0 .32.01.46.01.15 0 .35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.17-.12.27-.24.41-.12.14-.26.32-.37.43-.13.13-.26.27-.11.53.15.26.67 1.1 1.43 1.78.98.88 1.81 1.15 2.07 1.28.26.13.41.11.56-.06.15-.17.65-.75.82-1.01.17-.26.34-.22.57-.14.24.08 1.5.71 1.76.84.26.13.43.2.49.31.06.12.06.69-.18 1.38z"/></svg>
                  Quero este pacote
                </a>
                <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de falar com um especialista sobre o pacote ${pkg.name} da WallTravel.`)}" target="_blank" rel="noopener" class="btn-outline">
                  Falar com especialista
                </a>
              </div>

              ${pkg.importantNotes && pkg.importantNotes.length > 0 ? `
                <div class="sidebar-notes">
                  <h4 class="sidebar-notes-title">Observações Importantes</h4>
                  <ul class="sidebar-notes-list">
                    ${pkg.importantNotes.map(note => `<li>${note}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- STICKY BOTTOM BAR FOR MOBILE SCREENS -->
      <div class="sticky-bottom-bar">
        <div class="sticky-bottom-price-box">
          <span class="sticky-bottom-price-label">Valor do pacote</span>
          <span class="sticky-bottom-price">
            ${pkg.priceFrom ? `${pkg.currency === 'BRL' ? 'R$' : pkg.currency === 'USD' ? 'US$' : '€'} ${pkg.priceFrom.toLocaleString('pt-BR')}` : 'Sob Consulta'}
          </span>
        </div>
        <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de mais detalhes sobre o pacote ${pkg.name} da WallTravel.`)}" target="_blank" rel="noopener" class="sticky-bottom-btn">
          <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.88 14c-.24.69-1.23 1.26-1.7 1.32-.47.06-.94.24-3.04-.6-2.52-1.01-4.14-3.57-4.26-3.73-.12-.17-.99-1.31-.99-2.5 0-1.19.62-1.77.84-2.01.22-.24.47-.3.63-.3.16 0 .32.01.46.01.15 0 .35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.17-.12.27-.24.41-.12.14-.26.32-.37.43-.13.13-.26.27-.11.53.15.26.67 1.1 1.43 1.78.98.88 1.81 1.15 2.07 1.28.26.13.41.11.56-.06.15-.17.65-.75.82-1.01.17-.26.34-.22.57-.14.24.08 1.5.71 1.76.84.26.13.43.2.49.31.06.12.06.69-.18 1.38z"/></svg>
          Quero este pacote
        </a>
      </div>
    `;
    
    // Check viewport to adjust layout styles if mobile loaded
    const adjustSidebarVisibility = () => {
      const isMobile = window.innerWidth <= 768;
      const inlineMobileBox = packageView.querySelector('.sidebar-box-mobile-only');
      const desktopSidebar = packageView.querySelector('.package-detail-sidebar');
      
      if (inlineMobileBox && desktopSidebar) {
        if (isMobile) {
          inlineMobileBox.style.display = 'block';
          desktopSidebar.style.display = 'none';
        } else {
          inlineMobileBox.style.display = 'none';
          desktopSidebar.style.display = 'block';
        }
      }
    };
    
    adjustSidebarVisibility();
    window.addEventListener('resize', adjustSidebarVisibility);
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
  // 6. INITIALIZE HERO COMPOSITION ON PAGE LOAD
  // ==========================================================================
  if (slides.length > 0) {
    changeSlide(0); // sync initial slide from JSON immediately
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
      if (window.scrollY > 400) {
        whatsappFloat.classList.add('visible');
      } else {
        whatsappFloat.classList.remove('visible');
      }
    };
    
    window.addEventListener('scroll', handleFloatScroll, { passive: true });
    handleFloatScroll();
  }
});
