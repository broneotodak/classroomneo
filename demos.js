// ============================================================
// Interactive lesson demos.
// Embed in a lesson's markdown:  <div class="cc-demo" data-demo="NAME"></div>
// This script mounts the matching interactive widget wherever it appears,
// including content the SPA injects after load (via a MutationObserver).
// Widgets are self-contained (no deps) and respect prefers-reduced-motion.
// ============================================================
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  var DEMOS = {};

  // ---------- 1. LLM = next-word prediction ----------
  DEMOS['autocomplete'] = function (root) {
    root.innerHTML =
      '<div class="cc-demo-head"><span class="cc-demo-tag">Try it</span>' +
      '<span class="cc-demo-cap">How an LLM answers — one word at a time</span></div>' +
      '<div class="cc-ac-q">"What\'s the capital of Malaysia?"</div>' +
      '<div class="cc-ac-line"><span class="cc-ac-built"></span><span class="cc-ac-caret"></span></div>' +
      '<div class="cc-ac-cands"></div>' +
      '<button class="cc-demo-btn">▶ Play</button>';
    var built = root.querySelector('.cc-ac-built');
    var caret = root.querySelector('.cc-ac-caret');
    var cands = root.querySelector('.cc-ac-cands');
    var btn = root.querySelector('.cc-demo-btn');
    var steps = [
      { pick: 'Kuala', opts: [['Kuala', 88], ['Kota', 7], ['Johor', 5]] },
      { pick: 'Lumpur', opts: [['Lumpur', 95], ['Terengganu', 3], ['Kinabalu', 2]] },
    ];
    async function play() {
      btn.disabled = true; built.textContent = ''; cands.innerHTML = ''; caret.style.display = 'inline-block';
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        cands.innerHTML = s.opts.map(function (o, idx) {
          return '<div class="cc-ac-cand' + (idx === 0 ? ' win' : '') + '">' +
            '<span class="cc-ac-word">' + o[0] + '</span>' +
            '<span class="cc-ac-bar"><span style="width:' + (reduce ? o[1] : 0) + '%"></span></span>' +
            '<span class="cc-ac-pct">' + o[1] + '%</span></div>';
        }).join('');
        if (!reduce) {
          await sleep(60);
          var bars = cands.querySelectorAll('.cc-ac-bar span');
          s.opts.forEach(function (o, idx) { bars[idx].style.width = o[1] + '%'; });
          await sleep(950);
        }
        built.textContent += (i ? ' ' : '') + s.pick;
        await sleep(reduce ? 0 : 350);
      }
      caret.style.display = 'none';
      btn.disabled = false;
    }
    btn.addEventListener('click', play);
    play();
  };

  // ---------- 2. Semantic (meaning) search ----------
  DEMOS['semantic-search'] = function (root) {
    var notes = [
      { t: 'Pay staff salaries this month', tag: 'finance', kws: ['pay', 'staff', 'salaries', 'month'] },
      { t: 'Service the car next week', tag: 'vehicle', kws: ['service', 'car', 'week'] },
      { t: 'Buy fertiliser for the garden', tag: 'garden', kws: ['buy', 'fertiliser', 'garden'] },
    ];
    var queries = [
      { q: 'when do I pay my workers?', meaning: 0 },
      { q: 'my plants need feeding', meaning: 2 },
      { q: 'the vehicle needs a checkup', meaning: 1 },
    ];
    root.innerHTML =
      '<div class="cc-demo-head"><span class="cc-demo-tag">Try it</span>' +
      '<span class="cc-demo-cap">Search by words vs. search by meaning</span></div>' +
      '<div class="cc-ss-qrow"></div>' +
      '<div class="cc-ss-grid">' +
      '<div class="cc-ss-col"><div class="cc-ss-h">Keyword search<br><small>matches words</small></div><div class="cc-ss-notes" data-k></div></div>' +
      '<div class="cc-ss-col"><div class="cc-ss-h">Meaning search<br><small>matches ideas</small></div><div class="cc-ss-notes" data-m></div></div>' +
      '</div>';
    var qrow = root.querySelector('.cc-ss-qrow');
    var kWrap = root.querySelector('[data-k]');
    var mWrap = root.querySelector('[data-m]');
    function paint(activeQ) {
      function cards(mode) {
        return notes.map(function (n, i) {
          var hit = false;
          if (activeQ != null) {
            if (mode === 'k') {
              var qtokens = queries[activeQ].q.toLowerCase().replace(/[^a-z ]/g, '').split(' ');
              hit = n.kws.some(function (k) { return qtokens.indexOf(k) !== -1; });
            } else { hit = queries[activeQ].meaning === i; }
          }
          return '<div class="cc-ss-note' + (hit ? ' hit' : (activeQ != null ? ' dim' : '')) + '">' +
            '<span class="cc-ss-tagd">' + n.tag + '</span>' + n.t + '</div>';
        }).join('');
      }
      kWrap.innerHTML = cards('k'); mWrap.innerHTML = cards('m');
    }
    qrow.innerHTML = queries.map(function (q, i) {
      return '<button class="cc-ss-q" data-i="' + i + '">“' + q.q + '”</button>';
    }).join('');
    qrow.querySelectorAll('.cc-ss-q').forEach(function (b) {
      b.addEventListener('click', function () {
        qrow.querySelectorAll('.cc-ss-q').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); paint(+b.dataset.i);
      });
    });
    paint(null);
  };

  // ---------- 3. Reason + Act (agent uses tools) ----------
  DEMOS['reason-act'] = function (root) {
    var tools = ['🔎 Search the web', '🎨 Design a logo', '🧱 Build the website', '🎬 Make a video ad'];
    root.innerHTML =
      '<div class="cc-demo-head"><span class="cc-demo-tag">Try it</span>' +
      '<span class="cc-demo-cap">Not a chatbot — it plans, then uses tools</span></div>' +
      '<div class="cc-ra-req"><b>you ›</b> help me launch my kebab stall online</div>' +
      '<div class="cc-ra-think"></div>' +
      '<div class="cc-ra-tools">' + tools.map(function (t) {
        return '<div class="cc-ra-tool"><span class="cc-ra-name">' + t + '</span><span class="cc-ra-state">waiting</span></div>';
      }).join('') + '</div>' +
      '<button class="cc-demo-btn">▶ Play</button>';
    var think = root.querySelector('.cc-ra-think');
    var items = root.querySelectorAll('.cc-ra-tool');
    var btn = root.querySelector('.cc-demo-btn');
    async function play() {
      btn.disabled = true;
      items.forEach(function (it) { it.className = 'cc-ra-tool'; it.querySelector('.cc-ra-state').textContent = 'waiting'; });
      think.textContent = '✳ claude — thinking through a plan…';
      think.classList.add('on');
      await sleep(reduce ? 0 : 900);
      for (var i = 0; i < items.length; i++) {
        var st = items[i].querySelector('.cc-ra-state');
        items[i].classList.add('running'); st.textContent = 'working…';
        await sleep(reduce ? 0 : 650);
        items[i].classList.remove('running'); items[i].classList.add('done'); st.textContent = '✓ done';
        await sleep(reduce ? 0 : 180);
      }
      think.textContent = '✳ claude — all done. Your stall is online 🎉';
      btn.disabled = false;
    }
    btn.addEventListener('click', play);
    play();
  };

  // ---------- 4. Context window filling up ----------
  DEMOS['context-window'] = function (root) {
    root.innerHTML =
      '<div class="cc-demo-head"><span class="cc-demo-tag">Try it</span>' +
      '<span class="cc-demo-cap">Every reply re-reads the whole chat</span></div>' +
      '<div class="cc-cw-meter"><span class="cc-cw-fill"></span><span class="cc-cw-label">0% full</span></div>' +
      '<div class="cc-cw-stats"><span data-turns>0 messages</span><span data-warn></span></div>' +
      '<div class="cc-cw-btns"><button class="cc-demo-btn cc-cw-add">＋ Send a message</button>' +
      '<button class="cc-demo-btn cc-ghost cc-cw-reset">Reset</button></div>';
    var fill = root.querySelector('.cc-cw-fill');
    var label = root.querySelector('.cc-cw-label');
    var turns = root.querySelector('[data-turns]');
    var warn = root.querySelector('[data-warn]');
    var n = 0;
    function render() {
      var pct = Math.min(100, n * 12);
      fill.style.width = pct + '%';
      fill.className = 'cc-cw-fill' + (pct >= 100 ? ' full' : pct >= 75 ? ' hot' : '');
      label.textContent = pct + '% full';
      turns.textContent = n + (n === 1 ? ' message' : ' messages');
      warn.textContent = pct >= 100 ? '⚠ full — Claude must save & start fresh' : (pct >= 75 ? 'getting heavy…' : '');
    }
    root.querySelector('.cc-cw-add').addEventListener('click', function () { n++; render(); });
    root.querySelector('.cc-cw-reset').addEventListener('click', function () { n = 0; render(); });
    render();
  };

  // ---------- mount machinery ----------
  function mountIn(scope) {
    (scope || document).querySelectorAll('.cc-demo[data-demo]:not([data-mounted])').forEach(function (node) {
      var fn = DEMOS[node.getAttribute('data-demo')];
      node.setAttribute('data-mounted', '1');
      if (fn) { try { fn(node); } catch (e) { node.innerHTML = '<div class="cc-demo-cap">(demo unavailable)</div>'; } }
      else { node.innerHTML = '<div class="cc-demo-cap">(unknown demo: ' + node.getAttribute('data-demo') + ')</div>'; }
    });
  }

  function start() {
    mountIn(document);
    var target = document.getElementById('stepContent') || document.body;
    if ('MutationObserver' in window) {
      new MutationObserver(function () { mountIn(target); }).observe(target, { childList: true, subtree: true });
    }
  }
  window.CCDemos = { mount: mountIn };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
