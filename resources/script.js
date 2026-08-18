// ─── resources/script.js — justwhitee · Matteo Fontolan ─────────────────────
// Renders resourceSections into #resources-root. Re-run on language toggle via
// window.renderResources (see i18n.js's toggleLang), same pattern as
// bento/script.js's window.loadBento.
(function () {
    'use strict';

    // ── DATA ──────────────────────────────────────────────────────────────
    // date: 'YYYY-MM', same convention as the `date` field in projects/data.js.
    // item.key / section.key (optional): enables translated copy via
    // resource.<key>.title / .desc and section.<key>.title in i18n.js; falls
    // back to the title/desc below when missing — same fallback pattern as
    // bento/script.js's i18n_key.
    var resourceSections = [
        {
            key: 'dev',
            title: 'Dev & Tools',
            items: [
                {
                    key: 'vscode',
                    title: 'Visual Studio Code',
                    desc: 'The editor this whole site was built in.',
                    link: 'https://code.visualstudio.com/',
                    date: '2026-08',
                    icon: '🧰'
                }
            ]
        }
    ];

    // ── RENDER ────────────────────────────────────────────────────────────
    function buildCard(item) {
        var card = document.createElement('a');
        card.href = item.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'card-base resource-card reveal';

        var title = (item.key && window.t('resource.' + item.key + '.title')) || item.title;
        var desc  = (item.key && window.t('resource.' + item.key + '.desc'))  || item.desc;

        card.innerHTML =
            '<div class="icon-wrap resource-icon-wrap">' + item.icon + '</div>' +
            '<div class="resource-text">' +
                '<h3>' + title + '</h3>' +
                '<p>' + desc + '</p>' +
            '</div>' +
            '<span class="card-slug">// ' + item.date + '</span>';
        return card;
    }

    function buildSection(section) {
        var wrap = document.createElement('section');
        wrap.className = 'resource-section';

        var heading = document.createElement('h2');
        heading.className = 'resource-section-title';
        heading.textContent = (section.key && window.t('section.' + section.key + '.title')) || section.title;
        wrap.appendChild(heading);

        var grid = document.createElement('div');
        grid.className = 'resource-grid';
        section.items.forEach(function (item) { grid.appendChild(buildCard(item)); });
        wrap.appendChild(grid);

        return wrap;
    }

    // Tracks the observer from the last render so re-rendering on a language
    // toggle disconnects the old one instead of leaking it (mirrors bento's
    // own _revealObs singleton in components.js/bento's script.js).
    var _revealObs = null;

    function renderResources() {
        var root = document.getElementById('resources-root');
        if (!root) return;
        root.innerHTML = '';
        resourceSections.forEach(function (section) { root.appendChild(buildSection(section)); });
        if (_revealObs) _revealObs.disconnect();
        _revealObs = window.initScrollReveal({ delayStep: 80, delayCap: 280 });
    }

    document.addEventListener('DOMContentLoaded', renderResources);

    // Exposed for i18n.js's toggleLang(), which re-renders on language switch
    window.renderResources = renderResources;
})();
