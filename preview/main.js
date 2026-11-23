/**
 * Echo & Air Phase 2 concept interactions.
 * No checkout, customer data or commerce functionality is implemented here.
 */
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');

  if (toggle && nav) {
    let previousFocus = null;

    const closeMenu = (restoreFocus = false) => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      document.body.classList.remove('nav-open');
      if (restoreFocus) (previousFocus || toggle).focus();
    };

    const openMenu = () => {
      previousFocus = document.activeElement;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
      document.body.classList.add('nav-open');
      nav.querySelector('a')?.focus();
    };

    toggle.addEventListener('click', () => {
      toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu(true);
      }
    });
    document.addEventListener('click', (event) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 780 && toggle.getAttribute('aria-expanded') === 'true') closeMenu();
    });
  }

  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const looks = Array.from(document.querySelectorAll('.look-card[data-category]'));
  const counter = document.querySelector('#filter-result');

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const selected = filter.dataset.filter;
      let visible = 0;

      filters.forEach((item) => {
        const active = item === filter;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      looks.forEach((look) => {
        const shouldShow = selected === 'all' || look.dataset.category === selected;
        look.hidden = !shouldShow;
        if (shouldShow) visible += 1;
      });

      if (counter) counter.textContent = `${visible} ${visible === 1 ? 'look' : 'looks'}`;
    });
  });
})();
