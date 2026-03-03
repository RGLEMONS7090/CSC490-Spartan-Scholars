const THEME_KEY = "spartan-scholars-theme";
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const darkModeEnabled = theme === "dark";
    button.innerHTML = darkModeEnabled ? "&#9728;" : "&#9789;";
    button.setAttribute("aria-label", darkModeEnabled ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("title", darkModeEnabled ? "Light mode" : "Dark mode");
  });
}

const savedTheme = localStorage.getItem(THEME_KEY);
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || preferredTheme);

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  });
});
