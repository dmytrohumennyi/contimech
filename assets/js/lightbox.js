/* Minimal lightbox for images with data-lightbox attribute */
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function ensureOverlay(){
    let ov = $("#lb-overlay");
    if(ov) return ov;
    ov = document.createElement("div");
    ov.id = "lb-overlay";
    ov.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-dialog" role="dialog" aria-modal="true">
        <button class="lb-close" type="button" aria-label="Закрити">×</button>
        <img class="lb-img" alt="">
        <div class="lb-caption"></div>
        <div class="lb-nav">
          <button class="lb-prev" type="button" aria-label="Попереднє">‹</button>
          <button class="lb-next" type="button" aria-label="Наступне">›</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    return ov;
  }

  function openLightbox(group, idx){
    const ov = ensureOverlay();
    const imgEl = ov.querySelector(".lb-img");
    const capEl = ov.querySelector(".lb-caption");
    const closeBtn = ov.querySelector(".lb-close");
    const prevBtn = ov.querySelector(".lb-prev");
    const nextBtn = ov.querySelector(".lb-next");
    let i = idx;

    function show(){
      const it = group[i];
      imgEl.src = it.src;
      imgEl.alt = it.alt || "";
      capEl.textContent = it.caption || "";
      prevBtn.disabled = (group.length<=1);
      nextBtn.disabled = (group.length<=1);
    }

    function close(){
      ov.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      imgEl.src = "";
      window.removeEventListener("keydown", onKey);
    }

    function onKey(e){
      if(e.key === "Escape") close();
      if(e.key === "ArrowLeft") prev();
      if(e.key === "ArrowRight") next();
    }
    function prev(){ i = (i - 1 + group.length) % group.length; show(); }
    function next(){ i = (i + 1) % group.length; show(); }

    ov.querySelector(".lb-backdrop").onclick = close;
    closeBtn.onclick = close;
    prevBtn.onclick = prev;
    nextBtn.onclick = next;
    window.addEventListener("keydown", onKey);

    show();
    ov.classList.add("is-open");
    document.body.classList.add("no-scroll");
  }

  function init(){
    const imgs = $$("img[data-lightbox]");
    if(!imgs.length) return;

    // group by data-lightbox-group
    const groups = {};
    imgs.forEach(img=>{
      const g = img.getAttribute("data-lightbox-group") || "__default__";
      groups[g] = groups[g] || [];
      groups[g].push({
        el: img,
        src: img.getAttribute("data-full") || img.src,
        alt: img.alt || "",
        caption: img.getAttribute("data-caption") || ""
      });
    });

    Object.entries(groups).forEach(([g, items])=>{
      items.forEach((it, idx)=>{
        it.el.style.cursor = "zoom-in";
        it.el.addEventListener("click", (e)=>{
          e.preventDefault();
          openLightbox(items, idx);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
