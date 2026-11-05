(() => {
  const comparison = document.querySelector('.results-comparison');
  if (!comparison) return;
  const range = comparison.querySelector('.results-range');
  // Resample at display resolution to avoid soft transformed rasters on mobile.
  const fallback = comparison.querySelector('.results-after');
  const source = fallback.querySelector('image');
  const registration = source.transform.baseVal.consolidate().matrix;
  const photo = new Image();
  photo.src = source.getAttribute('href');
  photo.decode().then(() => {
    const canvas = document.createElement('canvas');
    canvas.className = 'results-after';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', fallback.getAttribute('aria-label'));
    const context = canvas.getContext('2d');
    if (!context) return;
    function draw() {
      const pixels = Math.max(1, Math.round(comparison.clientWidth * Math.max(2, window.devicePixelRatio)));
      canvas.width = canvas.height = pixels;
      const scale = pixels / 1254;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.setTransform(scale * registration.a, scale * registration.b, scale * registration.c, scale * registration.d, scale * registration.e, scale * registration.f);
      context.drawImage(photo, 0, 0);
    }
    fallback.replaceWith(canvas);
    draw();
    new ResizeObserver(draw).observe(comparison);
  }).catch(() => { /* Keep the SVG fallback if image decoding is unavailable. */ });
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
