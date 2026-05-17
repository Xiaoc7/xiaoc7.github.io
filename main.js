(function () {
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sectionIds = navLinks
    .map((link) => link.getAttribute("href"))
    .filter((href) => href && href.startsWith("#"))
    .map((href) => href.slice(1));

  function setActiveNav(id) {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  function chooseActiveSection() {
    const offset = window.innerHeight * 0.32;
    let activeId = sectionIds[0];

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      if (section.getBoundingClientRect().top <= offset) {
        activeId = id;
      }
    });

    setActiveNav(activeId);
  }

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = window.localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      window.localStorage.setItem("theme", nextTheme);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        setActiveNav(href.slice(1));
      }
    });
  });

  window.addEventListener("scroll", chooseActiveSection, { passive: true });
  window.addEventListener("hashchange", chooseActiveSection);
  chooseActiveSection();
})();
