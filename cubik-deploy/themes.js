const themes = ['signal', 'acid', 'steel'];
const buttons = document.querySelectorAll('[data-theme-choice]');
function setTheme(theme) {
  if (!themes.includes(theme)) return;
  document.documentElement.dataset.theme = theme;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  document.querySelector('#theme-number').textContent = String(themes.indexOf(theme) + 1).padStart(2, '0');
  try { localStorage.setItem('cubik-theme', theme); } catch {}
}
buttons.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
try { setTheme(localStorage.getItem('cubik-theme')); } catch {}
