(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('nav-mobile');
  if (!header || !toggle || !mobileNav) return;

  const setOpen = (open) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };

  toggle.addEventListener('click', () => {
    setOpen(!header.classList.contains('is-open'));
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

(() => {
  document.querySelectorAll('[data-slider-nav]').forEach((nav) => {
    const list = document.getElementById(nav.dataset.sliderNav);
    const dots = nav.querySelectorAll('.slider-nav__dot');
    if (!list || !dots.length) return;

    const updateActiveDot = () => {
      const items = Array.from(list.children);
      const maxScroll = list.scrollWidth - list.clientWidth;
      let index = 0;
      if (maxScroll > 0) {
        index = Math.round((list.scrollLeft / maxScroll) * (items.length - 1));
      }
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };

    list.addEventListener('scroll', updateActiveDot, { passive: true });
    window.addEventListener('resize', updateActiveDot);
    updateActiveDot();
  });
})();
