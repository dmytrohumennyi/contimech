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
})();
