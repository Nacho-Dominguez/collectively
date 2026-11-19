// Shared motion for the Collectively landings.
// - [data-reveal] elements fade/rise in once they enter the viewport (stagger with style="--d:120ms").
// - [data-count] numbers count up once visible; the final value stays in the accessible name.
// Content is only hidden when this script runs and the visitor has not asked for reduced motion,
// so the static layout is always complete and readable.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  root.classList.add('motion');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add('is-in');
      if (e.target.hasAttribute('data-count')) count(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  document.querySelectorAll('[data-reveal],[data-count]').forEach(function (el) { io.observe(el); });

  function count(el) {
    var out = el.querySelector('[data-count-out]');
    if (!out) return;
    var to = parseFloat(el.getAttribute('data-count'));
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    var dur = 1600, t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      out.textContent = pre + Math.round(to * eased) + suf;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
