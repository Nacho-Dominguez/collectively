(() => {
  const ways = document.querySelector('.ways');
  const track = ways?.querySelector('.industry-track');
  const pages = [...(ways?.querySelectorAll('.industry-page') || [])];
  const controls = ways?.querySelector('.ways-controls');
  const prev = controls?.querySelector('.ways-prev');
  const next = controls?.querySelector('.ways-next');

  if (ways && track && pages.length > 1 && controls && prev && next) {
    let current = 0;
    let moving = false;
    let slot = 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const setPosition = (position) => {
      track.style.transform = `translateX(-${position * 100}%)`;
    };
    const setAccessiblePage = () => {
      pages.forEach((item, index) => {
        item.inert = index !== current;
        item.setAttribute('aria-hidden', index !== current ? 'true' : 'false');
      });
    };
    const makeClone = (page) => {
      const clone = page.cloneNode(true);
      clone.inert = true;
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    };

    track.prepend(makeClone(pages.at(-1)));
    track.append(makeClone(pages[0]));
    setPosition(slot);
    setAccessiblePage();

    ways.classList.add('is-ready');
    controls.hidden = false;
    const move = (direction) => {
      if (moving) return;
      current = (current + direction + pages.length) % pages.length;
      setAccessiblePage();
      if (reducedMotion.matches) {
        slot = current + 1;
        setPosition(slot);
        return;
      }
      moving = true;
      slot += direction;
      setPosition(slot);
    };
    track.addEventListener('transitionend', (event) => {
      if (event.target !== track || event.propertyName !== 'transform') return;
      if (slot === 0 || slot === pages.length + 1) {
        slot = current + 1;
        track.style.transition = 'none';
        setPosition(slot);
        track.getBoundingClientRect();
        track.style.transition = '';
      }
      moving = false;
    });
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
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
