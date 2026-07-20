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

  /* ---- Lead funnel (3krokový poptávkový modal) ---- */
  (function leadFunnel() {
    var TPL =
      '<div class="lead-modal" id="leadModal" role="dialog" aria-modal="true" aria-labelledby="lfTitle" hidden>' +
        '<div class="lead-modal__scrim" data-lf-close></div>' +
        '<div class="lead-modal__dialog" role="document">' +
          '<button class="lead-modal__close" type="button" data-lf-close aria-label="Zavřít poptávku">&times;</button>' +
          '<div class="lf-head">' +
            '<div class="lf-progress"><span class="lf-progress__fill"></span></div>' +
            '<div class="lf-meta"><span class="lf-eyebrow">Nezávazná poptávka</span>' +
              '<span class="lf-count">Krok <b data-lf-cur>1</b> ze 3</span></div>' +
          '</div>' +
          '<form class="lf-form" novalidate>' +

            /* KROK 1 */
            '<div class="lf-step is-active" data-lf-step="1">' +
              '<h3 class="lf-title" id="lfTitle">Co pro vás máme postavit?</h3>' +
              '<p class="lf-sub">Vyberte, co nejlépe vystihuje váš záměr. Upřesníme spolu.</p>' +
              '<div class="lf-opts">' +
                opt('Typový dům na klíč', 'Vyberu z katalogu, vy postavíte za pevnou cenu.', '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h5v-6h2v6h5v-9"/>') +
                opt('Mám vlastní projekt', 'Postavte dům podle mé projektové dokumentace.', '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>') +
                opt('Zatím se jen rozhoduji', 'Poradíme vám a spočítáme orientační cenu.', '<path d="M5 5h14v10H9l-4 4z"/><path d="M12 8v3M12 13h.01"/>') +
              '</div>' +
            '</div>' +

            /* KROK 2 */
            '<div class="lf-step" data-lf-step="2">' +
              '<h3 class="lf-title">Pár detailů k vašemu domu</h3>' +
              '<p class="lf-sub">Nemusíte nic řešit přesně — orientační odpovědi stačí.</p>' +
              grp('Velikost dispozice', 'dispozice', ['3+kk', '4+kk', '5+kk', '6+kk a více', 'Nevím']) +
              grp('Pozemek', 'pozemek', ['Mám pozemek', 'Hledám pozemek', 'Zatím ne']) +
              grp('Kdy chcete stavět', 'termin', ['Do 6 měsíců', 'Do roka', 'Za 1–2 roky', 'Jen zjišťuji']) +
            '</div>' +

            /* KROK 3 */
            '<div class="lf-step" data-lf-step="3">' +
              '<h3 class="lf-title">Kam se vám ozveme?</h3>' +
              '<p class="lf-sub">Ozveme se do jednoho pracovního dne. Nezávazně a zdarma.</p>' +
              '<div class="field"><label for="lfName">Jméno a příjmení <span class="req">*</span></label>' +
                '<input id="lfName" name="lf_name" type="text" placeholder="Jan Novák" autocomplete="name" required></div>' +
              '<div class="field"><label for="lfTel">Telefon <span class="req">*</span></label>' +
                '<input id="lfTel" name="lf_tel" type="tel" placeholder="+420 …" autocomplete="tel" required></div>' +
              '<div class="field"><label for="lfEmail">E-mail</label>' +
                '<input id="lfEmail" name="lf_email" type="email" placeholder="vas@email.cz" autocomplete="email"></div>' +
              '<label class="form__consent"><input type="checkbox" name="lf_consent" required> ' +
                'Souhlasím se zpracováním osobních údajů za účelem vyřízení poptávky.</label>' +
            '</div>' +

            /* ÚSPĚCH */
            '<div class="lf-step lf-done" data-lf-step="done">' +
              '<span class="lf-done__ic"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span>' +
              '<h3 class="lf-title">Děkujeme, máme to!</h3>' +
              '<p class="lf-sub">Vaši poptávku jsme přijali. Ozveme se vám do jednoho pracovního dne a domluvíme další postup.</p>' +
              '<button type="button" class="btn btn--primary btn--block" data-lf-close>Zavřít</button>' +
            '</div>' +

            '<div class="lf-nav">' +
              '<button type="button" class="btn btn--ghost lf-back" data-lf-back>Zpět</button>' +
              '<button type="button" class="btn btn--primary lf-next" data-lf-next>Pokračovat</button>' +
              '<button type="submit" class="btn btn--primary lf-submit">Odeslat poptávku</button>' +
            '</div>' +
            '<p class="lf-foot"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg> Vaše údaje jsou v bezpečí.</p>' +
          '</form>' +
        '</div>' +
      '</div>';

    function opt(title, desc, icon) {
      return '<button type="button" class="lf-opt" data-lf-choice="zamer" data-value="' + title + '" aria-pressed="false">' +
        '<span class="lf-opt__ic"><svg viewBox="0 0 24 24">' + icon + '</svg></span>' +
        '<span class="lf-opt__txt"><span class="lf-opt__t">' + title + '</span><span class="lf-opt__d">' + desc + '</span></span>' +
        '<span class="lf-opt__arw"><svg viewBox="0 0 24 24"><path d="M4 11h12.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H4z"/></svg></span>' +
        '</button>';
    }
    function grp(label, key, values) {
      var chips = values.map(function (v) {
        return '<button type="button" class="lf-chip" data-value="' + v + '" aria-pressed="false">' + v + '</button>';
      }).join('');
      return '<div class="lf-group"><span class="lf-label">' + label + '</span>' +
        '<div class="lf-chips" data-lf-chips="' + key + '">' + chips + '</div></div>';
    }

    var host = document.createElement('div');
    host.innerHTML = TPL;
    var modal = host.firstElementChild;
    document.body.appendChild(modal);

    var STEPS = ['1', '2', '3'];
    var cur = 0, done = false, lastFocus = null;
    var form = modal.querySelector('.lf-form');
    var fill = modal.querySelector('.lf-progress__fill');
    var curEl = modal.querySelector('[data-lf-cur]');
    var meta = modal.querySelector('.lf-meta');
    var nav = modal.querySelector('.lf-nav');
    var foot = modal.querySelector('.lf-foot');
    var backBtn = modal.querySelector('[data-lf-back]');
    var nextBtn = modal.querySelector('[data-lf-next]');
    var submitBtn = modal.querySelector('.lf-submit');

    function chosenZamer() { return modal.querySelector('[data-lf-choice="zamer"].is-sel'); }

    function render() {
      var key = done ? 'done' : STEPS[cur];
      modal.querySelectorAll('.lf-step').forEach(function (s) {
        s.classList.toggle('is-active', s.getAttribute('data-lf-step') === key);
      });
      if (done) {
        fill.style.width = '100%';
        nav.style.display = 'none'; foot.style.display = 'none'; meta.style.visibility = 'hidden';
        return;
      }
      nav.style.display = ''; foot.style.display = ''; meta.style.visibility = '';
      fill.style.width = ((cur + 1) / STEPS.length * 100) + '%';
      if (curEl) curEl.textContent = cur + 1;
      backBtn.style.display = cur > 0 ? '' : 'none';
      var last = cur === STEPS.length - 1;
      nextBtn.style.display = last ? 'none' : '';
      submitBtn.style.display = last ? '' : 'none';
      nextBtn.disabled = (cur === 0 && !chosenZamer());
    }

    function openModal() {
      lastFocus = document.activeElement;
      if (typeof setDrawer === 'function') setDrawer(false);
      var promoEl = document.getElementById('promoPop');
      if (promoEl) promoEl.classList.remove('is-shown');
      done = false; render();
      modal.hidden = false;
      void modal.offsetWidth;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () {
        var f = modal.querySelector('.lf-step.is-active .lf-opt, .lf-step.is-active input, .lf-step.is-active button');
        if (f) f.focus();
      }, 80);
    }
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { modal.hidden = true; }, 340);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    /* výběr záměru (krok 1) — zvýrazní a automaticky posune dál */
    modal.querySelectorAll('[data-lf-choice="zamer"]').forEach(function (b) {
      on(b, 'click', function () {
        modal.querySelectorAll('[data-lf-choice="zamer"]').forEach(function (x) {
          x.classList.remove('is-sel'); x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('is-sel'); b.setAttribute('aria-pressed', 'true');
        nextBtn.disabled = false;
        setTimeout(function () { if (cur === 0 && !done) { cur = 1; render(); } }, 260);
      });
    });

    /* chipy (krok 2) — jednoduchý výběr, lze zrušit */
    modal.querySelectorAll('.lf-chips').forEach(function (group) {
      group.querySelectorAll('.lf-chip').forEach(function (chip) {
        on(chip, 'click', function () {
          var was = chip.classList.contains('is-sel');
          group.querySelectorAll('.lf-chip').forEach(function (c) {
            c.classList.remove('is-sel'); c.setAttribute('aria-pressed', 'false');
          });
          if (!was) { chip.classList.add('is-sel'); chip.setAttribute('aria-pressed', 'true'); }
        });
      });
    });

    on(nextBtn, 'click', function () { if (cur < STEPS.length - 1) { cur++; render(); } });
    on(backBtn, 'click', function () { if (cur > 0) { cur--; render(); } });

    on(form, 'submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="lf_name"]');
      var tel = form.querySelector('[name="lf_tel"]');
      var consent = form.querySelector('[name="lf_consent"]');
      var ok = true;
      [name, tel].forEach(function (inp) {
        var bad = !inp.value.trim();
        inp.closest('.field').classList.toggle('is-error', bad);
        if (bad) ok = false;
      });
      var consentWrap = consent.closest('.form__consent');
      consentWrap.classList.toggle('is-error', !consent.checked);
      if (!consent.checked) ok = false;
      if (!ok) {
        var firstBad = form.querySelector('.field.is-error input');
        if (firstBad) firstBad.focus();
        return;
      }
      done = true; render();
    });

    /* zavření */
    modal.querySelectorAll('[data-lf-close]').forEach(function (el) { on(el, 'click', closeModal); });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    /* napojení všech CTA „Nezávazná poptávka" napříč webem */
    var ctas = document.querySelectorAll('a, button');
    Array.prototype.forEach.call(ctas, function (el) {
      if (modal.contains(el)) return;
      if ((el.textContent || '').trim().toLowerCase() !== 'nezávazná poptávka') return;
      on(el, 'click', function (e) { e.preventDefault(); openModal(); });
    });
  })();
})();
