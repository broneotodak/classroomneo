// ============================================================
// Hero animations — progressive enhancement.
// If JS is off or the user prefers reduced motion, the static hero
// (already in the HTML) shows as-is. Otherwise: the terminal types
// itself out on a loop, and cards fade up as they scroll into view.
// ============================================================
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // respect the user's setting — leave everything static

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ---------- Terminal live-typing ----------
  function animateTerminal() {
    var term = document.getElementById('heroTerminal');
    if (!term) return;
    var lines = Array.prototype.slice.call(term.querySelectorAll('.term-line'));
    var req = term.querySelector('.term-req');
    if (!lines.length || !req) return;

    var request = req.textContent;      // the text we'll type out
    term.classList.add('animating');    // CSS hides response lines until shown

    async function typeInto(el, text, speed) {
      el.textContent = '';
      el.parentElement.classList.add('typing');
      for (var i = 0; i < text.length; i++) {
        el.textContent += text.charAt(i);
        await sleep(speed + (Math.random() * 40)); // slight human jitter
      }
      el.parentElement.classList.remove('typing');
    }

    async function run() {
      // reset
      lines.forEach(function (l) { l.classList.remove('show'); });
      lines[0].classList.add('show');
      await sleep(600);
      await typeInto(req, request, 42);
      await sleep(550);
      for (var i = 1; i < lines.length; i++) {
        lines[i].classList.add('show');
        await sleep(i === lines.length - 1 ? 0 : 480);
      }
      await sleep(4200);   // rest so people can read it
      run();               // loop
    }
    run();
  }

  // ---------- Scroll-reveal for cards ----------
  function revealOnScroll() {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.tech-card, .feature-card')
    );
    if (!cards.length) return;
    if (!('IntersectionObserver' in window)) return; // old browser: leave visible

    cards.forEach(function (c, i) {
      c.classList.add('reveal');
      c.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    cards.forEach(function (c) { io.observe(c); });
  }

  function start() { animateTerminal(); revealOnScroll(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
