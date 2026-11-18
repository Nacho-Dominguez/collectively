(() => {
  const ways = document.querySelector('.ways');
  const track = ways?.querySelector('.industry-track');
  const pages = [...(ways?.querySelectorAll('.industry-page') || [])];
  const controls = ways?.querySelector('.ways-controls');
  const prev = controls?.querySelector('.ways-prev');
  const next = controls?.querySelector('.ways-next');
  const count = controls?.querySelector('.ways-page-count');

  if (ways && track && pages.length > 1 && controls && prev && next && count) {
    let current = 0;
    const showPage = (page) => {
      current = Math.max(0, Math.min(page, pages.length - 1));
      track.style.transform = `translateX(-${current * 100}%)`;
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
      prev.disabled = current === 0;
      next.disabled = current === pages.length - 1;
      pages.forEach((item, index) => {
        item.inert = index !== current;
        item.setAttribute('aria-hidden', index !== current ? 'true' : 'false');
      });
    };

    ways.classList.add('is-ready');
    controls.hidden = false;
    showPage(0);
    prev.addEventListener('click', () => showPage(current - 1));
    next.addEventListener('click', () => showPage(current + 1));
  }

  const hero = document.querySelector('.hero');
  const aurora = hero?.querySelector('.aurora');
  const canDrift = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  if (hero && aurora && canDrift.matches) {
    let frame = 0;
    hero.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        aurora.style.translate = `${(x * 32).toFixed(1)}px ${(y * 20).toFixed(1)}px`;
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      aurora.style.translate = '0 0';
    });
  }
})();
