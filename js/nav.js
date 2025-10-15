(() => {
  const nav = document.querySelector('.navbar');
  if (!nav) return;

  const reveal = () => { if (scrollY > 10) nav.classList.add('nav-reveal'); else nav.classList.remove('nav-reveal'); };
  reveal();
  addEventListener('scroll', reveal, { passive: true });

  const navEl = document.getElementById('nav');
  if (navEl) {
    navEl.addEventListener('show.bs.collapse', () => document.body.classList.add('menu-open'));
    navEl.addEventListener('hidden.bs.collapse', () => document.body.classList.remove('menu-open'));
    navEl.addEventListener('click', e => {
      if (e.target.matches('.nav-link')) {
        const c = bootstrap.Collapse.getInstance(navEl);
        c && c.hide();
      }
    });
  }

  const setOffset = () => document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  addEventListener('load', setOffset);
  addEventListener('resize', setOffset);
  setOffset();
})();
