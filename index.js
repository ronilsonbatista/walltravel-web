document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. STICKY HEADER SCROLL EFFECT
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
  // 3. HERO AUTOMATIC SLIDESHOW & TEXTS
  // ==========================================================================
  const slideTexts = [
    { title: "Viva a Europa como um verdadeiro europeu!", desc: "Com a Walltravel, você explora o continente com quem já morou lá." },
    { title: "Descubra o Nordeste além das praias!", desc: "Roteiros exclusivos e curadoria das melhores hospedagens e experiências." },
    { title: "Safari na África com segurança total!", desc: "Vivencie a vida selvagem com a melhor logística e suporte." },
    { title: "Jalapão selvagem sem perrengue!", desc: "Aventura e ecoturismo com conforto e guias especializados." },
    { title: "Noronha exclusiva, longe das multidões!", desc: "Praias intocadas e experiências privativas na ilha mais bonita do Brasil." },
    { title: "Ásia exótica sem barreiras culturais!", desc: "Imersão cultural, templos sagrados e gastronomia com guias locais." },
    { title: "EUA além dos pontos turísticos!", desc: "Cidades vibrantes e parques naturais através de um olhar sob medida." },
    { title: "Caribe paradisíaco sob medida!", desc: "Resorts de luxo, águas cristalinas e passeios de iate exclusivos." }
  ];

  let currentIndex = 0;
  const slides = document.querySelectorAll('.hero-slide');
  const progressTracks = document.querySelectorAll('.progress-bar-track');
  const titleEl = document.getElementById('hero-dynamic-title');
  const descEl = document.getElementById('hero-dynamic-desc');
  let autoplayInterval;

  const changeSlide = (index) => {
    if (slides.length === 0) return;
    
    // Remove active state from current slide and track
    slides[currentIndex].classList.remove('active');
    progressTracks[currentIndex].classList.remove('active');

    currentIndex = index;

    // Add active state to new slide and track
    slides[currentIndex].classList.add('active');
    progressTracks[currentIndex].classList.add('active');

    // Fade text content smoothly
    if (titleEl && descEl) {
      titleEl.style.opacity = 0;
      descEl.style.opacity = 0;
      setTimeout(() => {
        titleEl.textContent = slideTexts[currentIndex].title;
        descEl.textContent = slideTexts[currentIndex].desc;
        titleEl.style.opacity = 1;
        descEl.style.opacity = 1;
      }, 350);
    }

    startAutoplay();
  };

  const startAutoplay = () => {
    clearInterval(autoplayInterval);
    autoplayInterval = setInterval(() => {
      let nextIndex = (currentIndex + 1) % slides.length;
      changeSlide(nextIndex);
    }, 5000); // 5 seconds autoplay interval
  };

  // Add click listeners to progress bar tracks to manually switch slides
  progressTracks.forEach((track, i) => {
    track.addEventListener('click', () => {
      changeSlide(i);
    });
  });

  // Initialize Autoplay on page load
  if (slides.length > 0) {
    startAutoplay();
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
