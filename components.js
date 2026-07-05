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

    // ── INIT ──────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var nav    = document.getElementById('site-nav');
        var footer = document.getElementById('site-footer');
        if (nav)    buildNav(nav);
        if (footer) buildFooter(footer);
        initParallaxOrbs();
    });

})();