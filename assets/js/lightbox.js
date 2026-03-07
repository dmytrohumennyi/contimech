(function () {
  const candidates = document.querySelectorAll('[data-lightbox], .gallery img[data-lightbox], .gallery img');
  if (!candidates.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lb-overlay';
  overlay.innerHTML = `
    <div class="lb-dialog" role="dialog" aria-modal="true">
      <button class="lb-close" type="button" aria-label="Close">×</button>
      <figure class="lb-figure">
        <img class="lb-image" alt="" />
        <figcaption class="lb-caption"></figcaption>
      </figure>
      <div class="lb-nav">
        <button class="lb-prev" type="button" aria-label="Previous">‹</button>
        <button class="lb-next" type="button" aria-label="Next">›</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lb-image');
  const capEl = overlay.querySelector('.lb-caption');
  const prevEl = overlay.querySelector('.lb-prev');
  const nextEl = overlay.querySelector('.lb-next');
  const closeEl = overlay.querySelector('.lb-close');

  let group = [];
  let index = 0;

  function srcOf(node) {
    if (node.tagName === 'A') return node.getAttribute('href');
    return node.getAttribute('src');
  }

  function captionOf(node) {
    return node.getAttribute('data-caption') || node.getAttribute('alt') || '';
  }

  function members(node) {
    const groupId = node.getAttribute('data-lightbox-group');
    if (!groupId) return [node];
    return [...document.querySelectorAll(`[data-lightbox-group="${groupId}"]`)];
  }

  function show(i) {
    index = (i + group.length) % group.length;
    const node = group[index];
    imgEl.src = srcOf(node);
    imgEl.alt = captionOf(node);
    capEl.textContent = captionOf(node);
    overlay.classList.add('open');
  }

  candidates.forEach((node) => {
    node.style.cursor = 'zoom-in';
    node.addEventListener('click', (e) => {
      e.preventDefault();
      group = members(node);
      index = group.indexOf(node);
      if (index < 0) index = 0;
      show(index);
    });
  });

  prevEl.addEventListener('click', () => show(index - 1));
  nextEl.addEventListener('click', () => show(index + 1));
  closeEl.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') overlay.classList.remove('open');
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
})();
