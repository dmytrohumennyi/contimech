/* Blog index + small utilities (file:// compatible via inline JSON fallback) */
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function parseInlineJSON(id){
    const el = document.getElementById(id);
    if(!el) return null;
    try { return JSON.parse(el.textContent); } catch(e){ return null; }
  }

  async function loadBlogData(){
    // 1) Try fetch (GitHub Pages)
    try{
      const res = await fetch("../assets/data/blog.json", {cache:"no-store"});
      if(res.ok) return await res.json();
    }catch(e){}
    // 2) Fallback: inline JSON (file://)
    const inline = parseInlineJSON("blog-data");
    if(inline) return inline;
    throw new Error("blog data not available");
  }

  function typeLabel(t){
    const map = {
      "conference": "Конференція",
      "talk": "Виступ",
      "academic": "Академія",
      "meetup": "Проф. зустріч",
      "note": "Нотатка",
      "professional": "Практика",
      "partnership": "Партнерство"
    };
    return map[t] || t;
  }
  function modeLabel(m){
    const map = {"speaker":"Speaker", "attendee":"Attendee", "committee":"ДЕК", "partnership":"Партнерство"};
    return map[m] || m || "";
  }

  function uniqSorted(arr){
    return Array.from(new Set(arr)).sort((a,b)=> (""+b).localeCompare(""+a, "uk"));
  }

  function normalize(s){ return (s||"").toLowerCase(); }

  function matches(entry, state){
    const hay = normalize([
      entry.title, entry.summary, entry.location,
      (entry.tags||[]).join(" "), entry.type, entry.mode
    ].join(" | "));
    if(state.q && !hay.includes(normalize(state.q))) return false;
    if(state.year !== "all" && String(entry.year) !== String(state.year)) return false;
    if(state.type !== "all" && entry.type !== state.type) return false;
    if(state.tag !== "all" && !(entry.tags||[]).includes(state.tag)) return false;
    return true;
  }

  function renderCard(entry){
    const tags = (entry.tags||[]).slice(0,6).map(t => `<button class="chip chip-sm chip-click" type="button" data-tag="${t}">${t}</button>`).join("");
    const cover = entry.cover ? `<div class="blog-cover"><img loading="lazy" src="${entry.cover}" alt="${entry.title}"></div>` : "";
    const badges = [
      entry.mode ? `<span class="badge">${modeLabel(entry.mode)}</span>` : "",
      entry.type ? `<span class="badge badge-outline">${typeLabel(entry.type)}</span>` : ""
    ].filter(Boolean).join(" ");
    const meta = [
      entry.date,
      entry.location ? entry.location : "",
      entry.gallery && entry.gallery.length ? `📷 ${entry.gallery.length}` : ""
    ].filter(Boolean).join(" • ");

    const href = entry.post_url || "#";
    return `
      <article class="blog-card">
        <a class="blog-card-link" href="${href}">
          ${cover}
          <div class="blog-body">
            <div class="blog-top">
              <div class="blog-badges">${badges}</div>
              <div class="blog-meta">${meta}</div>
            </div>
            <h3 class="blog-title">${entry.title}</h3>
            <p class="blog-summary">${entry.summary || ""}</p>
            <div class="blog-tags">${tags}</div>
          </div>
        </a>
      </article>
    `;
  }

  function fillSelect(select, options, placeholder){
    select.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = placeholder || "Усі";
    select.appendChild(optAll);
    for(const o of options){
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      select.appendChild(opt);
    }
  }

  async function initBlogIndex(){
    const listEl = $("#blog-list");
    if(!listEl) return;

    const msgEl = $("#blog-msg");
    const qEl = $("#blog-q");
    const yearEl = $("#blog-year");
    const typeEl = $("#blog-type");
    const tagEl = $("#blog-tag");
    const resetEl = $("#blog-reset");
    const moreEl = $("#blog-more");

    const state = { q:"", year:"all", type:"all", tag:"all", shown:0, step:10 };
    let all = [];

    function render(){
      const filtered = all.filter(e => matches(e, state))
                          .sort((a,b)=> (b.date||"").localeCompare(a.date||""));
      if(state.shown === 0) state.shown = Math.min(state.step, filtered.length);
      const slice = filtered.slice(0, state.shown);

      listEl.innerHTML = slice.map(renderCard).join("");

      if(msgEl){
        msgEl.style.display = filtered.length ? "none" : "block";
      }
      if(moreEl){
        moreEl.style.display = (filtered.length > state.shown) ? "inline-flex" : "none";
      }

      // tag chip click -> set tag filter
      $$(".chip-click", listEl).forEach(btn=>{
        btn.addEventListener("click", (ev)=>{
          ev.preventDefault();
          const t = btn.getAttribute("data-tag");
          if(!t) return;
          tagEl.value = t;
          state.tag = t;
          state.shown = 0;
          render();
          window.scrollTo({top: 0, behavior:"smooth"});
        });
      });
    }

    function reset(){
      state.q = ""; state.year="all"; state.type="all"; state.tag="all"; state.shown=0;
      qEl.value = ""; yearEl.value="all"; typeEl.value="all"; tagEl.value="all";
      render();
    }

    try{
      all = await loadBlogData();
      // fill filters
      const years = uniqSorted(all.map(e=>e.year).filter(Boolean));
      const types = Array.from(new Set(all.map(e=>e.type).filter(Boolean))).sort();
      const tags = Array.from(new Set(all.flatMap(e=>e.tags||[]))).sort((a,b)=>a.localeCompare(b, "en"));

      fillSelect(yearEl, years, "Усі");
      fillSelect(typeEl, types.map(t=>t), "Усі");
      // Show human labels in type dropdown
      Array.from(typeEl.options).forEach(opt=>{
        if(opt.value !== "all") opt.textContent = typeLabel(opt.value);
      });
      fillSelect(tagEl, tags, "Усі");

      render();
    }catch(e){
      if(msgEl){
        msgEl.textContent = "Не вдалося завантажити дописи блогу. Перевір, що дані доступні.";
        msgEl.style.display = "block";
      }
      return;
    }

    qEl?.addEventListener("input", ()=>{
      state.q = qEl.value.trim();
      state.shown = 0;
      render();
    });
    yearEl?.addEventListener("change", ()=>{
      state.year = yearEl.value;
      state.shown = 0;
      render();
    });
    typeEl?.addEventListener("change", ()=>{
      state.type = typeEl.value;
      state.shown = 0;
      render();
    });
    tagEl?.addEventListener("change", ()=>{
      state.tag = tagEl.value;
      state.shown = 0;
      render();
    });
    resetEl?.addEventListener("click", reset);
    moreEl?.addEventListener("click", ()=>{
      const filtered = all.filter(e => matches(e, state));
      state.shown = Math.min(state.shown + state.step, filtered.length);
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", initBlogIndex);
})();
