/**
 * OscoBox — Tutorial Page
 * Features: navbar scroll shadow, hamburger menu, smooth scrolling
 */

'use strict';

/* ── Navbar scroll shadow ────────────────────────────────── */
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  const onScroll = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Hamburger ───────────────────────────────────────────── */
(function initHamburger() {
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  const open  = () => {
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    menu.removeAttribute('aria-hidden');
  };
  
  const close = () => {
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
  };

  btn.addEventListener('click', () => {
    btn.classList.contains('is-open') ? close() : open();
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Close menu when window is resized to desktop
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
    if (e.matches) close();
  });
})();

/* ── Smooth scroll for anchor links ──────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
