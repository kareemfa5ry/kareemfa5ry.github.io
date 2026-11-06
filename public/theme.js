/* Shared theme logic for the site and the iframe demos. Plain ES5, no modules: loaded blocking in <head> so the
   stored choice is applied before first paint. Sets html[data-theme], which public/theme.css maps to color-scheme. */
var THEME_STORAGE_KEY = "theme";

function storedTheme() {
  try {
    var stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null; // Storage blocked: follow the system setting.
  }
}

function readTheme() {
  return storedTheme() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

window.toggleTheme = function () {
  var current = document.documentElement.getAttribute("data-theme") || readTheme();
  var next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // The choice lasts for this page view only.
  }
  return next;
};

// No stored choice: the attribute stays off so the page follows the system setting live.
if (storedTheme()) applyTheme(storedTheme());
// Fires in the other same-origin documents (the page's iframes) when the toggle writes the key.
addEventListener("storage", function (event) {
  if (event.key === THEME_STORAGE_KEY && (event.newValue === "light" || event.newValue === "dark")) {
    applyTheme(event.newValue);
  }
});
