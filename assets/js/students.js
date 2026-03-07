(function () {
  const select = document.getElementById('studentCourseSelect');
  const meta = document.getElementById('studentCourseMeta');
  const resources = document.getElementById('studentCourseResources');
  const tabCourses = document.getElementById('studentsTabCourses');
  const tabThesis = document.getElementById('studentsTabThesis');
  if (!select || !resources || !meta) return;

  const tabs = document.querySelectorAll('[data-students-tab]');
  tabs.forEach((btn) => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('primary'));
    btn.classList.add('primary');
    const mode = btn.getAttribute('data-students-tab');
    tabCourses.style.display = mode === 'courses' ? '' : 'none';
    tabThesis.style.display = mode === 'thesis' ? '' : 'none';
  }));

  const courses = [
    { slug: 'specialized-architectures', title: 'Specialized Architectures of Computerized Systems', folder: 'assets/files/students/courses/specialized-architectures', tags: ['KNUBA', 'Architecture', 'Embedded/SoC'] },
    { slug: 'operations-management-it', title: 'Operations Management in IT', folder: 'assets/files/students/courses/operations-management-it', tags: ['KNUBA', 'Delivery', 'Processes'] },
    { slug: 'reliability-computer-systems', title: 'Reliability of Computer Systems', folder: 'assets/files/students/courses/reliability-computer-systems', tags: ['KNUBA', 'Reliability', 'Fault Tolerance'] }
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function fileHref(folder, name) { return `${folder}/${name}`; }

  function card(title, desc, href, download = false) {
    return `
      <div class="card" style="grid-column:span 4">
        <h3 style="margin:0 0 8px;font-size:16px">${escapeHtml(title)}</h3>
        <p class="muted" style="margin:0 0 12px">${escapeHtml(desc)}</p>
        ${href ? `<a class="btn primary" href="${escapeHtml(href)}"${download ? ' download' : ''}>Download</a>` : `<span class="btn" aria-disabled="true" style="opacity:.65;cursor:not-allowed">Missing</span>`}
      </div>`;
  }

  function renderCourse(c) {
    meta.style.display = '';
    meta.innerHTML = (c.tags || []).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join('');
    resources.innerHTML = `
      <div class="grid">
        ${card('Methodical guide (PDF)', 'Official course guide / handbook.', fileHref(c.folder,'Methodical.pdf'))}
        ${card('DoD — delivery criteria (MD)', 'Definition of Done: what exactly must be submitted and how it is checked.', fileHref(c.folder,'DoD.md'))}
        ${card('Slides (PDF)', 'Lecture slides. Expected file name: Slides.pdf.', fileHref(c.folder,'Slides.pdf'))}
        ${card('Recommended sources (MD)', 'Reading list for self-study.', fileHref(c.folder,'Sources.md'))}
      </div>`;
  }

  select.innerHTML += courses.map(c => `<option value="${c.slug}">${escapeHtml(c.title)}</option>`).join('');
  select.addEventListener('change', () => {
    const c = courses.find(x => x.slug === select.value);
    if (c) renderCourse(c);
  });
})();
