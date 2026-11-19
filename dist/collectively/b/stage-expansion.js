(() => {
  const stage = document.querySelector('.stage');
  if (!stage) return;

  const measure = () => {
    const width = stage.getBoundingClientRect().width;
    if (width) stage.style.setProperty('--stage-expand-x', document.documentElement.clientWidth / width);
  };

  measure();
  window.addEventListener('resize', measure, { passive: true });
})();
