// Size-aware press feedback; links keep their native navigation behavior.
let activePress;
const releaseTimers = new WeakMap();
function releasePress() {
  if (!activePress) return;
  const { element, started } = activePress;
  releaseTimers.set(element, setTimeout(() => element.removeAttribute('data-pressed'), Math.max(0, 90 - (performance.now() - started))));
  activePress = undefined;
}
function startPress(element, x, y) {
  releasePress();
  clearTimeout(releaseTimers.get(element));
  const bounds = element.getBoundingClientRect();
  element.style.setProperty('--press-scale', Math.max(.9, Math.min(.985, 1 - 8 / (bounds.width + bounds.height))));
  element.style.setProperty('--press-x', `${x == null ? 50 : (x - bounds.left) / bounds.width * 100}%`);
  element.style.setProperty('--press-y', `${y == null ? 50 : (y - bounds.top) / bounds.height * 100}%`);
  element.setAttribute('data-pressed', '');
  activePress = { element, started: performance.now() };
}
document.addEventListener('pointerdown', event => {
  const element = event.target.closest('.press');
  if (element && event.button === 0) startPress(element, event.clientX, event.clientY);
});
document.addEventListener('keydown', event => {
  if (!event.repeat && event.key === 'Enter' && event.target.matches('a.press')) startPress(event.target);
});
for (const type of ['pointerup', 'pointercancel', 'keyup', 'focusout']) document.addEventListener(type, releasePress);
window.addEventListener('blur', releasePress);
