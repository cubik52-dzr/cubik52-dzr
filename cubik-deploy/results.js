(() => {
  const comparison = document.querySelector('.results-comparison');
  if (!comparison) return;
  const range = comparison.querySelector('.results-range');
  let activePointer;
  function render() {
    comparison.style.setProperty('--reveal', `${range.value}%`);
    range.setAttribute('aria-valuetext', `До ${range.value}%, после ${100 - range.value}%`);
  }
  function move(event) {
    const bounds = comparison.getBoundingClientRect();
    range.value = Math.round(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)));
    render();
  }
  range.addEventListener('input', render);
  comparison.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    activePointer = event.pointerId;
    comparison.setPointerCapture(activePointer);
    comparison.setAttribute('data-dragging', '');
    range.focus({ preventScroll: true });
    move(event);
  });
  comparison.addEventListener('pointermove', event => {
    if (event.pointerId === activePointer) move(event);
  });
  function release(event) {
    if (event.pointerId !== activePointer) return;
    activePointer = undefined;
    comparison.removeAttribute('data-dragging');
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) comparison.addEventListener(type, release);
  render();
})();
