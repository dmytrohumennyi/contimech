(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const txt = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(txt);
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = prev; }, 1200);
      } catch (e) {
        console.error(e);
      }
    });
  });

  document.querySelectorAll('.header').forEach((header) => {
    const nav = header.querySelector('.nav');
    const inner = header.querySelector('.header-inner');
    if (!nav || !inner || inner.querySelector('.nav-toggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.innerHTML = '<span class="nav-toggle-bar" aria-hidden="true"></span><span class="nav-toggle-label">Menu</span>';
    inner.insertBefore(toggle, nav);

    const closeMenu = () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      header.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
      const isOpen = header.classList.contains('nav-open');
      if (isOpen) closeMenu(); else openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 840) closeMenu();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 840) closeMenu();
    });
  });
})();
