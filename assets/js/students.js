(function(){
  // Tabs
  const tabButtons = document.querySelectorAll('[data-students-tab]');
  const tabCourses = document.getElementById('studentsTabCourses');
  const tabThesis = document.getElementById('studentsTabThesis');

  function setTab(name){
    if(!tabCourses || !tabThesis || !tabButtons.length) return;
    const isCourses = name === 'courses';
    tabCourses.style.display = isCourses ? '' : 'none';
    tabThesis.style.display = isCourses ? 'none' : '';

    tabButtons.forEach(btn => {
      const active = btn.getAttribute('data-students-tab') === name;
      btn.classList.toggle('primary', active);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.getAttribute('data-students-tab')));
  });

  // Courses dropdown
  const select = document.getElementById('studentCourseSelect');
  const meta = document.getElementById('studentCourseMeta');
  const resources = document.getElementById('studentCourseResources');
  if(!select || !meta || !resources) return;

  const COURSES = {
    specialized_architectures: {
      title: 'Спеціалізовані архітектури комп’ютеризованих систем',
      folder: 'specialized-architectures',
      tags: ['КНУБА', 'Архітектура', 'Embedded/SoC'],
    },
    operations_management_it: {
      title: 'Операційний менеджмент в ІТ',
      folder: 'operations-management-it',
      tags: ['КНУБА', 'Delivery', 'Процеси'],
    },
    reliability: {
      title: 'Надійність комп’ютерних систем',
      folder: 'reliability-computer-systems',
      tags: ['КНУБА', 'Надійність', 'Відмовостійкість'],
    }
  };

  const order = ['operations_management_it','specialized_architectures','reliability'];

  order.forEach(id => {
    const c = COURSES[id];
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = c.title;
    select.appendChild(opt);
  });

  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  function fileHref(folder, filename){
    return `assets/files/students/courses/${folder}/${filename}`;
  }

  function card(title, desc, href, download=true){
    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(desc || '');
    const action = href
      ? `<a class="btn primary" href="${escapeHtml(href)}"${download ? ' download' : ''}>Завантажити</a>`
      : `<span class="btn" aria-disabled="true" style="opacity:.65;cursor:not-allowed">Немає</span>`;

    return `
      <div class="card" style="grid-column:span 6">
        <h2 style="margin:0 0 8px;font-size:16px">${safeTitle}</h2>
        <p style="margin:0;color:var(--muted)">${safeDesc}</p>
        <div style="margin-top:12px">${action}</div>
      </div>
    `;
  }

  function renderCourse(id){
    const c = COURSES[id];
    if(!c){
      meta.style.display = 'none';
      resources.innerHTML = '';
      return;
    }

    meta.style.display = '';
    meta.innerHTML = c.tags.map(t => `<span class="pill">${escapeHtml(t)}</span>`).join('');

    const folder = c.folder;
    const cards = [
      card('Методичка (PDF)', 'Офіційна методичка/гайд по дисципліні.', fileHref(folder,'Methodical.pdf')),
      card('DoD — критерії здачі (MD)', 'Definition of Done: що саме треба здати і як перевіряється.', fileHref(folder,'DoD.md')),
      card('Слайди (PDF)', 'Лекційні слайди. Очікуваний файл: Slides.pdf (можна просто замінювати вміст).', fileHref(folder,'Slides.pdf')),
      card('Рекомендовані джерела (MD)', 'Список для самостійного опрацювання.', fileHref(folder,'Sources.md')),
    ].join('');

    resources.innerHTML = `
      <div class="grid" style="margin-top:12px">
        ${cards}
      </div>
    `;
  }

  select.addEventListener('change', ()=> renderCourse(select.value));

  // Default tab
  setTab('courses');
})();
