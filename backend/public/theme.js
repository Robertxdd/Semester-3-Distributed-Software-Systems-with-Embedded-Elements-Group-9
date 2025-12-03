// Theme toggle helper shared by static pages
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme") || "dark";
  if (saved === "light") {
    root.classList.add("theme-light");
  }

  const toggle = () => {
    const isLight = root.classList.toggle("theme-light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  window.initThemeToggle = function () {
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", toggle);
    });
  };
})();
