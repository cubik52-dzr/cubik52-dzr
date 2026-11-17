(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const elements = document.querySelectorAll('[data-reveal]');
  const animations = new WeakMap();
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--ease').trim();
  function reveal(element, animate = true) {
    observer.unobserve(element);
    if (!animate) animations.get(element)?.finish();
    if (!element.classList.contains('reveal-pending')) return;
    element.classList.remove('reveal-pending');
    if (animate && !motion.matches && !element.contains(document.activeElement)) {
      animations.set(element, element.animate([
        { opacity: 0, translate: '0 14px' },
        { opacity: 1, translate: '0 0' }
      ], { duration: 450, delay: Number(element.dataset.reveal), easing, fill: 'backwards' }));
    }
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

  for (const element of elements) {
    element.classList.add('reveal-pending');
    observer.observe(element);
  }
  document.addEventListener('focusin', event => {
    const element = event.target.closest('[data-reveal]');
    if (element) reveal(element, false);
  });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      for (const element of elements) reveal(element, false);
      observer.disconnect();
    }
  });
})();
