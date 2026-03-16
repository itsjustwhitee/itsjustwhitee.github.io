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

    // ── INIT ──────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var nav    = document.getElementById('site-nav');
        var footer = document.getElementById('site-footer');
        if (nav)    buildNav(nav);
        if (footer) buildFooter(footer);
    });

})();