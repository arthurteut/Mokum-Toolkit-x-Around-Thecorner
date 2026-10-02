/*!
 * ATC Motion — animații cinematice pentru aroundthecorner.ro
 * Se activează prin clase CSS puse pe elemente (în Elementor: Advanced → CSS Classes).
 * Depinde de GSAP, ScrollTrigger, SplitText (incluse) și, opțional, Lenis.
 */
(function () {
  'use strict';

  var cfg = Object.assign(
    { smooth: true, cursor: false, progress: true, preloader: false, markers: false },
    window.ATC_MOTION_CONFIG || {}
  );

  var html = document.documentElement;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;

  function reveal() {
    html.classList.remove('atc-js');
    clearTimeout(window.__atcFailsafe);
  }

  // Dacă biblioteca lipsește sau suntem în editorul Elementor, afișăm totul static.
  var inEditor =
    document.body.classList.contains('elementor-editor-active') ||
    /[?&]elementor-preview=/.test(location.search) ||
    (window.elementorFrontend && elementorFrontend.isEditMode && elementorFrontend.isEditMode());
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!gsap || !ScrollTrigger || inEditor || reduced) {
    reveal();
    var pre = document.querySelector('.atc-preloader');
    if (pre) pre.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);
  clearTimeout(window.__atcFailsafe);

  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var EASE = 'expo.out';
  var mm = gsap.matchMedia();

  /* ---------- utilitare ---------- */

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function num(el, attr, fallback) {
    var v = parseFloat(el.getAttribute('data-atc-' + attr));
    return isNaN(v) ? fallback : v;
  }

  function has(el, cls) {
    return el.classList.contains(cls);
  }

  // Copiii „vizuali” ai unui container Elementor (sare peste .e-con-inner / widget-container).
  function kids(el) {
    var inner = el.querySelector(':scope > .e-con-inner') || el.querySelector(':scope > .elementor-widget-container');
    var list = Array.prototype.slice.call((inner || el).children);
    return list.filter(function (k) {
      return k.tagName !== 'STYLE' && k.tagName !== 'SCRIPT';
    });
  }

  // Elementele de text care trebuie „sparte” în linii / cuvinte / litere.
  function textTargets(el) {
    if (/^(H[1-6]|P|SPAN|A|LI|BLOCKQUOTE)$/.test(el.tagName)) return [el];
    var t = $$('.elementor-heading-title, h1, h2, h3, h4, h5, h6, p', el).filter(function (n) {
      return !n.parentElement.closest('h1,h2,h3,h4,h5,h6,p') || n.parentElement === el;
    });
    return t.length ? t : [el];
  }

  function mediaIn(el) {
    return el.tagName === 'IMG' || el.tagName === 'VIDEO' ? el : el.querySelector('img, video');
  }

  function delayOf(el) {
    var m = el.className.match && String(el.className).match(/atc-delay-(\d)/);
    return m ? parseInt(m[1], 10) * 0.1 : num(el, 'delay', 0);
  }

  /* ---------- scroll fin (Lenis) ---------- */

  var lenis = null;
  if (cfg.smooth && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, anchors: { offset: -80 }, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) {
      lenis.raf(t * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    html.classList.add('atc-smooth');
  }

  /* ---------- efecte ---------- */

  var effects = {
    // Apariție: fade + glisare. Modificatori: --left, --right, --scale.
    reveal: function (root) {
      var els = $$('.atc-reveal', root);
      if (!els.length) return;
      els.forEach(function (el) {
        var from = { autoAlpha: 0, y: 60 };
        if (has(el, 'atc-reveal--left')) from = { autoAlpha: 0, x: -80 };
        if (has(el, 'atc-reveal--right')) from = { autoAlpha: 0, x: 80 };
        if (has(el, 'atc-reveal--scale')) from = { autoAlpha: 0, scale: 0.88 };
        gsap.set(el, from);
      });
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            autoAlpha: 1, x: 0, y: 0, scale: 1,
            duration: 1.2, ease: EASE, stagger: 0.12,
            delay: delayOf(batch[0]),
            overwrite: true
          });
        }
      });
    },

    // Copiii containerului apar pe rând.
    stagger: function (root) {
      $$('.atc-stagger', root).forEach(function (el) {
        var items = kids(el);
        gsap.set(el, { autoAlpha: 1 });
        gsap.fromTo(items, { autoAlpha: 0, y: 50 }, {
          autoAlpha: 1, y: 0, duration: 1.1, ease: EASE,
          stagger: num(el, 'stagger', 0.1),
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        });
      });
    },

    // Text dezvăluit pe linii (implicit), cuvinte (--words) sau litere (--chars).
    split: function (root) {
      if (!SplitText) return;
      $$('.atc-split', root).forEach(function (el) {
        var mode = has(el, 'atc-split--chars') ? 'chars' : has(el, 'atc-split--words') ? 'words' : 'lines';
        var instant = has(el, 'atc-split--instant');
        textTargets(el).forEach(function (target) {
          SplitText.create(target, {
            type: mode === 'lines' ? 'lines' : mode === 'words' ? 'lines,words' : 'lines,words,chars',
            mask: mode === 'lines' ? 'lines' : 'words',
            autoSplit: true,
            linesClass: 'atc-line',
            wordsClass: 'atc-word',
            onSplit: function (self) {
              gsap.set(el, { autoAlpha: 1 });
              var parts = self[mode];
              var vars = {
                yPercent: 115, rotate: mode === 'chars' ? 6 : 0,
                duration: mode === 'chars' ? 1 : 1.3, ease: EASE,
                stagger: mode === 'chars' ? 0.025 : mode === 'words' ? 0.05 : 0.1,
                delay: delayOf(el)
              };
              if (!instant) vars.scrollTrigger = { trigger: el, start: 'top 88%', once: true };
              return gsap.from(parts, vars);
            }
          });
        });
      });
    },

    // Cuvintele se „aprind” pe măsură ce derulezi (manifest).
    scrubtext: function (root) {
      if (!SplitText) return;
      $$('.atc-scrub-text', root).forEach(function (el) {
        textTargets(el).forEach(function (target) {
          SplitText.create(target, {
            type: 'words',
            autoSplit: true,
            onSplit: function (self) {
              gsap.set(el, { autoAlpha: 1 });
              return gsap.fromTo(self.words, { opacity: 0.14 }, {
                opacity: 1, ease: 'none', stagger: 0.1,
                scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
              });
            }
          });
        });
      });
    },

    // Imagine dezvăluită printr-o cortină, cu zoom-out ușor.
    mask: function (root) {
      $$('.atc-mask', root).forEach(function (el) {
        var dir = has(el, 'atc-mask--left') ? 'inset(0 100% 0 0)' : 'inset(100% 0 0 0)';
        var media = mediaIn(el);
        var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true }, delay: delayOf(el) });
        tl.fromTo(el, { clipPath: dir, autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
        if (media) tl.from(media, { scale: 1.35, duration: 1.8, ease: EASE }, 0);
      });
    },

    // Parallax: data-atc-speed (implicit 0.2; negativ = invers). --slow / --fast.
    parallax: function (root) {
      $$('.atc-parallax', root).forEach(function (el) {
        var speed = num(el, 'speed', has(el, 'atc-parallax--fast') ? 0.4 : has(el, 'atc-parallax--slow') ? 0.1 : 0.2);
        var media = mediaIn(el);
        var target = media && el !== media && !has(el, 'atc-parallax--self') ? media : el;
        if (target !== el) gsap.set(target, { scale: 1 + Math.abs(speed) * 0.9 });
        gsap.fromTo(target, { yPercent: -speed * 40 }, {
          yPercent: speed * 40, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    },

    // Zoom cinematic pe imagine cât timp secțiunea traversează ecranul.
    zoom: function (root) {
      $$('.atc-zoom', root).forEach(function (el) {
        var media = mediaIn(el) || el;
        gsap.fromTo(media, { scale: num(el, 'from', 1.3) }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    },

    // Ieșire cinematică: secțiunea se micșorează și se estompează când pleci de pe ea.
    heroout: function (root) {
      $$('.atc-hero-out', root).forEach(function (el) {
        gsap.to(el, {
          scale: 0.92, autoAlpha: 0.25, yPercent: -8, borderRadius: 28, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true }
        });
      });
    },

    // Scenă fixată: elementele .atc-pin-step apar pe rând cât timp secțiunea stă pe loc.
    pin: function (root) {
      mm.add('(min-width: 768px)', function () {
        $$('.atc-pin', root).forEach(function (el) {
          var steps = $$('.atc-pin-step', el);
          var len = num(el, 'length', Math.max(1, steps.length) * 60);
          var tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: 'top top', end: '+=' + len + '%', pin: true, scrub: 1, markers: cfg.markers }
          });
          steps.forEach(function (s, i) {
            tl.fromTo(s, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }, i);
            if (i > 0 && has(el, 'atc-pin--replace')) tl.to(steps[i - 1], { autoAlpha: 0, y: -60, duration: 1 }, i);
          });
          if (!steps.length) tl.to({}, { duration: 1 });
        });
      });
    },

    // Imagine care crește din card până pe tot ecranul cât secțiunea e fixată.
    // Textele .atc-expand__text din secțiune apar la final.
    expand: function (root) {
      mm.add('(min-width: 768px)', function () {
        $$('.atc-expand', root).forEach(function (el) {
          var frame = el.querySelector('.atc-expand__media') || el;
          var media = mediaIn(frame);
          var texts = $$('.atc-expand__text', el);
          var inset = num(el, 'inset', 18);
          var tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: 'top top', end: '+=' + num(el, 'length', 140) + '%', pin: true, scrub: 1, markers: cfg.markers }
          });
          tl.fromTo(frame, { clipPath: 'inset(' + inset + '% ' + inset * 1.6 + '% round 24px)' }, { clipPath: 'inset(0% 0% round 0px)', ease: 'power2.inOut', duration: 1 });
          if (media && media !== frame) tl.fromTo(media, { scale: 1.35 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0);
          if (texts.length) tl.fromTo(texts, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.5, ease: 'power3.out' }, 0.65);
        });
      });
    },

    // Galerie orizontală: secțiunea stă fixă, iar banda (.atc-hscroll__track) alunecă lateral.
    hscroll: function (root) {
      mm.add('(min-width: 768px)', function () {
        $$('.atc-hscroll', root).forEach(function (el) {
          var track = el.querySelector('.atc-hscroll__track') || el.querySelector(':scope > .e-con-inner') || el.firstElementChild;
          if (!track) return;
          el.classList.add('atc-hscroll--on');
          var dist = function () { return Math.max(0, track.scrollWidth - el.clientWidth); };
          var tween = gsap.to(track, {
            x: function () { return -dist(); }, ease: 'none',
            scrollTrigger: {
              trigger: el, start: 'top top', end: function () { return '+=' + dist(); },
              pin: true, scrub: 1, invalidateOnRefresh: true, markers: cfg.markers
            }
          });
          // Elementele din bandă primesc un mic parallax intern.
          $$('img', track).forEach(function (img) {
            gsap.fromTo(img, { xPercent: -6, scale: 1.12 }, {
              xPercent: 6, ease: 'none',
              scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
            });
          });
          return function () { el.classList.remove('atc-hscroll--on'); };
        });
      });
    },

    // Carduri care se suprapun la scroll (metodologia pe pași).
    stack: function (root) {
      mm.add('(min-width: 768px)', function () {
        $$('.atc-stack', root).forEach(function (el) {
          var cards = $$('.atc-stack__card', el);
          if (!cards.length) cards = kids(el);
          var top = num(el, 'top', 90);
          var gap = num(el, 'gap', 18);
          var last = cards[cards.length - 1];
          cards.forEach(function (card, i) {
            card.style.position = 'relative';
            card.style.zIndex = i + 1;
            if (card === last) return;
            ScrollTrigger.create({
              trigger: card, start: 'top ' + (top + i * gap) + 'px',
              endTrigger: last, end: 'top ' + (top + (cards.length - 1) * gap) + 'px',
              pin: true, pinSpacing: false, markers: cfg.markers
            });
            gsap.to(card, {
              scale: 0.94 + i * 0.006, filter: 'brightness(0.86)', ease: 'none',
              scrollTrigger: { trigger: cards[i + 1], start: 'top 75%', end: 'top ' + (top + (i + 1) * gap) + 'px', scrub: true }
            });
          });
        });
      });
    },

    // Cifre care se numără: „200+”, „25%”, „±1 g”, „4 L/min”.
    counter: function (root) {
      $$('.atc-counter', root).forEach(function (el) {
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) if (/\d/.test(node.nodeValue)) break;
        if (!node) return;
        var m = node.nodeValue.match(/(\d+(?:[.,]\d+)?)/);
        var raw = m[1];
        var comma = raw.indexOf(',') > -1;
        var end = parseFloat(raw.replace(',', '.'));
        var dec = (raw.split(/[.,]/)[1] || '').length;
        var before = node.nodeValue.slice(0, m.index);
        var after = node.nodeValue.slice(m.index + raw.length);
        var o = { v: 0 };
        var paint = function () {
          var s = o.v.toFixed(dec);
          node.nodeValue = before + (comma ? s.replace('.', ',') : s) + after;
        };
        paint();
        gsap.to(o, {
          v: end, duration: num(el, 'duration', 2), ease: 'power2.out', onUpdate: paint,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true }
        });
      });
    },

    // Bandă infinită (logo-uri parteneri) care accelerează și își schimbă sensul cu scroll-ul.
    marquee: function (root) {
      $$('.atc-marquee', root).forEach(function (el) {
        if (el.__atcMarquee) return;
        el.__atcMarquee = true;
        var host = el.querySelector(':scope > .e-con-inner') || el;
        var items = kids(el);
        var track = document.createElement('div');
        track.className = 'atc-marquee__track';
        var set = document.createElement('div');
        set.className = 'atc-marquee__set';
        items.forEach(function (i) { set.appendChild(i); });
        track.appendChild(set);
        host.appendChild(track);
        var base = items.map(function (i) { return i.cloneNode(true); });
        var guard = 0;
        while (set.scrollWidth < host.clientWidth && guard++ < 10) {
          base.forEach(function (b) { set.appendChild(b.cloneNode(true)); });
        }
        var copy = set.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
        var dir = has(el, 'atc-marquee--reverse') ? 1 : -1;
        var tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, {
          xPercent: dir < 0 ? -50 : 0, ease: 'none', repeat: -1, duration: num(el, 'duration', 30)
        });
        ScrollTrigger.create({
          trigger: el, start: 'top bottom', end: 'bottom top',
          onUpdate: function (self) {
            var boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 400);
            gsap.to(tween, { timeScale: boost * (self.direction === 1 ? 1 : -1), duration: 0.2, overwrite: true });
            gsap.to(tween, { timeScale: self.direction === 1 ? 1 : -1, duration: 1.2, delay: 0.2 });
          }
        });
      });
    },

    // Desenează traseele SVG la scroll (graficul de extracție, linii decorative).
    draw: function (root) {
      $$('.atc-draw', root).forEach(function (el) {
        var paths = $$('path, line, polyline, circle', el);
        paths.forEach(function (p) {
          var len = p.getTotalLength ? p.getTotalLength() : 0;
          if (!len) return;
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
            strokeDashoffset: 0, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: 1 }
          });
        });
      });
    },

    // Fundalul paginii își schimbă culoarea când intri într-o secțiune cu data-atc-bg.
    bg: function (root) {
      $$('[data-atc-bg]', root).forEach(function (el) {
        var vars = { '--atc-page-bg': el.getAttribute('data-atc-bg'), duration: 0.8, ease: 'power2.out', overwrite: 'auto' };
        if (el.getAttribute('data-atc-fg')) vars['--atc-page-fg'] = el.getAttribute('data-atc-fg');
        var go = function () { gsap.to(html, vars); };
        ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onEnter: go, onEnterBack: go });
      });
    },

    // Butoane „magnetice”.
    magnetic: function (root) {
      if (!finePointer) return;
      $$('.atc-magnetic', root).forEach(function (el) {
        var target = el.querySelector('a, button') || el;
        var xTo = gsap.quickTo(target, 'x', { duration: 0.5, ease: 'power3' });
        var yTo = gsap.quickTo(target, 'y', { duration: 0.5, ease: 'power3' });
        var strength = num(el, 'strength', 0.35);
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * strength);
          yTo((e.clientY - r.top - r.height / 2) * strength);
        });
        el.addEventListener('pointerleave', function () {
          gsap.to(target, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
        });
      });
    },

    // Înclinare 3D la hover (carduri de produs).
    tilt: function (root) {
      if (!finePointer) return;
      $$('.atc-tilt', root).forEach(function (el) {
        gsap.set(el, { transformPerspective: 900 });
        var rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
        var ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
        var max = num(el, 'tilt', 7);
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * max * 2);
          rx(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
        });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
    },

    // Abur care se ridică dintr-o ceașcă (canvas, se oprește când nu e pe ecran).
    steam: function (root) {
      $$('.atc-steam', root).forEach(function (el) {
        if (el.__atcSteam) return;
        el.__atcSteam = true;
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        var c = document.createElement('canvas');
        c.className = 'atc-steam__canvas';
        c.setAttribute('aria-hidden', 'true');
        el.appendChild(c);
        var ctx = c.getContext('2d');
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        var w, h, running = false, t = 0;
        var originX = num(el, 'steam-x', 0.5), originY = num(el, 'steam-y', 0.75);
        var wisps = [];
        for (var i = 0; i < 7; i++) wisps.push({ seed: Math.random() * 100, off: (i - 3) * 0.035, w: 10 + Math.random() * 22 });
        function size() {
          w = el.clientWidth; h = el.clientHeight;
          c.width = w * dpr; c.height = h * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        function frame() {
          if (!running) return;
          t += 0.006;
          ctx.clearRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'lighter';
          wisps.forEach(function (s) {
            var x0 = w * (originX + s.off), y0 = h * originY, rise = h * 0.6;
            ctx.beginPath();
            for (var k = 0; k <= 40; k++) {
              var p = k / 40;
              var y = y0 - p * rise;
              var x = x0 + Math.sin(p * 5 + t * 3 + s.seed) * (8 + p * 38) + Math.sin(t * 1.7 + s.seed * 2) * p * 20;
              k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            var g = ctx.createLinearGradient(0, y0, 0, y0 - rise);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.25, 'rgba(255,255,255,0.10)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = s.w;
            ctx.lineCap = 'round';
            ctx.filter = 'blur(10px)';
            ctx.stroke();
          });
          requestAnimationFrame(frame);
        }
        size();
        window.addEventListener('resize', size);
        new IntersectionObserver(function (en) {
          var vis = en[0].isIntersecting;
          if (vis && !running) { running = true; frame(); } else if (!vis) running = false;
        }).observe(el);
      });
    }
  };

  /* ---------- elemente globale ---------- */

  function progressBar() {
    if (!cfg.progress || document.querySelector('.atc-progress')) return;
    var bar = document.createElement('div');
    bar.className = 'atc-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  }

  function cursor() {
    if (!cfg.cursor || !finePointer) return;
    var dot = document.createElement('div');
    dot.className = 'atc-cursor';
    dot.innerHTML = '<span class="atc-cursor__label"></span>';
    document.body.appendChild(dot);
    html.classList.add('atc-cursor-on');
    var label = dot.firstChild;
    var xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
    var yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', function (e) {
      xTo(e.clientX); yTo(e.clientY);
      dot.classList.add('is-visible');
    });
    document.addEventListener('pointerleave', function () { dot.classList.remove('is-visible'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-atc-cursor], a, button, .atc-tilt');
      dot.classList.toggle('is-link', !!t);
      var txt = t && t.getAttribute('data-atc-cursor');
      label.textContent = txt || '';
      dot.classList.toggle('has-label', !!txt);
    });
  }

  function preloader(done) {
    var el = document.querySelector('.atc-preloader');
    if (!el || html.classList.contains('atc-no-preload')) {
      if (el) el.remove();
      return done();
    }
    try { sessionStorage.setItem('atcPreloaded', '1'); } catch (e) {}
    var count = el.querySelector('.atc-preloader__count');
    var o = { v: 0 };
    var tl = gsap.timeline({ onComplete: function () { el.remove(); } });
    tl.to(o, {
      v: 100, duration: 1.4, ease: 'power2.inOut',
      onUpdate: function () { if (count) count.textContent = Math.round(o.v); }
    })
      .to(el.querySelectorAll('.atc-preloader__brand > *'), { yPercent: -120, stagger: 0.06, duration: 0.6, ease: 'power3.in' }, '-=0.2')
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' })
      .add(done, '-=0.6');
  }

  /* ---------- pornire ---------- */

  var order = ['split', 'scrubtext', 'reveal', 'stagger', 'mask', 'parallax', 'zoom', 'heroout', 'pin', 'expand', 'hscroll', 'stack', 'counter', 'marquee', 'draw', 'bg', 'magnetic', 'tilt', 'steam'];

  function init(root) {
    root = root || document;
    order.forEach(function (k) {
      try { effects[k](root); } catch (e) { if (window.console) console.warn('[atc-motion] ' + k, e); }
    });
  }

  function boot() {
    html.classList.add('atc-ready');
    progressBar();
    cursor();
    // Elementele din prima ecranare (hero) pornesc după preloader.
    preloader(function () {
      init(document);
      html.classList.remove('atc-js');
      ScrollTrigger.refresh();
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  // Pop-up-urile Elementor se încarcă ulterior.
  if (window.jQuery) {
    window.jQuery(document).on('elementor/popup/show', function (e, id, inst) {
      if (inst && inst.$element) init(inst.$element[0]);
    });
  }

  window.ATCMotion = {
    init: init,
    refresh: function () { ScrollTrigger.refresh(); },
    lenis: lenis,
    stop: function () { if (lenis) lenis.stop(); },
    start: function () { if (lenis) lenis.start(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
