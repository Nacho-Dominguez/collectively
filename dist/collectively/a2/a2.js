// Aurora II interactions.
// 1) "What we do": three steps swap one illustration stage. Autoplays only while the section is on screen and
//    not hovered, and stops for good once the visitor picks a step.
// 2) Stage pieces follow the pointer at different depths (decorative, fine pointers only).
// 3) "Ways to collect": native scroll-snap carousel, buttons call scrollBy.
// Everything degrades to a complete static layout when JS is off or motion is reduced.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- What we do ---- */
  var steps = document.getElementById('steps');
  var stage = document.getElementById('stage');
  if (steps && stage) {
    var buttons = [].slice.call(steps.querySelectorAll('.step'));
    var scenes = [].slice.call(stage.querySelectorAll('.scene'));
    var current = 0;

    function show(i) {
      current = i;
      buttons.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      scenes.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    }

    // Autoplay: advance every 6s while the stage is on screen and untouched. A click on a step stops it for good.
    var manualPick = false, inView = false, hovering = false, timer = 0;
    function stop() { clearInterval(timer); timer = 0; }
    function start() {
      if (manualPick || !inView || hovering || timer || reduce.matches) return;
      timer = setInterval(function () { show((current + 1) % buttons.length); }, 6000);
    }

    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () { manualPick = true; stop(); show(i); });
    });
    [steps, stage].forEach(function (el) {
      el.addEventListener('pointerenter', function () { hovering = true; stop(); });
      el.addEventListener('pointerleave', function () { hovering = false; start(); });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting;
        if (inView) start(); else stop();
      }, { threshold: 0.45 }).observe(stage);
    }

    /* ---- Pointer depth ---- */
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (fine.matches && !reduce.matches) {
      var layers = [].slice.call(stage.querySelectorAll('.ly'));
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      var tick = function () {
        cx += (tx - cx) * 0.09;
        cy += (ty - cy) * 0.09;
        layers.forEach(function (l) {
          var d = parseFloat(l.getAttribute('data-depth')) || 1;
          l.style.translate = (cx * d * 14).toFixed(2) + 'px ' + (cy * d * 11).toFixed(2) + 'px';
        });
        raf = (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(tick) : 0;
      };
      var kick = function () { if (!raf) raf = requestAnimationFrame(tick); };
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      }, { passive: true });
      stage.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
    }
  }

  /* ---- Ways to collect ---- */
  var track = document.querySelector('.ways-track');
  var nav = document.querySelector('.ways-nav');
  if (track && nav) {
    var prev = nav.querySelector('.ways-prev');
    var next = nav.querySelector('.ways-next');
    nav.hidden = false;
    var pageStep = function () {
      var c = track.querySelector('.cat');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return c ? c.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };
    var sync = function () {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    var go = function (dir) {
      track.scrollBy({ left: dir * pageStep(), behavior: reduce.matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    var queued = 0;
    track.addEventListener('scroll', function () {
      if (queued) return;
      queued = requestAnimationFrame(function () { queued = 0; sync(); });
    }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---- Footer stickers: drop in (CSS), drag; they stay where you leave them ---- */
  var pile = document.getElementById('pile');
  if (pile) {
    if ('IntersectionObserver' in window) {
      var pio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { pile.classList.add('in'); pio.disconnect(); }
      }, { threshold: 0.3 });
      pio.observe(pile);
    } else { pile.classList.add('in'); }

    [].slice.call(pile.querySelectorAll('.pk')).forEach(function (el) {
      var tx = 0, ty = 0, sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
      el.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
        el.classList.add('drag'); el.setPointerCapture(e.pointerId);
        el.style.animation = 'none'; el.style.opacity = '1';
      });
      el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var pr = pile.getBoundingClientRect(), r = el.getBoundingClientRect();
        var nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
        var dx = nx - tx, dy = ny - ty;
        // keep the sticker inside the pile area
        if (r.left + dx < pr.left) nx += pr.left - (r.left + dx);
        if (r.right + dx > pr.right) nx -= (r.right + dx) - pr.right;
        if (r.top + dy < pr.top) ny += pr.top - (r.top + dy);
        if (r.bottom + dy > pr.bottom) ny -= (r.bottom + dy) - pr.bottom;
        tx = nx; ty = ny;
        el.style.translate = tx + 'px ' + ty + 'px';
      });
      function release() { dragging = false; el.classList.remove('drag'); }
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
    });
  }
})();
