(function () {
  const STORAGE_KEY = 'theme-preference';
  const root = document.documentElement;

  function getSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getStoredPreference() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function applyTheme(theme) {
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    updateToggleIcon(theme);
  }

  function storePreference(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }

  function updateToggleIcon(theme) {
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
      icon.classList.remove('fa-moon', 'fa-sun');
      icon.classList.add(theme === 'dark' ? 'fa-sun' : 'fa-moon');
    });
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', theme === 'dark');
      btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }

  function init() {
    const stored = getStoredPreference();
    const initial = stored || getSystemPreference();
    applyTheme(initial);

    // Listen for system changes if user hasn't explicitly set a preference
    if (!stored && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => applyTheme(e.matches ? 'dark' : 'light'));
    }

    // Bind toggles
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const isDark = root.classList.contains('theme-dark');
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        storePreference(next);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
