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
  // 3. HERO AUTOMATIC FULLSCREEN SLIDESHOW & TEXT CARD SYNC
  // ==========================================================================
  const slideTexts = [
    { title: "Europa sob medida", desc: "Exploração histórica, alta gastronomia e hospedagens boutique por quem já morou lá.", urlText: "Europa" },
    { title: "Nordeste de Charme", desc: "Praias intocadas e curadoria das melhores pousadas de charme com privacidade.", urlText: "Nordeste" },
    { title: "África Selvagem", desc: "Safáris sob medida e hospedagens de alto luxo integradas com a natureza selvagem.", urlText: "África" },
    { title: "Jalapão Exclusivo", desc: "Aventura nos fervedouros e expedições privativas com conforto absoluto no cerrado.", urlText: "Jalapão" },
    { title: "Noronha Paradisíaco", desc: "Praias intocadas e experiências privativas na ilha mais bonita do Brasil.", urlText: "Noronha" },
    { title: "Ásia Exótica", desc: "Imersão cultural, templos sagrados e gastronomia com guias locais.", urlText: "Ásia" },
    { title: "EUA sob medida", desc: "Cidades vibrantes e parques naturais através de um olhar sob medida.", urlText: "EUA" },
    { title: "Caribe Exclusivo", desc: "Resorts de luxo, águas cristalinas e passeios de iate exclusivos.", urlText: "Caribe" }
  ];

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
    if (slides.length === 0) return;
    
    // Remove active state from current slide and track
    slides[currentIndex].classList.remove('active');
    progressTracks[currentIndex].classList.remove('active');

    currentIndex = index;

    // Add active state to new slide and track
    slides[currentIndex].classList.add('active');
    progressTracks[currentIndex].classList.add('active');

    // Fade and transition the destination card on the right
    if (slideCard) {
      slideCard.style.opacity = 0;
      slideCard.style.transform = 'translateY(8px)';
      setTimeout(() => {
        if (cardTitleEl) cardTitleEl.textContent = slideTexts[currentIndex].title;
        if (cardDescEl) cardDescEl.textContent = slideTexts[currentIndex].desc;
        if (cardCtaEl) {
          cardCtaEl.href = `https://wa.me/5521997138461?text=Olá!%20Gostaria%20de%20planejar%20minha%20viagem%20para%20a%20${encodeURIComponent(slideTexts[currentIndex].urlText)}.`;
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
      // Swipe left -> Next slide
      let nextIndex = (currentIndex + 1) % slides.length;
      changeSlide(nextIndex);
    } else if (touchEndX - touchStartX > swipeThreshold) {
      // Swipe right -> Prev slide
      let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      changeSlide(prevIndex);
    }
  };

  // Initialize Autoplay on page load
  if (slides.length > 0 && !prefersReducedMotion) {
    startAutoplay();
  }

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
  // 4. DESTINATIONS CARD CLICK INTERACTION (SCROLL & JUMP TO SLIDE)
  // ==========================================================================
  const destinationCards = document.querySelectorAll('.destino-card');
  destinationCards.forEach(card => {
    card.addEventListener('click', () => {
      const slideIndex = parseInt(card.getAttribute('data-slide'));
      changeSlide(slideIndex);
      
      // Scroll back up to the Hero section to show slide changes
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  });

  // ==========================================================================
  // 5. SMOOTH ANCHOR LINK NAVIGATION
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
  // 6. SCROLL REVEAL EFFECT (FADE IN SECTIONS)
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
    // Fallback for older browsers
    fadeSections.forEach(section => {
      section.classList.add('is-visible');
    });
  }

  // ==========================================================================
  // 7. FLOATING WHATSAPP BUTTON SCROLL EFFECT
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
