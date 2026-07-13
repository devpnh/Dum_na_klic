/* DŮM NA KLÍČ — interakce (vanilla JS, bez závislostí) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on = function (el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o || false); };

  /* ---- Sticky header: condense on scroll ---- */
  var header = document.querySelector('.site-header');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) document.body.classList.toggle('is-scrolled', y > 20);
    lastY = y;
  }
  on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile drawer ---- */
  var drawer = document.querySelector('.drawer');
  var openBtn = document.querySelector('.nav__toggle');
  var closeEls = document.querySelectorAll('[data-drawer-close]');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (openBtn) openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  on(openBtn, 'click', function () { setDrawer(true); });
  closeEls.forEach(function (el) { on(el, 'click', function () { setDrawer(false); }); });
  on(document, 'keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  /* ---- Scroll reveal ---- */
  var revEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---- Animated counters ---- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    if (reduce) { el.textContent = target + suffix; return; }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---- Hero parallax (light, transform only) ---- */
  var parallax = document.querySelectorAll('[data-parallax]');
  if (!reduce && parallax.length) {
    var ticking = false;
    function px() {
      var y = window.scrollY;
      parallax.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.25;
        el.style.transform = 'translate3d(0,' + (y * speed) + 'px,0)';
      });
      ticking = false;
    }
    on(window, 'scroll', function () {
      if (!ticking) { requestAnimationFrame(px); ticking = true; }
    }, { passive: true });
  }

  /* ---- Hero video background (jen na http/https, ne na file://) ---- */
  var heroVid = document.querySelector('.hero__video');
  if (heroVid && /^https?:$/.test(location.protocol) && !reduce) {
    var vid = heroVid.getAttribute('data-hero-video');
    var origin = encodeURIComponent(location.origin);
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/' + vid +
      '?autoplay=1&mute=1&loop=1&playlist=' + vid +
      '&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&fs=0&origin=' + origin;
    f.title = 'Dům na klíč — video pozadí';
    f.setAttribute('allow', 'autoplay; encrypted-media');
    f.setAttribute('tabindex', '-1');
    f.setAttribute('aria-hidden', 'true');
    heroVid.appendChild(f);
    setTimeout(function () { heroVid.classList.add('is-ready'); }, 600);
  }

  /* ---- Interaktívna video galéria (YouTube IFrame API) ---- */
  var vgal = document.querySelector('.vgallery');
  if (vgal && /^https?:$/.test(location.protocol)) {
    var thumbs = Array.prototype.slice.call(vgal.querySelectorAll('.vthumb[data-vid]'));
    var vscreen = vgal.querySelector('.vgallery__screen');
    var quoteEl = vgal.querySelector('.vgallery__quote');
    var nameEl = vgal.querySelector('.vgallery__name');
    var soundBtn = vgal.querySelector('.vgallery__sound');
    var vplayer = null, cur = 0, ready = false, inview = false, started = false;

    function setMeta(i) {
      var t = thumbs[i];
      if (quoteEl) quoteEl.textContent = t.getAttribute('data-quote') || '';
      if (nameEl) nameEl.textContent = t.getAttribute('data-name') || '';
      thumbs.forEach(function (x, j) { x.classList.toggle('is-active', j === i); });
    }
    function play(i, muted) {
      cur = i; setMeta(i);
      vgal.classList.add('is-playing');
      vgal.classList.toggle('is-muted', !!muted);
      if (!vplayer || !vplayer.loadVideoById) return;
      if (muted && vplayer.mute) vplayer.mute(); else if (vplayer.unMute) vplayer.unMute();
      vplayer.loadVideoById(thumbs[i].getAttribute('data-vid'));
    }
    function tryAuto() {
      if (ready && inview && !started && !reduce) { started = true; play(0, true); }
    }
    if (!window.YT || !window.YT.Player) {
      var yts = document.createElement('script');
      yts.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(yts);
    }
    window.onYouTubeIframeAPIReady = function () {
      vplayer = new YT.Player('vgPlayer', {
        videoId: thumbs[0].getAttribute('data-vid'),
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin },
        events: {
          'onReady': function () { ready = true; tryAuto(); },
          'onStateChange': function (e) {
            if (e.data === YT.PlayerState.ENDED) play((cur + 1) % thumbs.length, vgal.classList.contains('is-muted'));
          }
        }
      });
    };
    thumbs.forEach(function (t, i) { on(t, 'click', function () { play(i, false); }); });
    on(vscreen, 'click', function (e) {
      if (soundBtn && (e.target === soundBtn || soundBtn.contains(e.target))) return;
      if (!vgal.classList.contains('is-playing')) play(cur, false);
    });
    if (soundBtn) on(soundBtn, 'click', function (e) {
      e.stopPropagation();
      if (vplayer && vplayer.unMute) vplayer.unMute();
      vgal.classList.remove('is-muted');
    });
    if (!reduce && 'IntersectionObserver' in window) {
      var vo = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { inview = true; tryAuto(); if (started) vo.disconnect(); } });
      }, { threshold: 0.45 });
      vo.observe(vgal);
    }
    setMeta(0);
  }

  /* ---- Lazy YouTube facade (click-to-play) ---- */
  document.querySelectorAll('[data-yt]').forEach(function (el) {
    on(el, 'click', function () {
      var id = el.getAttribute('data-yt');
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      frame.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      frame.title = 'Video reference';
      el.innerHTML = '';
      el.appendChild(frame);
    });
  });

  /* ---- Lightbox gallery ---- */
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lightbox__cap');
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    var idx = 0;
    function show(i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      lbImg.src = it.getAttribute('data-lightbox');
      if (lbCap) lbCap.textContent = it.getAttribute('data-caption') || '';
    }
    function openLb(i) { show(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
    function closeLb() { lb.classList.remove('is-open'); document.body.style.overflow = ''; lbImg.src = ''; }
    items.forEach(function (it, i) {
      on(it, 'click', function (e) { e.preventDefault(); openLb(i); });
    });
    on(lb.querySelector('.lightbox__close'), 'click', closeLb);
    on(lb.querySelector('.lightbox__nav--prev'), 'click', function () { show(idx - 1); });
    on(lb.querySelector('.lightbox__nav--next'), 'click', function () { show(idx + 1); });
    on(lb, 'click', function (e) { if (e.target === lb) closeLb(); });
    on(document, 'keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---- Before / after slider (den / večer) ---- */
  document.querySelectorAll('.ba').forEach(function (ba) {
    var after = ba.querySelector('.ba__after-wrap');
    var handle = ba.querySelector('.ba__handle');
    var dragging = false;
    function setPos(clientX) {
      var r = ba.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      var pct = p * 100;
      if (after) after.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      if (handle) handle.style.left = pct + '%';
    }
    setPos(ba.getBoundingClientRect().left + ba.getBoundingClientRect().width * 0.5);
    on(ba, 'pointerdown', function (e) { dragging = true; ba.setPointerCapture(e.pointerId); setPos(e.clientX); });
    on(ba, 'pointermove', function (e) { if (dragging) setPos(e.clientX); });
    on(ba, 'pointerup', function () { dragging = false; });
    on(ba, 'pointercancel', function () { dragging = false; });
  });

  /* ---- Contact form (demo submit) ---- */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    on(form, 'submit', function (e) {
      e.preventDefault();
      form.classList.add('is-sent');
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Odesláno ✓'; }
    });
  });

  /* ---- Active nav link by pathname ---- */
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(function (a) {
    if (a.getAttribute('data-nav') === path) a.classList.add('is-active');
  });

  /* ---- Reviews slider (posuvný panel) ---- */
  document.querySelectorAll('[data-review-track]').forEach(function (track) {
    var slider = track.closest('.reviews-slider');
    var prev = slider && slider.querySelector('[data-review-prev]');
    var next = slider && slider.querySelector('[data-review-next]');
    function step() {
      var card = track.querySelector('.review');
      var gap = parseInt(getComputedStyle(track).gap, 10) || 24;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      var noScroll = max <= 2;
      if (prev) prev.disabled = noScroll || track.scrollLeft <= 2;
      if (next) next.disabled = noScroll || track.scrollLeft >= max;
    }
    on(prev, 'click', function () { stopAuto(); track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    on(next, 'click', function () { stopAuto(); track.scrollBy({ left: step(), behavior: 'smooth' }); });
    on(track, 'scroll', update, { passive: true });
    on(window, 'resize', update);
    update();

    /* autoplay ~4.5s, pause on hover/focus/touch */
    var timer = null;
    function atEnd() { return track.scrollLeft >= track.scrollWidth - track.clientWidth - 4; }
    function advance() { if (atEnd()) track.scrollTo({ left: 0, behavior: 'smooth' }); else track.scrollBy({ left: step(), behavior: 'smooth' }); }
    function startAuto() { if (reduce || timer) return; if (track.scrollWidth - track.clientWidth < 4) return; timer = setInterval(advance, 4500); }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach(function (ev) { on(slider, ev, stopAuto, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { on(slider, ev, startAuto); });
    startAuto();
  });

  /* ---- Auto-promo (Jednoduše a bez starostí) ---- */
  var promo = document.getElementById('promoPop');
  if (promo && !sessionStorage.getItem('dnk_promo_closed')) {
    var promoShown = false, promoTrig = false;
    function showPromo() {
      if (promoShown) return;
      promoShown = true;
      promo.classList.add('is-mounted');
      void promo.offsetWidth;
      if (reduce) promo.classList.add('is-shown');
      else requestAnimationFrame(function () { promo.classList.add('is-shown'); });
    }
    function hidePromo() {
      promo.classList.remove('is-shown');
      try { sessionStorage.setItem('dnk_promo_closed', '1'); } catch (e) {}
      setTimeout(function () { promo.classList.remove('is-mounted'); }, 520);
    }
    var pClose = promo.querySelector('.promo-pop__close');
    on(pClose, 'click', hidePromo);
    on(promo.querySelector('.promo-pop__cta'), 'click', function () {
      try { sessionStorage.setItem('dnk_promo_closed', '1'); } catch (e) {}
    });
    function maybeShow() {
      if (!promoTrig && window.scrollY > window.innerHeight * 1.1) { promoTrig = true; showPromo(); }
    }
    on(window, 'scroll', maybeShow, { passive: true });
    setTimeout(function () { if (!promoTrig) { promoTrig = true; showPromo(); } }, 7000);
  }

  /* ---- Timeline interactivity (hover progress + expandable detail) ---- */
  document.querySelectorAll('[data-timeline]').forEach(function (tl) {
    var steps = Array.prototype.slice.call(tl.querySelectorAll('.tl-step'));
    var fill = tl.querySelector('.timeline__fill');
    var n = steps.length;
    var desktop = function () { return window.matchMedia('(min-width:860px)').matches; };
    steps.forEach(function (step, i) {
      on(step, 'mouseenter', function () {
        if (reduce) return;
        tl.classList.add('is-hovering');
        steps.forEach(function (s, j) { s.classList.toggle('is-active', j <= i); });
        if (fill && desktop()) fill.style.width = (((i + 0.5) / n) * 100) + '%';
      });
      if (step.hasAttribute('data-detail')) {
        on(step, 'click', function (e) {
          if (e.target.closest('a')) return;
          e.preventDefault();
          step.classList.toggle('is-open');
        });
      }
    });
    on(tl, 'mouseleave', function () {
      if (reduce) return;
      tl.classList.remove('is-hovering');
      steps.forEach(function (s) { s.classList.remove('is-active'); });
      if (fill) fill.style.width = '';
    });
  });

  /* ---- Auto-cycling highlight ---- */
  document.querySelectorAll('[data-autocycle]').forEach(function (box) {
    var items = Array.prototype.slice.call(box.querySelectorAll('.autocycle__item'));
    if (!items.length) return;
    if (reduce) { items.forEach(function (it) { it.classList.add('is-on'); }); return; }
    var i = 0;
    function light() { items.forEach(function (it, j) { it.classList.toggle('is-on', j === i); }); }
    light();
    setInterval(function () { i = (i + 1) % items.length; light(); }, 2400);
  });
})();
