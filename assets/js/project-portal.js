(() => {
  const apiBase = (window.CONTIMECH_PROJECT_PORTAL_API || "/api").replace(/\/$/, "");

  const loginPanel = document.getElementById("loginPanel");
  const loginForm = document.getElementById("projectLoginForm");
  const passwordInput = document.getElementById("projectPassword");
  const authMessage = document.getElementById("authMessage");
  const projectPortal = document.getElementById("projectPortal");
  const projectGrid = document.getElementById("projectGrid");
  const logoutButton = document.getElementById("logoutButton");

  if (!loginForm || !projectPortal || !projectGrid) return;

  const setMessage = (message, type = "") => {
    if (!authMessage) return;
    authMessage.textContent = message || "";
    authMessage.dataset.type = type;
  };

  const api = async (path, options = {}) => {
    const response = await fetch(`${apiBase}${path}`, {
      credentials: "include",
      headers: {
        "Accept": "application/json",
        ...(options.body ? {"Content-Type": "application/json"} : {}),
        ...(options.headers || {})
      },
      ...options
    });

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const message = data?.error || `Request failed: ${response.status}`;
      throw new Error(message);
    }

    return data;
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const renderProjects = (projects) => {
    projectGrid.innerHTML = "";

    if (!projects || projects.length === 0) {
      projectGrid.innerHTML = `<article class="project-tile"><h3>No materials assigned</h3><p class="meta">This access scope does not currently include project materials.</p></article>`;
      return;
    }

    projects.forEach((project) => {
      const tags = (project.tags || [])
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");

      const card = document.createElement("article");
      card.className = "project-tile";
      card.innerHTML = `
        <div class="project-tile-head">
          <div>
            <div class="project-domain">${escapeHtml(project.domain || "Project")}</div>
            <h3>${escapeHtml(project.title)}</h3>
          </div>
        </div>
        <p>${escapeHtml(project.summary || "")}</p>
        <div class="project-tags">${tags}</div>
        <div class="project-tile-actions">
          <a class="btn primary" href="${escapeHtml(project.slide_url)}" target="_blank" rel="noopener noreferrer">Open project slide</a>
        </div>
      `;
      projectGrid.appendChild(card);
    });
  };

  const showAuthorized = async () => {
    const data = await api("/projects");
    renderProjects(data.projects || []);
    loginPanel.hidden = true;
    projectPortal.hidden = false;
    setMessage("");
  };

  const checkSession = async () => {
    try {
      const session = await api("/session");
      if (session.authenticated) {
        await showAuthorized();
      }
    } catch (_) {
      loginPanel.hidden = false;
      projectPortal.hidden = true;
    }
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("Checking access…", "neutral");

    const password = passwordInput.value;
    if (!password) {
      setMessage("Password is required.", "error");
      return;
    }

    try {
      await api("/login", {
        method: "POST",
        body: JSON.stringify({password})
      });
      passwordInput.value = "";
      await showAuthorized();
    } catch (error) {
      setMessage(error.message || "Authorization failed.", "error");
    }
  });

  logoutButton?.addEventListener("click", async () => {
    try {
      await api("/logout", {method: "POST"});
    } catch (_) {
      /* session may already be invalid */
    }
    projectGrid.innerHTML = "";
    projectPortal.hidden = true;
    loginPanel.hidden = false;
    setMessage("Signed out.", "neutral");
  });

  checkSession();
})();
