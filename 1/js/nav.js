(() => {
  const mount = document.getElementById("site-nav");
  if (!mount) return;

  const links = [
    { href: "index.html", label: "首页" },
    { href: "tea-culture.html", label: "茶文化" },
    { href: "routes.html", label: "茶旅路线" },
    { href: "new.html", label: "新品推荐" },
    { href: "tea.html", label: "名茶图鉴" },
    { href: "login.html", label: "登录" },
    { href: "guestbook.html", label: "留言" },
  ];

  const linkActive = (href) => {
    const navPath = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const navHash = (location.hash || "").toLowerCase();
    const lower = href.toLowerCase();
    const hashIdx = lower.indexOf("#");
    const filePart = hashIdx >= 0 ? lower.slice(0, hashIdx) : lower;
    const file = filePart.split("/").pop() || "index.html";
    const frag = hashIdx >= 0 ? lower.slice(hashIdx + 1) : "";
    if (navPath !== file) return false;
    if (frag) return navHash === `#${frag}`;
    return true;
  };

  mount.innerHTML = `
    <header class="site-header">
      <div class="container nav-wrap">
        <a class="brand" href="index.html" aria-label="返回首页">
          <span class="brand-mark" aria-hidden="true">滇</span>
          <span class="brand-text">
            <span class="brand-name">云南茶韵</span>
            <span class="brand-sub">Yunnan Tea</span>
          </span>
        </a>

        <button class="icon-btn nav-toggle" type="button" aria-label="打开菜单" aria-expanded="false">
          <span class="hamburger" aria-hidden="true"></span>
        </button>

        <nav class="nav" aria-label="页面切换导航">
          <ul class="nav-list">
            ${links
              .map((l) => {
                const active = linkActive(l.href) ? " aria-current=\"page\" class=\"is-active\"" : "";
                return `<li><a href="${l.href}"${active}>${l.label}</a></li>`;
              })
              .join("")}
          </ul>
        </nav>

        <div class="nav-actions">
          <button class="btn tiny" type="button" id="themeToggle" aria-label="切换深浅色">
            <span class="theme-ico" aria-hidden="true"></span>
            <span class="theme-text">切换主题</span>
          </button>
        </div>
      </div>

      <div class="nav-panel" hidden>
        <div class="container">
          <ul class="nav-panel-list">
            ${links
              .map((l) => {
                const active = linkActive(l.href) ? " aria-current=\"page\" class=\"is-active\"" : "";
                return `<li><a href="${l.href}"${active}>${l.label}</a></li>`;
              })
              .join("")}
          </ul>
        </div>
      </div>
    </header>
  `;

  const syncNavActive = () => {
    mount.querySelectorAll(".nav-list a, .nav-panel-list a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const on = linkActive(href);
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page");
      else {
        a.removeAttribute("aria-current");
        a.classList.remove("is-active");
      }
    });
  };

  window.addEventListener("hashchange", syncNavActive);

  const btnToggle = mount.querySelector(".nav-toggle");
  const panel = mount.querySelector(".nav-panel");

  const setPanelOpen = (open) => {
    if (!btnToggle || !panel) return;
    btnToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
    document.documentElement.classList.toggle("nav-open", open);
  };

  btnToggle?.addEventListener("click", () => {
    const open = btnToggle.getAttribute("aria-expanded") !== "true";
    setPanelOpen(open);
  });

  panel?.addEventListener("click", (e) => {
    const t = e.target;
    if (t instanceof HTMLAnchorElement) setPanelOpen(false);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setPanelOpen(false);
  });

  const themeBtn = document.getElementById("themeToggle");
  const applyTheme = (theme) => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    localStorage.setItem("yntea_theme", theme);
    themeBtn?.setAttribute("data-theme", theme);
  };

  const initial = localStorage.getItem("yntea_theme") === "dark" ? "dark" : "light";
  applyTheme(initial);

  themeBtn?.addEventListener("click", () => {
    const current = localStorage.getItem("yntea_theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
})();
