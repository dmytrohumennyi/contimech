(function(){
  const YEAR_MIN = 2025;

  const els = {
    app: null,
    list: null,
    msg: null,
    q: null,
    year: null,
    category: null,
    visibility: null,
    reset: null,
    count: null
  };

  function byId(id){ return document.getElementById(id); }

  function getEmbeddedData(){
    const el = byId('projects-data');
    if(!el) return null;
    try{ return JSON.parse(el.textContent); }catch(e){ return null; }
  }

  async function loadData(){
    // Prefer fetch when hosted; fall back to embedded JSON for file://.
    try{
      const res = await fetch('assets/data/projects.json', { cache: 'no-store' });
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if(Array.isArray(data)) return data;
      throw new Error('Invalid JSON');
    } catch(e){
      const embedded = getEmbeddedData();
      if(Array.isArray(embedded)) return embedded;
      throw e;
    }
  }

  function uniq(arr){ return Array.from(new Set(arr)); }

  function normalize(s){
    return (s || '').toString().toLowerCase();
  }

  function withinTimeWindow(p){
    // Keep items that are relevant to YEAR_MIN+.
    const years = Array.isArray(p.active_years) ? p.active_years : [];
    if(years.some(y => Number(y) >= YEAR_MIN)) return true;

    // If no active_years provided, attempt to infer from period string.
    const txt = normalize(p.period);
    const m = txt.match(/(20\d{2})/g);
    if(m){
      const ys = m.map(x => Number(x)).filter(n => !Number.isNaN(n));
      if(ys.some(y => y >= YEAR_MIN)) return true;
    }
    // Otherwise keep (so we don't silently hide data), but mark later.
    return true;
  }

  function buildOptions(projects){
    const years = uniq(projects.flatMap(p => Array.isArray(p.active_years) ? p.active_years : [])
      .map(y => Number(y)).filter(y => !Number.isNaN(y)))
      .sort((a,b)=>b-a);

    // If none provided, still show YEAR_MIN.
    const yearOptions = years.length ? years : [YEAR_MIN];

    // Categories
    const cats = uniq(projects.map(p => p.category).filter(Boolean));

    // Visibilities
    const vis = uniq(projects.map(p => p.visibility).filter(Boolean));

    // Render
    els.year.innerHTML = '<option value="">Усі</option>' +
      yearOptions.map(y => `<option value="${y}">${y}</option>`).join('');

    const catLabels = {
      scientific: 'Офіційні наукові',
      pet: 'Особисті pet‑проєкти',
      commercial: 'Комерційні (NDA‑safe)'
    };

    els.category.innerHTML = '<option value="">Усі</option>' +
      cats.map(c => `<option value="${c}">${catLabels[c] || c}</option>`).join('');

    const visLabels = {
      public: 'Публічні',
      nda: 'Під NDA',
      internal: 'Внутрішні'
    };

    els.visibility.innerHTML = '<option value="">Усі</option>' +
      vis.map(v => `<option value="${v}">${visLabels[v] || v}</option>`).join('');
  }

  function matches(project, q){
    if(!q) return true;
    const hay = [
      project.title,
      project.title_en,
      project.one_liner,
      project.summary,
      project.period,
      project.customer,
      project.status,
      project.start_year,
      project.end_year,
      project.role,
      project.category,
      project.visibility,
      (project.tags || []).join(' '),
      (project.links || []).map(l => `${l.label} ${l.url}`).join(' ')
    ].join(' ');
    return normalize(hay).includes(normalize(q));
  }

  function yearMatch(project, year){
    if(!year) return true;
    const ys = Array.isArray(project.active_years) ? project.active_years.map(Number) : [];
    if(ys.includes(Number(year))) return true;

    // Also allow match by period string.
    const txt = normalize(project.period);
    return txt.includes(String(year));
  }

  function renderProject(p){
    // Standard tile fields:
    // Title
    // Start/end years
    // Status (optional)
    // Customer description (optional)
    // One-liner summary

    const start = p.start_year ?? inferYear(p.period, 'min');
    const end = p.end_year ?? inferYear(p.period, 'max');
    const years = formatYears(start, end);

    const status = p.status ? String(p.status) : '';
    const customer = p.customer ? String(p.customer) : '';
    const oneLiner = p.one_liner || p.summary || '';

    const url = pickPrimaryUrl(p);
    const isDisabled = !url;
    const targetBlank = url && (isPdf(url) || isExternal(url));

    const isScientific = (p.category === 'scientific');

    const chips = [
      years ? `<span class="chip">${escapeHtml(years)}</span>` : '',
      status ? `<span class="chip">${escapeHtml(status)}</span>` : '',
      isScientific ? `<span class="chip chip-strong">Офіційний науковий</span>` : '',
      (p.visibility === 'nda') ? `<span class="chip">NDA‑safe</span>` : ''
    ].filter(Boolean).join('');

    const inner = `
      <div class="proj-kv">${chips}</div>
      <h3 class="proj-title">${escapeHtml(p.title || '')}</h3>
      <div class="proj-lines">
        ${customer ? `<div><strong>Замовник:</strong> ${escapeHtml(customer)}</div>` : ''}
        ${oneLiner ? `<div class="proj-desc">${escapeHtml(toOneSentence(oneLiner))}</div>` : ''}
        ${(p.note && isScientific) ? `<div class="proj-note">${escapeHtml(p.note)}</div>` : ''}
      </div>
    `;

    const cls = `proj-tile${isScientific ? ' proj-tile--scientific' : ''}${isDisabled ? ' disabled' : ''}`;

    if(isDisabled){
      return `<div class="${cls}" aria-disabled="true">${inner}</div>`;
    }

    return `
      <a class="${cls}" href="${escapeAttr(url)}" ${targetBlank ? 'target="_blank" rel="noopener"' : ''}>
        ${inner}
      </a>
    `;
  }

  function isExternal(url){
    return /^https?:\/\//i.test(url);
  }

  function isPdf(url){
    return (url || '').toLowerCase().endsWith('.pdf');
  }

  function pickPrimaryUrl(p){
    if(p.case_url) return p.case_url;
    const links = Array.isArray(p.links) ? p.links : [];
    const pdf = links.find(l => isPdf(l.url));
    if(pdf && pdf.url) return pdf.url;
    const any = links.find(l => l && l.url);
    return any ? any.url : '';
  }

  function inferYear(period, mode){
    const txt = normalize(period);
    const m = txt.match(/\b20\d{2}\b/g);
    if(!m || !m.length) return '';
    const ys = m.map(x => Number(x)).filter(n => !Number.isNaN(n));
    if(!ys.length) return '';
    return mode === 'min' ? Math.min(...ys) : Math.max(...ys);
  }

  function formatYears(start, end){
    const s = start ? String(start) : '';
    const e = end ? String(end) : '';
    if(s && e && s !== e) return `${s}–${e}`;
    if(s && e && s === e) return s;
    if(s && !e) return `${s}–…`;
    return '';
  }

  function toOneSentence(text){
    const t = (text || '').toString().trim();
    if(!t) return '';
    // keep only the first sentence-ish chunk
    const m = t.match(/^(.+?[\.!?])(\s|$)/);
    return m ? m[1] : t;
  }

  function escapeHtml(s){
    return (s ?? '').toString()
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function escapeAttr(s){
    return escapeHtml(s);
  }

  function applyFilters(projects){
    const q = els.q.value.trim();
    const year = els.year.value;
    const cat = els.category.value;
    const vis = els.visibility.value;

    const filtered = projects
      .filter(withinTimeWindow)
      .filter(p => matches(p, q))
      .filter(p => yearMatch(p, year))
      .filter(p => !cat || p.category === cat)
      .filter(p => !vis || p.visibility === vis);

    els.count.textContent = `${filtered.length} шт.`;
    els.list.innerHTML = filtered.map(renderProject).join('');

    if(filtered.length === 0){
      if(els.msg){
        els.msg.style.display = 'block';
        els.msg.textContent = 'Нічого не знайдено. Спробуй змінити фільтри.';
      }
    } else {
      if(els.msg) els.msg.style.display = 'none';
    }
  }

  function init(projects){
    els.app = byId('projects-app');
    // Keep compatibility with both id variants.
    els.list = byId('proj-list') || byId('projects-list');
    els.msg  = byId('projects-msg') || byId('proj-msg');
    els.q = byId('proj-q');
    els.year = byId('proj-year');
    els.category = byId('proj-cat');
    els.visibility = byId('proj-vis');
    els.reset = byId('proj-reset');
    els.count = byId('proj-count');

    buildOptions(projects);
    applyFilters(projects);

    const onChange = () => applyFilters(projects);
    els.q.addEventListener('input', onChange);
    els.year.addEventListener('change', onChange);
    els.category.addEventListener('change', onChange);
    els.visibility.addEventListener('change', onChange);

    els.reset.addEventListener('click', (e) => {
      e.preventDefault();
      els.q.value = '';
      els.year.value = '';
      els.category.value = '';
      els.visibility.value = '';
      applyFilters(projects);
    });
  }

  (async function main(){
    const status = byId('projects-status');
    try{
      const projects = await loadData();
      init(Array.isArray(projects) ? projects : []);
      if(status) status.style.display = 'none';
    } catch(e){
      if(status){
        status.style.display = 'block';
        status.textContent = 'Не вдалося завантажити проєкти. Перевір, що assets/data/projects.json існує та доступний.';
      }
    }
  })();
})();
