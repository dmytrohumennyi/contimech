/*
  Publications page logic
  - Loads publications from /assets/data/publications.json
  - Provides filtering by year, type, and domain, plus search
*/

(function () {
  const app = document.getElementById("publications-app");
  if (!app) return;

  const state = {
    items: [],
    filtered: [],
    query: "",
    year: "all",
    type: "all",
    domains: new Set(["scientific", "methodical", "non_scientific"]),
  };

  function esc(str) {
    return (str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(str) {
    return (str || "").toLowerCase().trim();
  }

  function applyFilters() {
    const q = normalize(state.query);

    state.filtered = state.items.filter((it) => {
      if (!state.domains.has(it.domain)) return false;

      if (state.year !== "all" && String(it.year || "") !== state.year) return false;

      if (state.type !== "all" && it.type !== state.type) return false;

      if (q) {
        const hay = [
          it.title,
          it.outlet,
          it.type_raw,
          it.coauthors,
          String(it.year || ""),
        ].join(" ");
        if (!normalize(hay).includes(q)) return false;
      }
      return true;
    });

    renderList();
    renderCount();
  }

  function renderCount() {
    const el = document.getElementById("pub-count");
    if (!el) return;
    el.textContent = `${state.filtered.length} items`;
  }

  function badge(label) {
    return `<span class="chip">${esc(label)}</span>`;
  }

  function metaLine(it, enums) {
    const bits = [];

    if (it.year) bits.push(badge(String(it.year)));
    bits.push(badge(enums.type[it.type] || it.type));
    bits.push(badge(enums.domain[it.domain] || it.domain));

    return bits.join(" ");
  }

  function renderList() {
    const list = document.getElementById("pub-list");
    if (!list) return;

    if (!state.filtered.length) {
      list.innerHTML = `<div class="card"><p class="muted">No items match the current filters.</p></div>`;
      return;
    }

    const enums = window.__pubEnums || { type: {}, domain: {} };

    list.innerHTML = state.filtered.map((it) => {
      const title = esc(it.title);
      const outlet = esc(it.outlet || "");
      const coauthors = esc(it.coauthors || "");
      const typeRaw = esc(it.type_raw || "");
      const url = (it.url || "").trim();

      const titleHtml = url
        ? `<a class="pub-title" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${title}</a>`
        : `<span class="pub-title">${title}</span>`;

      return `
        <article class="card pub-card">
          <div class="pub-header">
            ${titleHtml}
            <div class="pub-meta">${metaLine(it, enums)}</div>
          </div>
          <div class="pub-body">
            ${outlet ? `<div class="pub-outlet"><strong>Source:</strong> ${outlet}</div>` : ""}
            ${typeRaw ? `<div class="pub-type"><strong>Work type:</strong> ${typeRaw}</div>` : ""}
            ${coauthors ? `<div class="pub-coauthors"><strong>Co-authors:</strong> ${coauthors}</div>` : ""}
          </div>
        </article>
      `;
    }).join("");
  }

  function uniqueYears(items) {
    const years = new Set();
    items.forEach((it) => {
      if (it.year) years.add(it.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  function initControls(enums) {
    // Year select
    const yearSel = document.getElementById("pub-year");
    const years = uniqueYears(state.items);

    yearSel.innerHTML = `<option value="all">All years</option>` +
      years.map((y) => `<option value="${y}">${y}</option>`).join("");

    yearSel.addEventListener("change", () => {
      state.year = yearSel.value;
      applyFilters();
    });

    // Type select
    const typeSel = document.getElementById("pub-type");
    const typeOptions = [
      { value: "all", label: "All types" },
      { value: "article", label: enums.type.article || "Article" },
      { value: "theses", label: enums.type.theses || "Theses" },
      { value: "monograph", label: enums.type.monograph || "Monograph" },
      { value: "methodical", label: enums.type.methodical || "Methodical" },
      { value: "other", label: enums.type.other || "Other" },
    ];
    typeSel.innerHTML = typeOptions.map(o => `<option value="${o.value}">${esc(o.label)}</option>`).join("");
    typeSel.addEventListener("change", () => {
      state.type = typeSel.value;
      applyFilters();
    });

    // Search
    const q = document.getElementById("pub-q");
    q.addEventListener("input", () => {
      state.query = q.value;
      applyFilters();
    });

    // Domain checkboxes
    const domainWrap = document.getElementById("pub-domains");
    domainWrap.innerHTML = ["scientific", "methodical", "non_scientific"].map((d) => {
      const label = enums.domain[d] || d;
      const checked = state.domains.has(d) ? "checked" : "";
      return `
        <label class="check">
          <input type="checkbox" value="${d}" ${checked} />
          <span>${esc(label)}</span>
        </label>
      `;
    }).join("");

    domainWrap.querySelectorAll("input[type='checkbox']").forEach((cb) => {
      cb.addEventListener("change", () => {
        const val = cb.value;
        if (cb.checked) state.domains.add(val);
        else state.domains.delete(val);
        applyFilters();
      });
    });
  }

  async function boot() {
    async function loadViaFetch() {
      const res = await fetch("assets/data/publications.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load publications.json (${res.status})`);
      return await res.json();
    }

    function loadViaInline() {
      // Works when the page is opened as a local file (file://), where fetch() is often blocked by the browser.
      if (window.PUBLICATIONS_DATA && typeof window.PUBLICATIONS_DATA === "object") return window.PUBLICATIONS_DATA;
      const el = document.getElementById("publications-data");
      if (!el) throw new Error("Inline publications data not found");
      const txt = (el.textContent || "").trim();
      if (!txt) throw new Error("Inline publications data is empty");
      return JSON.parse(txt);
    }

    try {
      let json;
      try {
        json = await loadViaFetch();
      } catch (e) {
        // Fallback for local/offline opening.
        json = loadViaInline();
      }

      state.items = (json.items || []);
      window.__pubEnums = (json.enums || { type: {}, domain: {} });

      initControls(window.__pubEnums);
      applyFilters();
    } catch (err) {
      console.error(err);
      app.innerHTML = `
        <div class="card">
          <p><strong>Не вдалося завантажити публікації.</strong></p>
          <p class="muted">
            Якщо ти відкриваєш сторінку як <code>file://</code>, браузер може блокувати <code>fetch()</code>.
            Виправлення: або відкрий сайт через локальний сервер (наприклад, <code>python3 -m http.server</code>),
            або переконайся, що в <code>publications.html</code> є вбудовані дані (<code>#publications-data</code>).
          </p>
        </div>
      `;
    }
  }

  boot();
})();
