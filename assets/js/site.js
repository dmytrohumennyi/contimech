(function(){
  // active nav
  const path = location.pathname.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    const normalized = href.replace(/\/index\.html$/, '/');
    if(normalized === path || (path.endsWith('/') && normalized === './')) a.classList.add('active');
    if(path.endsWith(href)) a.classList.add('active');
  });

  // copy email buttons
  document.querySelectorAll('[data-copy]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const text = btn.getAttribute('data-copy');
      try{
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = 'Скопійовано';
        setTimeout(()=>btn.textContent = old, 1200);
      }catch(e){}
    });
  });
})();
