(function () {
  const navLinks = document.querySelectorAll(".nav-link");
  const sectionIds = ["about", "blog", "publications", "services"];

  function setActiveNav(id) {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  function applyHashToNav() {
    const raw = window.location.hash.replace("#", "");
    if (!raw) {
      setActiveNav("about");
      return;
    }
    if (raw === "cv") {
      setActiveNav("about");
      return;
    }
    if (sectionIds.includes(raw)) {
      setActiveNav(raw);
      return;
    }
    setActiveNav("about");
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const hash = link.getAttribute("href");
      if (!hash || !hash.startsWith("#")) return;
      const id = hash.slice(1);
      if (id === "cv") {
        setActiveNav("about");
        return;
      }
      if (sectionIds.includes(id)) {
        setActiveNav(id);
      }
    });
  });

  window.addEventListener("hashchange", applyHashToNav);

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  applyHashToNav();
})();
