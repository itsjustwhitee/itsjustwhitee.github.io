/* ═══════════════════════════════════════════════════════════════════════════
   components.js — justwhitee · Matteo Fontolan
   Injects shared <nav> and <footer> into every page.

   Load order in <head>:
     1. <script src="./components.js">   ← this file (registers DOMContentLoaded)
     2. <script src="./i18n.js">         ← applies translations after nav exists

   Each page uses:
     <nav id="site-nav" class="site-nav" data-active="bento"></nav>
     <footer id="site-footer" class="site-footer" data-copy-key="bento.footer_copy"></footer>

   data-active values: "home" | "bento" | "cv" | "contacts" | ""
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {

    // ── BASE PATH ─────────────────────────────────────────────────────────────
    // Resolve site root from this script's own URL so all asset paths work
    // both on file://, Live Server, and in production (Cloudflare / GitHub Pages).
    var scriptSrc = (document.currentScript || {}).src || '';
    var rootUrl   = scriptSrc ? scriptSrc.replace(/components\.js(\?.*)?$/, '') : '/';

    function r(rel) { return rootUrl + rel; }

    // ── REDUCED MOTION ───────────────────────────────────────────────────────
    // CSS animations/transitions are neutralized globally via shared.css; this
    // flag lets JS-driven continuous motion (parallax, spin loops, particle
    // effects) opt out the same way. Computed once, reused by every page.
    window.prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ── NAV ───────────────────────────────────────────────────────────────────
    var NAV_LINKS = [
        { key: 'home',  href: r(''),        label: '// home',  i18n: null        },
        { key: 'bento', href: r('bento/'),  label: '// bento', i18n: 'nav.bento' },
        { key: 'cv',    href: r('cv/'),     label: '// cv',    i18n: 'nav.cv'    },
    ];

    function buildNav(el) {
        var active = el.dataset.active || '';
        var links  = NAV_LINKS.map(function (item) {
            var cls  = item.key === active ? ' class="active"' : '';
            var i18n = item.i18n ? ' data-i18n="' + item.i18n + '"' : '';
            return '<li><a href="' + item.href + '"' + cls + i18n + '>' + item.label + '</a></li>';
        }).join('');
        el.innerHTML =
            '<a href="' + r('') + '" class="nav-logo">' +
                '<img src="' + r('assets/logo.svg') + '" alt="justwhitee">' +
                'justwhitee' +
            '</a>' +
            '<ul class="nav-links">' + links + '</ul>';
        // i18n.js appends the language toggle into .nav-links after this runs
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    function buildFooter(el) {
        var copyKey = el.dataset.copyKey || 'home.footer_copy';
        el.innerHTML =
            '<div class="footer-inner">' +
                '<img src="' + r('assets/logo.svg') + '" alt="justwhitee logo" class="footer-logo">' +
                '<p class="footer-name">justwhitee &mdash; Matteo Fontolan</p>' +
                '<p class="footer-copy" data-i18n-html="' + copyKey + '"></p>' +
                '<div class="footer-links">' +
                    '<a href="https://github.com/itsjustwhitee" target="_blank" rel="noopener noreferrer">' +
                        '<i class="fa-brands fa-github"></i> itsjustwhitee' +
                    '</a>' +
                    '<span class="footer-sep">//</span>' +
                    '<a href="mailto:matteo.fontolan@justwhitee.org">' +
                        '<i class="fa-solid fa-envelope"></i> matteo.fontolan [at] justwhitee.org' +
                    '</a>' +
                    '<span class="footer-sep">//</span>' +
                    '<a href="https://www.linkedin.com/in/justwhitee" target="_blank" rel="noopener noreferrer">' +
                        '<i class="fa-brands fa-linkedin"></i> @justwhitee' +
                    '</a>' +
                '</div>' +
            '</div>';
    }

    // ── MOUSE PARALLAX ORBS ─────────────────────────────────────────────────
    // Shared by every page that has #orb1/#orb2 in its markup (home, bento,
    // contacts). No-op (never attaches the listener) on pages without them.
    function initParallaxOrbs() {
        var orb1 = document.getElementById('orb1');
        var orb2 = document.getElementById('orb2');
        if (!orb1 && !orb2) return;
        if (window.prefersReducedMotion) return;

        var ticking = false;
        window.addEventListener('mousemove', function (e) {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var x = e.clientX / window.innerWidth;
                var y = e.clientY / window.innerHeight;
                if (orb1) orb1.style.transform = 'translate(' + (x * 30) + 'px, ' + (y * 30) + 'px)';
                if (orb2) orb2.style.transform = 'translate(' + (-x * 20) + 'px, ' + (-y * 20) + 'px)';
                ticking = false;
            });
        }, { passive: true });
    }

    // ── SCROLL REVEAL ────────────────────────────────────────────────────────
    // Bidirectional (in on scroll down, out on scroll up) reveal for `.reveal`
    // elements, staggered by sibling index. Used by home + contacts, each with
    // its own step/cap. (bento/script.js has its own batch-based variant since
    // its cards can be added to the DOM asynchronously after this runs.)
    window.initScrollReveal = function (opts) {
        opts = opts || {};
        var delayStep  = opts.delayStep  || 80;
        var delayCap   = opts.delayCap   || 280;
        var revealStart = Date.now();

        var revealObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var siblings = [].slice.call(entry.target.parentElement.querySelectorAll('.reveal'));
                    var idx      = siblings.indexOf(entry.target);
                    var delay    = Math.min(idx * delayStep, delayCap);
                    entry.target.style.transitionDelay = delay + 'ms';
                    entry.target.classList.add('visible');
                } else if (Date.now() - revealStart > 800) {
                    // Only hide after the page has settled — avoids flash-of-invisible on load
                    entry.target.style.transitionDelay = '0ms';
                    entry.target.classList.remove('visible');
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

        document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

        // Hard fallback: anything still hidden after 2s gets force-shown
        setTimeout(function () {
            document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
                el.style.transitionDelay = '0ms';
                el.classList.add('visible');
            });
        }, 2000);

        return revealObs;
    };

    // ── EASTER EGG: CONSOLE MESSAGE ──────────────────────────────────────────
    // Art is fetched from assets/ascii-logo.txt, so editing that file is enough
    // to update it. Note: fetch() can't read local files when the site is
    // opened via file:// (double-clicking index.html) rather than served over
    // http(s) — in that case the art just doesn't log, the rest still does.
    function logConsoleEasterEgg() {
        var logoStyle = 'color:#00bbc9;font-family:monospace;font-size:6px;line-height:6px;';
        var accent    = 'color:#00bbc9;font-family:monospace;font-weight:bold;font-size:12px;';
        var text      = 'color:#f0feff;font-family:monospace;font-size:12px;';
        var muted     = 'color:#7fa8a8;font-family:monospace;font-size:11px;';

        fetch(r('assets/ascii-logo.txt'))
            .then(function (res) { return res.ok ? res.text() : null; })
            .catch(function () { return null; })
            .then(function (art) {
                if (art) console.log('%c' + art, logoStyle);
                console.log('%c// itsjustwhitee · Matteo Fontolan', accent);
                console.log('%c// hello, fellow curious dev 👋', text);
                console.log('%c// if you like poking at the internals of things, we should talk:', muted);
                console.log('%c// matteo.fontolan@justwhitee.org', accent);
            });
    }

    // ── EASTER EGG: FUN FACT WINDOWS ──────────────────────────────────────────
    // Two triggers pop a random fun fact as a little retro-OS window:
    //   - 5 clicks within 2s on the footer logo    → subset A (even indices)
    //   - 20 clicks within 4s on the profile photo → subset B (odd indices)
    //     (.about-pic on the homepage, .profile-pic on bento/contacts)
    // Windows stay open until their own × is clicked, persist across reloads
    // (localStorage — a plain refresh will NOT clear them), and stack up with
    // no cap: keep triggering it and you'll bury the page in windows on
    // purpose. Closing them one by one is the only "soft" way out; the other
    // is clearing site data/localStorage yourself.
    var FUN_FACTS = [
        { it: 'dattebayo! (se non sai cosa significa, guarda Naruto 🍥 e ne riparliamo)',
          en: 'dattebayo! (if you don\'t know what that means, watch Naruto 🍥 and we\'ll talk)' },
        { it: 'il grano 🌾 è il mio arcinemico giurato... sono celiaco, quindi niente cibo glutinoso per me.',
          en: 'wheat 🌾 is my sworn arch-enemy... I\'m celiac, so no glutinous food for me.' },
        { it: 'vengo da Corbola 📍, un paesino così piccolo che se sbatti le palpebre te lo perdi.',
          en: 'I\'m from Corbola 📍, a town so small you\'ll miss it if you blink.' },
        { it: 'niente computer fino ai 12-13 anni, era off limits in casa. Alle superiori ho costruito il mio primo PC 💻 (con po\' d\'aiuto), poi ho costruito il mio primo PC interamente da solo e il mio server homelab.',
          en: 'no computers allowed until I was 12-13. In high school I built my first PC 💻 (with some help), then I built my first PC entirely by myself and my homelab.' },
        { it: 'sott\'acqua 🏊 respiro come un sasso.',
          en: 'underwater 🏊 I breathe like a rock.' },
        { it: 'sono pigro a livelli olimpionici, se esistesse una medaglia, l\'avrei già vinta procrastinando 🛋️.',
          en: 'I\'m lazy at an Olympic level, if there were a medal for it, I\'d have won it procrastinating 🛋️.' },
        { it: '👂 ascolterei per ore chi parla con passione di un argomento (soprattutto se non lo conosco, ma mi interessa!)',
          en: '👂 I\'d listen for hours to someone talking passionately about a topic (especially if I don\'t know much about it but find it interesting!)' },
        { it: 'appena tocco il letto mi spengo istantaneamente (vado in carica 🔋)',
          en: 'as soon as I touch the bed I instantly shut down (I go charging 🔋)' },
        { it: 'non sono un gran chiacchierone, ma a sparare cavolate 🤪 sono imbattibile.',
          en: 'I\'m not much of a chatterbox, but I\'m unbeatable when it comes to spouting nonsense 🤪.' },
        { it: 'quando ho un attimo libero gioco ai videogiochi 🎮 o smanetto su qualcosa.',
          en: 'when I have a free moment I play video games 🎮 or tinker with something.' },
        { it: '😅 sono una persona molto sbadata a volte, tendo a dimenticare le cose in giro, per questo sotto ogni mio oggetto c\'è un QR code 🏷️!',
          en: '😅 I can be quite scatterbrained sometimes, I tend to leave things lying around, so there\'s a QR code 🏷️ stuck under every one of my belongings!' },
        { it: 'alle medie e superiori ero molto appassionato di grafica e 3D 🎨... magari hai visto qualche mia copertina su YouTube 📺... 😗',
          en: 'in middle and high school I was really into graphic design and 3D 🎨... you might have seen one of my YouTube thumbnails 📺 somewhere... 😗' }
    ];
    var FUN_FACTS_A = FUN_FACTS.filter(function (_, i) { return i % 2 === 0; });
    var FUN_FACTS_B = FUN_FACTS.filter(function (_, i) { return i % 2 !== 0; });
    var EGG_WINDOWS_KEY = 'jw_egg_windows';
    var EGG_COUNT_KEY   = 'jw_egg_count';
    var RICKROLL_URL    = 'https://youtu.be/oHg5SJYRHA0';
    var dragZTop = 10000;

    function loadEggWindows() {
        try { return JSON.parse(localStorage.getItem(EGG_WINDOWS_KEY)) || []; }
        catch (e) { return []; }
    }
    function saveEggWindows(list) {
        try { localStorage.setItem(EGG_WINDOWS_KEY, JSON.stringify(list)); }
        catch (e) { /* storage full/unavailable — windows just won't persist */ }
    }
    function loadEggCount() {
        var n = parseInt(localStorage.getItem(EGG_COUNT_KEY), 10);
        return isNaN(n) ? 0 : n;
    }
    function saveEggCount(n) {
        try { localStorage.setItem(EGG_COUNT_KEY, String(n)); }
        catch (e) { /* ignore */ }
    }

    // Best-effort "was this a hard refresh (Ctrl+F5 / Cmd+Shift+R)" check.
    // There's no direct browser API for that, so this infers it from Resource
    // Timing: components.js is a normally browser-cached static file; if THIS
    // load had to re-fetch it over the network (transferSize > 0) on a
    // `reload`-type navigation, that's the signature of a cache-bypassing hard
    // refresh. Not airtight — a host/dev-server that sends no cache headers at
    // all will look like a hard refresh on every plain F5 too.
    function clearEggStateOnHardRefresh() {
        try {
            var nav = performance.getEntriesByType('navigation')[0];
            if (!nav || nav.type !== 'reload') return;
            var entries = performance.getEntriesByType('resource');
            var self;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].name.indexOf('components.js') !== -1) { self = entries[i]; break; }
            }
            if (self && self.transferSize > 0) {
                localStorage.removeItem(EGG_WINDOWS_KEY);
                localStorage.removeItem(EGG_COUNT_KEY);
            }
        } catch (e) { /* Resource/Navigation Timing unavailable — skip */ }
    }

    function nextEggWindowPosition(count) {
        // True diagonal cascade (both x AND y advance together) so each new
        // window's titlebar/close button lands below the previous one's,
        // never covering it — a wide viewport must NOT turn this into one
        // long horizontal row (that was the bug: the close button of an
        // earlier window ended up hidden under a later one sitting on top).
        var stepX = 34, stepY = 34, baseX = 30, baseY = 90;
        var maxSteps = 10; // classic cascade depth before it loops back around
        var cycle = count % maxSteps;
        var lane  = Math.floor(count / maxSteps) % 3; // shift sideways on each wrap
        var x = baseX + cycle * stepX + lane * 140;
        var y = baseY + cycle * stepY;
        var maxX = Math.max(baseX, window.innerWidth  - 260);
        var maxY = Math.max(baseY, window.innerHeight - 140);
        return { x: Math.min(x, maxX), y: Math.min(y, maxY) };
    }

    function makeEggWindowDraggable(win, entry) {
        var titlebar = win.querySelector('.egg-window-titlebar');
        var dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;
        titlebar.addEventListener('mousedown', function (e) {
            if (e.target.closest('.egg-window-close')) return;
            dragging = true;
            startX = e.clientX; startY = e.clientY;
            origX = win.offsetLeft; origY = win.offsetTop;
            win.style.zIndex = String(++dragZTop);
            e.preventDefault();
        });
        window.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            win.style.left = (origX + (e.clientX - startX)) + 'px';
            win.style.top  = (origY + (e.clientY - startY)) + 'px';
        });
        window.addEventListener('mouseup', function () {
            if (!dragging) return;
            dragging = false;
            var nx = win.offsetLeft, ny = win.offsetTop;
            saveEggWindows(loadEggWindows().map(function (e) {
                if (e.id === entry.id) { e.x = nx; e.y = ny; }
                return e;
            }));
        });
    }

    function renderEggWindow(entry) {
        var win = document.createElement('div');
        win.className = 'egg-window';
        win.style.left = entry.x + 'px';
        win.style.top  = entry.y + 'px';

        if (entry.trap) {
            win.innerHTML =
                '<div class="egg-window-titlebar">' +
                    '<span class="egg-window-title">system.exe</span>' +
                    '<button class="egg-window-close" aria-label="Close">×</button>' +
                '</div>' +
                '<div class="egg-window-body"><button class="egg-window-trap-btn"></button></div>';
            var trapBtn = win.querySelector('.egg-window-trap-btn');
            trapBtn.textContent = window.currentLang === 'it' ? 'chiudi tutte le finestre' : 'close all windows';
            trapBtn.addEventListener('click', function () { window.open(RICKROLL_URL, '_blank', 'noopener'); });
        } else {
            var facts = entry.subset === 'B' ? FUN_FACTS_B : FUN_FACTS_A;
            var fact  = facts[entry.factIdx] || facts[0];
            var msg   = window.currentLang === 'it' ? fact.it : fact.en;
            win.innerHTML =
                '<div class="egg-window-titlebar">' +
                    '<span class="egg-window-title">fun-fact.exe</span>' +
                    '<button class="egg-window-close" aria-label="Close">×</button>' +
                '</div>' +
                '<div class="egg-window-body"></div>';
            win.querySelector('.egg-window-body').textContent = msg;
        }

        win.querySelector('.egg-window-close').addEventListener('click', function () {
            win.remove();
            saveEggWindows(loadEggWindows().filter(function (e) { return e.id !== entry.id; }));
        });
        makeEggWindowDraggable(win, entry);
        document.body.appendChild(win);
    }

    function spawnEggWindow(subset) {
        var facts = subset === 'B' ? FUN_FACTS_B : FUN_FACTS_A;
        var list  = loadEggWindows();
        var pos   = nextEggWindowPosition(list.length);
        var entry = {
            id: Date.now() + '-' + Math.random().toString(36).slice(2),
            subset: subset,
            factIdx: Math.floor(Math.random() * facts.length),
            x: pos.x, y: pos.y
        };
        list.push(entry);
        saveEggWindows(list);
        renderEggWindow(entry);
    }

    // Scattered (not cascaded) position for flood windows — random anywhere
    // on screen, so 50 of them actually cover the whole page instead of
    // piling up along the same diagonal line the single-spawn cascade uses.
    function randomFloodPosition() {
        var w = 250, h = 130, margin = 20, topClear = 70; // stay clear of the fixed nav bar
        var maxX = Math.max(margin, window.innerWidth  - w - margin);
        var maxY = Math.max(topClear, window.innerHeight - h - margin);
        return {
            x: Math.round(margin + Math.random() * (maxX - margin)),
            y: Math.round(topClear + Math.random() * (maxY - topClear))
        };
    }

    // Hitting 10 cumulative fun-fact requests (footer logo + profile photo
    // combined) floods the page with 50 windows instead of just one, plus a
    // bogus "close all windows" window — a bait-and-switch that opens a
    // certain 2009 music video instead of closing anything. Its own × still
    // closes just that one window normally, same as every other window.
    function floodEggWindows() {
        var list = loadEggWindows();
        for (var i = 0; i < 50; i++) {
            var subset = Math.random() < 0.5 ? 'A' : 'B';
            var facts  = subset === 'B' ? FUN_FACTS_B : FUN_FACTS_A;
            var pos    = randomFloodPosition();
            var entry  = {
                id: Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2),
                subset: subset,
                factIdx: Math.floor(Math.random() * facts.length),
                x: pos.x, y: pos.y
            };
            list.push(entry);
            renderEggWindow(entry);
        }
        var trapEntry = {
            id: 'trap-' + Date.now(),
            trap: true,
            x: Math.max(30, Math.round(window.innerWidth  / 2 - 130)),
            y: Math.max(90, Math.round(window.innerHeight / 2 - 60))
        };
        list.push(trapEntry);
        renderEggWindow(trapEntry);
        saveEggWindows(list);
    }

    function requestFunFact(subset) {
        var count = loadEggCount() + 1;
        saveEggCount(count);
        // Every 10th cumulative request floods, not just the very first time —
        // a strict "=== 10" would silently stop working forever once the
        // persisted counter passed 10 (exactly what happened during testing:
        // the counter was already past it, so it could never fire again).
        if (count % 10 === 0) { floodEggWindows(); } else { spawnEggWindow(subset); }
    }

    function restoreEggWindows() {
        loadEggWindows().forEach(renderEggWindow);
    }
    function initFunFactTriggers() {
        var footerClicks = [];
        var picClicks = [];
        document.addEventListener('click', function (e) {
            var now = Date.now();

            if (e.target.closest && e.target.closest('.footer-logo')) {
                footerClicks.push(now);
                footerClicks = footerClicks.filter(function (t) { return now - t < 2000; });
                if (footerClicks.length >= 5) { footerClicks = []; requestFunFact('A'); }
                return;
            }

            if (e.target.closest && e.target.closest('.about-pic, .profile-pic')) {
                picClicks.push(now);
                picClicks = picClicks.filter(function (t) { return now - t < 4000; });
                if (picClicks.length >= 20) { picClicks = []; requestFunFact('B'); }
            }
        });
    }

    // ── EASTER EGG: TYPED SEQUENCES ───────────────────────────────────────────
    // Type any of these anywhere on the page (like a Konami code):
    //   "justwhitee" → screen glow + toast
    //   ":qa"        → vim-style "quit all", closes every open fun-fact window
    function initTypedSequences() {
        var sequences = [
            { word: 'justwhitee', pos: 0, action: triggerSecretWord },
            { word: ':qa',        pos: 0, action: closeAllEggWindows }
        ];
        document.addEventListener('keydown', function (e) {
            if (e.key.length !== 1) return; // ignore Shift/Arrow/Enter/etc.
            var ch = e.key.toLowerCase();
            sequences.forEach(function (seq) {
                var word = seq.word.toLowerCase();
                seq.pos = (ch === word[seq.pos]) ? seq.pos + 1 : (ch === word[0] ? 1 : 0);
                if (seq.pos === word.length) {
                    seq.pos = 0;
                    seq.action();
                }
            });
        });
    }
    function closeAllEggWindows() {
        document.querySelectorAll('.egg-window').forEach(function (w) { w.remove(); });
        saveEggWindows([]); // only clears open windows — the request counter (and its
                             // progress toward the next flood) is untouched on purpose
    }
    function triggerSecretWord() {
        document.body.classList.add('konami-active');
        setTimeout(function () { document.body.classList.remove('konami-active'); }, 2600);

        var msg = window.currentLang === 'it'
            ? '🕵️ hai scovato la parola magica — bravo detective, ma qui non c\'è nessun tesoro nascosto.'
            : '🕵️ you found the magic word — nice detective work, but there\'s no hidden treasure here.';
        var toast = document.createElement('div');
        toast.className = 'konami-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(function () { toast.classList.add('show'); });
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 400);
        }, 3200);
    }

    // ── INIT ──────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var nav    = document.getElementById('site-nav');
        var footer = document.getElementById('site-footer');
        if (nav)    buildNav(nav);
        if (footer) buildFooter(footer);
        initParallaxOrbs();
        initFunFactTriggers();
        clearEggStateOnHardRefresh();
        restoreEggWindows();
        initTypedSequences();
    });

    logConsoleEasterEgg();

})();