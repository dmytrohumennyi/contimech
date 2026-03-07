(function () {
  const dataEl = document.getElementById('blog-data');
  const listEl = document.getElementById('blog-list');
  if (!dataEl || !listEl) return;

  const all = JSON.parse(dataEl.textContent || '[]');
  const qEl = document.getElementById('blog-q');
  const yearEl = document.getElementById('blog-year');
  const typeEl = document.getElementById('blog-type');
  const tagEl = document.getElementById('blog-tag');
  const resetEl = document.getElementById('blog-reset');
  const msgEl = document.getElementById('blog-msg');
  const moreEl = document.getElementById('blog-more');

  const PAGE = 6;
  let shown = PAGE;

  const labels = {
    type: {
      conference: 'Conference',
      talk: 'Talk',
      academic: 'Academic',
      meetup: 'Meetup',
      note: 'Note',
      professional: 'Professional',
      partnership: 'Partnership'
    }
  };

  function modeLabel(mode) {
    const map = { speaker: 'Speaker', attendee: 'Attendee', committee: 'State board', partnership: 'Partnership' };
    return map[mode] || mode || '';
  }

  function esc(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function fillSelect(el, values, placeholder) {
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = placeholder || 'All';
    el.innerHTML = '';
    el.appendChild(optAll);
    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      el.appendChild(o);
    });
  }

  function norm(v) { return String(v || '').toLowerCase(); }

  function card(p) {
    const cover = p.cover ? `<a href="${esc(p.post_url)}" class="post-card-cover"><img src="${esc(p.cover)}" alt="${esc(p.title)}"></a>` : '';
    const chips = (p.tags || []).slice(0, 5).map(t => `<span class="chip chip-sm">${esc(t)}</span>`).join('');
    const typeTxt = labels.type[p.type] || p.type || '';
    const modeTxt = modeLabel(p.mode);
    return `
      <article class="post-card card">
        ${cover}
        <div class="post-card-body">
          <div class="muted">${esc(p.date)}${p.location ? ' • ' + esc(p.location) : ''}</div>
          <h2 class="post-card-title"><a href="${esc(p.post_url)}">${esc(p.title)}</a></h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            ${typeTxt ? `<span class="chip chip-sm">${esc(typeTxt)}</span>` : ''}
            ${modeTxt ? `<span class="chip chip-sm">${esc(modeTxt)}</span>` : ''}
          </div>
          <p class="muted" style="margin-top:10px">${esc(p.summary || '')}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${chips}</div>
        </div>
      </article>`;
  }

  function apply() {
    const q = norm(qEl?.value);
    const y = yearEl?.value || '';
    const t = typeEl?.value || '';
    const g = tagEl?.value || '';

    const filtered = all.filter(p => {
      if (y && String(p.year) !== y) return false;
      if (t && p.type !== t) return false;
      if (g && !(p.tags || []).includes(g)) return false;
      if (q) {
        const hay = [p.title, p.summary, p.location, p.type, ...(p.tags || [])].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const visible = filtered.slice(0, shown);
    listEl.innerHTML = visible.map(card).join('');
    msgEl.style.display = filtered.length ? 'none' : 'block';
    moreEl.style.display = filtered.length > shown ? 'inline-flex' : 'none';
  }

  function initFilters() {
    const years = [...new Set(all.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
    const types = [...new Set(all.map(p => p.type).filter(Boolean))].sort();
    const tags = [...new Set(all.flatMap(p => p.tags || []))].sort((a, b) => a.localeCompare(b));
    fillSelect(yearEl, years, 'All');
    fillSelect(typeEl, types.map(t => labels.type[t] || t), 'All');
    // restore machine values for type select
    [...typeEl.options].forEach((opt, idx) => {
      if (idx > 0) opt.value = types[idx - 1];
    });
    fillSelect(tagEl, tags, 'All');
  }

  [qEl, yearEl, typeEl, tagEl].forEach(el => el && el.addEventListener('input', () => { shown = PAGE; apply(); }));
  [yearEl, typeEl, tagEl].forEach(el => el && el.addEventListener('change', () => { shown = PAGE; apply(); }));
  resetEl?.addEventListener('click', () => {
    qEl.value = '';
    yearEl.value = '';
    typeEl.value = '';
    tagEl.value = '';
    shown = PAGE;
    apply();
  });
  moreEl?.addEventListener('click', () => { shown += PAGE; apply(); });

  try {
    initFilters();
    apply();
  } catch (e) {
    console.error(e);
    msgEl.style.display = 'block';
    msgEl.textContent = 'Failed to load blog posts. Please check that the data is available.';
  }
})();
