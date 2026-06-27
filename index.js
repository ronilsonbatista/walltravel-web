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
  // 1. STICKY HEADER SCROLL EFFECT (DYNAMIC TRANSPARENT -> SCROLLED)
  // ==========================================================================
  const header = document.querySelector('.header');
  
  const handleHeaderScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
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
      link.addEventListener('click', () => {
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
  };

  // Route router logic
  const handleRouting = () => {
    const path = window.location.pathname;
    hideAllViews();
    
    // Header Scroll class adjust based on page
    if (path === '/' || path === '/index.html') {
      homeView.style.display = 'block';
      handleHeaderScroll(); // restore opacity scroll listening
      startAutoplay();
    } else {
      // Subpages always have solid scrolled header style
      header.classList.add('scrolled');
      
      // Stop hero carousel loop
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
        if (path === '/' || path.startsWith('/vitrine') || path.startsWith('/pacote')) {
          e.preventDefault();
          window.history.pushState(null, '', path);
          handleRouting();
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    vitrineView.innerHTML = `
      <div class="vitrine-header">
        <span class="category-meta-info">Selecione uma categoria</span>
        <h1 class="section-title" style="margin-bottom: 1rem;">Vitrine de Viagens</h1>
        <p style="color: var(--color-text-muted);">Explore nossas experiências exclusivas sob medida, divididas por estilos de viagens curadas.</p>
      </div>
      
      <div class="vitrine-grid">
        ${categories.map(cat => `
          <a href="/vitrine/${cat.slug}" class="category-card">
            <div class="category-card-img-wrapper">
              <img src="${cat.image}" alt="${cat.name}" class="category-card-img" loading="lazy">
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
    
    categoryView.innerHTML = `
      <div class="category-header">
        <a href="/vitrine" style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 0.05em;">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;transform:rotate(180deg);"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21 12l-8.15-8.15-1.42 1.42 5.43 5.43H5v2z"/></svg>
          Voltar para Vitrine
        </a>
        <h1 class="section-title" style="margin-bottom: 1rem;">${category.title || category.name}</h1>
        <p style="color: var(--color-text-muted);">${category.description}</p>
      </div>

      ${packages.length === 0 ? `
        <div class="empty-state-view">
          <h2 class="empty-state-title" style="font-size: 1.5rem; color: var(--color-text);">Nenhum pacote disponível</h2>
          <p class="empty-state-desc">Estamos desenhando novos roteiros para esta categoria. Fale com um especialista para solicitar um roteiro personalizado.</p>
          <a href="https://wa.me/5521997138461?text=Olá!%20Gostaria%20de%20solicitar%20um%20roteiro%20personalizado%20para%20a%20categoria%20${encodeURIComponent(category.name)}." target="_blank" rel="noopener" class="btn-primary">Falar com especialista</a>
        </div>
      ` : `
        <div class="packages-grid">
          ${packages.map(pkg => `
            <div class="package-card">
              <div class="package-card-img-wrapper">
                <img src="${pkg.image}" alt="${pkg.name}" class="package-card-img" loading="lazy">
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
                    <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de mais detalhes sobre o pacote ${pkg.name} da WallTravel.`)}" target="_blank" rel="noopener" class="btn-primary" style="background-color: #25d366; border-color: #25d366; color: white;">WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  };

  // C. Render dynamic Package Detail page (/pacote/[packageSlug])
  const renderPackage = (slug) => {
    const pkg = getPackageBySlug(slug);
    
    if (!pkg) {
      renderEmptyState(packageView, "Pacote não encontrado", "Desculpe, o pacote de viagem procurado não foi localizado.");
      return;
    }
    
    packageView.innerHTML = `
      <div class="package-detail">
        <!-- Hero cinematográfico -->
        <div class="package-detail-hero">
          <img src="${pkg.image}" alt="${pkg.name}" class="package-detail-hero-img">
          <div class="package-detail-hero-overlay"></div>
          <div class="package-detail-hero-container">
            <a href="/vitrine/${pkg.categorySlug}" style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--color-primary-light); margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;transform:rotate(180deg);"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21 12l-8.15-8.15-1.42 1.42 5.43 5.43H5v2z"/></svg>
              Voltar para Pacotes
            </a>
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

        <!-- Conteúdo Principal -->
        <div class="package-detail-body">
          <!-- Coluna Esquerda: Informações -->
          <div class="package-detail-content">
            <div class="package-section">
              <h2 class="package-section-title">Sobre a Viagem</h2>
              <p class="package-description-text">${pkg.description}</p>
            </div>

            <!-- Galeria -->
            ${pkg.gallery && pkg.gallery.length > 0 ? `
              <div class="package-section">
                <h2 class="package-section-title">Galeria de Experiências</h2>
                <div class="package-detail-gallery">
                  ${pkg.gallery.map(img => `
                    <div class="gallery-item" onclick="window.open('${img}', '_blank')">
                      <img src="${img}" alt="Imagem da Galeria" loading="lazy">
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- O que está incluso/não incluso -->
            <div class="package-section">
              <h2 class="package-section-title">Itens do Pacote</h2>
              <div class="included-grid">
                <div>
                  <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: #55a630;">✓ O que está Incluso</h3>
                  <ul class="included-list">
                    ${pkg.included.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
                <div>
                  <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: #d90429;">✕ Não Incluso</h3>
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

          <!-- Coluna Direita: Sidebar Reserva -->
          <div class="package-detail-sidebar">
            <div class="package-sidebar-box">
              <div class="sidebar-price-label">Valor do pacote</div>
              ${pkg.priceFrom ? `
                <div class="sidebar-price">
                  <span>${pkg.currency === 'BRL' ? 'R$' : pkg.currency === 'USD' ? 'US$' : '€'} ${pkg.priceFrom.toLocaleString('pt-BR')}</span>
                  <span style="display:block; font-size: 0.8rem; color: var(--color-text-muted); font-weight: normal; margin-top: 0.3rem;">Por pessoa em apto duplo</span>
                </div>
              ` : `
                <div class="sidebar-price-muted">Sob Consulta</div>
              `}

              <div class="sidebar-ctas">
                <a href="https://wa.me/5521997138461?text=${encodeURIComponent(`Olá! Gostaria de mais detalhes sobre o pacote ${pkg.name} da WallTravel.`)}" target="_blank" rel="noopener" class="btn-primary" style="background-color: #25d366; border-color: #25d366; color: white;">
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
    `;
  };

  // Helper to render beautiful error/empty views
  const renderEmptyState = (element, title, description) => {
    element.innerHTML = `
      <div class="empty-state-view">
        <h1 class="empty-state-title">${title}</h1>
        <p class="empty-state-desc">${description}</p>
        <a href="/vitrine" class="btn-primary">Voltar para Vitrine</a>
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
