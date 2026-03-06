(function () {
  const dataEl = document.getElementById('projects-data');
  const app = document.getElementById('projects-app');
  if (!dataEl || !app) return;

  const data = JSON.parse(dataEl.textContent || '[]');
  const els = {
    q: document.getElementById('proj-q'),
    year: document.getElementById('proj-year'),
    category: document.getElementById('proj-cat'),
    visibility: document.getElementById('proj-vis'),
    reset: document.getElementById('proj-reset'),
    list: document.getElementById('proj-list'),
    msg: document.getElementById('projects-msg'),
    status: document.getElementById('projects-status'),
    count: document.getElementById('proj-count')
  };

  function escapeHtml(str) {
    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function norm(v) { return String(v || '').toLowerCase(); }

  function initFilters() {
    const years = [...new Set(data.flatMap(p => p.active_years || [p.start_year]).filter(Boolean))].sort((a, b) => b - a);
    els.year.innerHTML = '<option value="">All</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

    const catLabels = {
      scientific: 'Official scientific',
      pet: 'Personal pet projects',
      commercial: 'Commercial (NDA-safe)'
    };
    els.category.innerHTML = '<option value="">All</option>' + Object.entries(catLabels).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

    const visLabels = {
      public: 'Public',
      nda: 'Under NDA',
      internal: 'Internal'
    };
    els.visibility.innerHTML = '<option value="">All</option>' + Object.entries(visLabels).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  }

  function tile(p) {
    const href = p.case_url || (p.links && p.links[0] && p.links[0].url) || '#';
    const customer = p.customer || '';
    const role = p.role || '';
    const note = p.note || '';
    const tags = (p.tags || []).map(t => `<span class="chip chip-sm">${escapeHtml(t)}</span>`).join('');
    const links = (p.links || []).map(l => `<a class="btn" href="${escapeHtml(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${escapeHtml(l.label)}</a>`).join(' ');
    const isScientific = p.category === 'scientific';
    return `
      <article class="card proj-tile">
        <a class="proj-overlay" href="${escapeHtml(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''} aria-label="Open case study"></a>
        <div class="proj-tile-body">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            ${isScientific ? `<span class="chip chip-strong">Official scientific</span>` : ''}
            <span class="chip chip-sm">${escapeHtml(p.status || '')}</span>
            <span class="chip chip-sm">${escapeHtml(p.period || '')}</span>
          </div>
          <h2 style="margin:0 0 8px">${escapeHtml(p.title)}</h2>
          <p class="muted" style="margin:0 0 10px">${escapeHtml(p.one_liner || '')}</p>
          <div class="kv">
            ${customer ? `<div><strong>Customer:</strong> ${escapeHtml(customer)}</div>` : ''}
            ${role ? `<div><strong>Role:</strong> ${escapeHtml(role)}</div>` : ''}
          </div>
          <p style="margin-top:10px">${escapeHtml(p.summary || '')}</p>
          ${note ? `<p class="muted">${escapeHtml(note)}</p>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${tags}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${links}</div>
        </div>
      </article>`;
  }

  function render() {
    const q = norm(els.q.value);
    const year = els.year.value;
    const cat = els.category.value;
    const vis = els.visibility.value;

    const filtered = data.filter(p => {
      if (year && !(p.active_years || []).map(String).includes(String(year)) && String(p.start_year) !== String(year)) return false;
      if (cat && p.category !== cat) return false;
      if (vis && p.visibility !== vis) return false;
      if (q) {
        const hay = [p.title, p.one_liner, p.summary, p.role, p.customer, ...(p.tags || [])].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    els.count.textContent = `${filtered.length} items`;
    if (!filtered.length) {
      els.list.innerHTML = '';
      els.msg.style.display = 'block';
      els.msg.textContent = 'Nothing found. Try adjusting the filters.';
      return;
    }
    els.msg.style.display = 'none';
    els.list.innerHTML = filtered.map(tile).join('');
  }

  try {
    initFilters();
    render();
    [els.q, els.year, els.category, els.visibility].forEach(el => {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    els.reset.addEventListener('click', (e) => {
      e.preventDefault();
      els.q.value = '';
      els.year.value = '';
      els.category.value = '';
      els.visibility.value = '';
      render();
    });
  } catch (e) {
    console.error(e);
    els.status.style.display = 'block';
    els.status.textContent = 'Failed to load projects. Please check that assets/data/projects.json exists and is accessible.';
  }
})();
