/* Ottawa Bookkeeping Studio: menu that stays at the top, sections that ease in on scroll,
   checklists that tick in, and the enquiry form (page forms, side tab and pop-out panel).
   Styles live in /assets/extras.css. No libraries. */
(function () {
  'use strict';

  var FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeIq0ZWjbaXtKHWOZGxe7skjPDXJz-o8Oju_1M3L8vVA12zwg/formResponse';
  var F = { name: 'entry.1389207575', email: 'entry.378230464', phone: 'entry.556737337', need: 'entry.2053659030', heard: 'entry.563811724' };
  var HEARD = ['Google search', 'Google Maps', 'Referral from a client', 'Referral from an accountant', 'LinkedIn', 'Other'];
  var PREVIEW = window.OBS_PREVIEW === true;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function kids(node) {
    return [].filter.call(node.children, function (k) {
      return !/^(SCRIPT|STYLE|BR|TEMPLATE)$/.test(k.tagName) && !k.hasAttribute('data-obs-static');
    });
  }

  /* ---------- menu that stays at the top ---------- */
  function sticky() {
    var hdr = document.querySelector('header');
    if (!hdr) return;
    hdr.classList.add('obs-sticky');
    var tb = document.querySelector('.obs-topbar');
    function setTop() { if (tb) document.documentElement.style.setProperty('--obs-tb', tb.offsetHeight + 'px'); }
    setTop();
    window.addEventListener('resize', setTop);
    var on = false;
    window.addEventListener('scroll', function () {
      var now = window.scrollY > 40;
      if (now !== on) { on = now; hdr.classList.toggle('obs-scrolled', now); }
    }, { passive: true });
  }

  /* ---------- scroll effects ---------- */
  function isRow(node) {
    var d = getComputedStyle(node).display;
    return d.indexOf('flex') > -1 || d.indexOf('grid') > -1;
  }

  function isTickList(node) {
    var ks = kids(node);
    return ks.length >= 3 && ks.every(function (k) { return k.querySelector('svg circle'); });
  }

  function hasRow(node) {
    return kids(node).some(function (c) { return isRow(c) && kids(c).length >= 3 && !isTickList(c); });
  }

  function collect(node, depth, out) {
    kids(node).forEach(function (k) {
      if (isRow(k) && kids(k).length >= 3 && depth < 2 && !isTickList(k)) {
        kids(k).forEach(function (c) { out.push(c); });
      } else if (depth < 1 && k.tagName === 'DIV' && getComputedStyle(k).display === 'block' && hasRow(k)) {
        collect(k, depth + 1, out);
      } else {
        out.push(k);
      }
    });
  }

  function stagger(e) {
    var sib = kids(e.parentNode).filter(function (s) { return s.tagName === e.tagName; });
    return sib.length >= 3 ? Math.min(sib.indexOf(e), 5) : 0;
  }

  function reveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('obs-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    var ticker = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        kids(en.target).forEach(function (r) { r.classList.add('obs-in'); });
        ticker.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    [].forEach.call(document.querySelectorAll('section'), function (sec, idx) {
      if (sec.closest('.obs-panel') || sec.closest('[data-obs-static]')) return;

      /* checklists: rows slide in one by one and their ticks draw */
      [].forEach.call(sec.querySelectorAll('div,ul,ol'), function (d) {
        if (d.closest('[data-obs-static]') || !isTickList(d)) return;
        kids(d).forEach(function (r, i) {
          r.classList.add('obs-tick');
          r.style.transitionDelay = (350 + i * 240) + 'ms';
          var p = r.querySelector('svg path');
          if (p) p.style.transitionDelay = (650 + i * 240) + 'ms';
        });
        ticker.observe(d);
      });

      var items = [];
      var sk = kids(sec);
      if (idx === 0) {
        /* first screen: the text column rises in line by line */
        var col = (isRow(sec) && sk.length > 1) ? sk[0] : sec;
        kids(col).forEach(function (k, i) {
          k.classList.add('obs-rv');
          k.style.transitionDelay = (Math.min(i, 6) * 110) + 'ms';
          items.push(k);
        });
      } else {
        var two = isRow(sec) && sk.length === 2;
        if (isRow(sec) && sk.length >= 3) items = sk.slice();
        else collect(sec, 0, items);
        items.forEach(function (e) {
          e.classList.add('obs-rv');
          if (two && e.parentNode === sec) e.classList.add(e === sk[0] ? 'obs-l' : 'obs-r');
          var i = stagger(e);
          if (i > 0) e.style.transitionDelay = (i * 90) + 'ms';
        });
      }
      items.forEach(function (e) { io.observe(e); });
    });
  }

  /* ---------- enquiry form ---------- */
  var count = 0;

  function buildForm() {
    var id = 'obsp' + (++count);
    var opts = '<option value="">Choose one</option>' + HEARD.map(function (h) { return '<option>' + h + '</option>'; }).join('');
    var f = el('form', 'obs-form');
    f.action = FORM_URL;
    f.method = 'post';
    f.noValidate = true;
    f.innerHTML =
      '<div class="obs-two">' +
        '<label for="' + id + 'n"><span>Name</span><input id="' + id + 'n" name="' + F.name + '" autocomplete="name" required></label>' +
        '<label for="' + id + 'e"><span>Email</span><input id="' + id + 'e" name="' + F.email + '" type="email" autocomplete="email" required></label>' +
      '</div>' +
      '<div class="obs-two">' +
        '<label for="' + id + 'p"><span>Phone <em>(optional)</em></span><input id="' + id + 'p" name="' + F.phone + '" type="tel" autocomplete="tel"></label>' +
        '<label for="' + id + 'h"><span>How did you find me?</span><select id="' + id + 'h" name="' + F.heard + '">' + opts + '</select></label>' +
      '</div>' +
      '<label for="' + id + 'd"><span>What do you need help with?</span><textarea id="' + id + 'd" name="' + F.need + '" rows="3" required placeholder="For example: monthly bookkeeping and HST for my business, about 100 transactions a month"></textarea></label>' +
      '<input class="obs-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="obs-err" role="alert" hidden></p>' +
      '<button type="submit">Send message</button>' +
      '<p class="obs-note">Goes straight to my inbox. Please don\'t send bank statements here.</p>';
    f.addEventListener('submit', submit);
    return f;
  }

  function field(f, key) { return f.elements[F[key]] || f.elements[key]; }
  function val(f, key) { var e = field(f, key); return ((e && e.value) || '').trim(); }

  function submit(e) {
    e.preventDefault();
    var f = e.currentTarget;
    var err = f.querySelector('.obs-err');
    var btn = f.querySelector('button[type=submit]');
    var missing = [];
    var first = null;
    [['name', 'your name'], ['email', 'a valid email'], ['need', 'what you need help with']].forEach(function (p) {
      var v = val(f, p[0]);
      var ok = !!v && (p[0] !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      field(f, p[0]).setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) { missing.push(p[1]); if (!first) first = field(f, p[0]); }
    });
    if (missing.length) {
      err.textContent = 'Please add ' + (missing.length > 1 ? missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1] : missing[0]) + '.';
      err.hidden = false;
      first.focus();
      return;
    }
    err.hidden = true;
    if (val(f, 'website')) { finish(f, false); return; }
    if (PREVIEW) { finish(f, true); return; }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    var body = new URLSearchParams();
    ['name', 'email', 'phone', 'need', 'heard'].forEach(function (k) { body.append(F[k], val(f, k)); });
    fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: body })
      .then(function () { finish(f, false); })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Send message';
        err.innerHTML = 'That didn\'t go through. Please email <a href="mailto:ottawa.bkk@gmail.com">ottawa.bkk@gmail.com</a> or call 819-213-0203.';
        err.hidden = false;
      });
  }

  function finish(f, preview) {
    var name = val(f, 'name').split(/\s+/)[0];
    var d = el('div', 'obs-done',
      '<h3>Thanks' + (name ? ', ' + esc(name) : '') + '.</h3>' +
      '<p>' + (preview
        ? 'Preview only. On the live site this message goes to ottawa.bkk@gmail.com.'
        : 'Your message is in my inbox. I\'ll reply within 1 business day.') + '</p>');
    d.setAttribute('role', 'status');
    d.tabIndex = -1;
    f.parentNode.replaceChild(d, f);
    d.focus();
  }

  /* ---------- side tab and pop-out panel ---------- */
  function panel() {
    var scrim = el('div', 'obs-scrim');
    var box = el('div', 'obs-panel');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'obs-pt');
    box.inert = true;
    box.innerHTML =
      '<button type="button" class="obs-x" aria-label="Close">&times;</button>' +
      '<p class="obs-k">Quick enquiry</p>' +
      '<h2 id="obs-pt">Tell me what you need</h2>' +
      '<p class="obs-lead">I reply within 1 business day. You\'ll get a fixed quote before any work starts.</p>';
    box.appendChild(buildForm());
    box.appendChild(el('p', 'obs-alt', 'Prefer to talk? Call <a href="tel:+18192130203">819-213-0203</a>, Monday to Friday.'));
    var tab = el('button', 'obs-tab', 'Quick enquiry');
    tab.type = 'button';
    tab.setAttribute('aria-haspopup', 'dialog');
    document.body.appendChild(scrim);
    document.body.appendChild(box);
    document.body.appendChild(tab);

    var last = null;
    function open(e) {
      if (e) e.preventDefault();
      last = document.activeElement;
      document.documentElement.classList.add('obs-open');
      box.inert = false;
      setTimeout(function () { var i = box.querySelector('input,textarea,button.obs-x'); if (i) i.focus(); }, 60);
    }
    function close() {
      document.documentElement.classList.remove('obs-open');
      box.inert = true;
      if (last && last.focus) last.focus();
    }
    tab.addEventListener('click', open);
    scrim.addEventListener('click', close);
    box.querySelector('.obs-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (!document.documentElement.classList.contains('obs-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = box.querySelectorAll('button,input:not(.obs-hp),textarea,select,a[href],.obs-done');
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    [].forEach.call(document.querySelectorAll('[data-obs-open]'), function (a) { a.addEventListener('click', open); });
  }


  /* ---------- back to top ---------- */
  function backToTop() {
    var b = el('button', 'obs-top', '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>');
    b.type = 'button';
    b.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(b);
    var on = false;
    window.addEventListener('scroll', function () {
      var now = window.scrollY > 700;
      if (now !== on) { on = now; b.classList.toggle('obs-show', now); }
    }, { passive: true });
    b.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  function start() {
    try {
      sticky();
      [].forEach.call(document.querySelectorAll('form.obs-form'), function (f) { f.addEventListener('submit', submit); });
      panel();
      backToTop();
      reveal();
    } catch (e) { /* the page still works without these extras */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
