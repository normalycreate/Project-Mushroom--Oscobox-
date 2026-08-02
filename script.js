/**
 * OscoBox — Main Script
 * Features:
 *  - Sticky navbar shadow on scroll
 *  - Mobile hamburger menu toggle
 *  - Active nav link highlighting
 */

/* ============================================================
   NAVBAR — Sticky scroll shadow
   ============================================================ */
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const SCROLL_THRESHOLD = 10;

  const onScroll = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Run once on load to handle hard-refresh mid-page
  onScroll();
})();


/* ============================================================
   HAMBURGER — Mobile menu toggle
   ============================================================ */
(function initHamburger() {
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  const openMenu = () => {
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    menu.removeAttribute('aria-hidden');
  };

  const closeMenu = () => {
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
  };

  const toggleMenu = () => {
    const isOpen = btn.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  };

  btn.addEventListener('click', toggleMenu);

  // Close menu when a link inside it is clicked
  menu.querySelectorAll('.navbar__mobile-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.classList.contains('is-open')) {
      closeMenu();
      btn.focus();
    }
  });

  // Close menu if viewport widens past mobile breakpoint
  const mediaQuery = window.matchMedia('(min-width: 768px)');
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches) closeMenu();
  });
})();


/* ============================================================
   ACTIVE NAV LINK — Highlight current section on scroll
   ============================================================ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks  = document.querySelectorAll('.navbar__link');
  if (!sections.length || !navLinks.length) return;

  const OFFSET = 100;

  const updateActiveLink = () => {
    let currentId = '';

    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop <= OFFSET) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('navbar__link--active');
      const href = link.getAttribute('href');
      if (href === `#${currentId}`) {
        link.classList.add('navbar__link--active');
      }
    });
  };

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink(); // Initial call
})();
