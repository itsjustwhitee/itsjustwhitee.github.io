// ─── resources/script.js — justwhitee · Matteo Fontolan ─────────────────────
// Renders resourceSections into #resources-root. Re-run on language toggle via
// window.renderResources (see i18n.js's toggleLang), same pattern as
// bento/script.js's window.loadBento.
(function () {
    'use strict';

    // ── DATA ──────────────────────────────────────────────────────────────
    // date: 'YYYY-MM' (see projects/data.js). item.key/section.key (optional):
    // enables translated copy via resource.<key>.title/.desc and
    // section.<key>.title, falling back to title/desc below (same pattern as
    // bento's i18n_key). item.link renders the card as one <a>; item.downloads
    // (array of { key, label, href }) renders a row of download buttons instead.
    var resourceSections = [
        {
            key: 'desktop',
            title: 'Desktop & Wallpapers',
            items: [
                {
                    key: 'deskmat',
                    title: 'BluePrint Wallpaper',
                    desc: 'Blueprint-style desktop wallpaper, in two variants.',
                    preview: 'assets/deskmat-wallpaper-preview.png',
                    downloads: [
                        { key: 'normal', label: 'Normale', href: 'assets/deskmat-wallpaper.png' },
                        { key: 'blank', label: 'Blank', href: 'assets/deskmat-wallpaper-blank.png' }
                    ],
                    author: 'justwhitee',
                    date: '2026-08',
                    icon: '🖥️'
                }
            ]
        }
    ];

    // ── RENDER ────────────────────────────────────────────────────────────
    function buildCard(item) {
        var title = (item.key && window.t('resource.' + item.key + '.title')) || item.title;
        var desc  = (item.key && window.t('resource.' + item.key + '.desc'))  || item.desc;
        // Preview replaces the emoji icon; click opens the full-size image
        // (view, not download — the buttons below handle that).
        var previewLink = item.downloads ? item.downloads[0].href : item.link;
        var previewHtml = item.preview
            ? '<a class="resource-preview-wrap" href="' + previewLink + '" target="_blank" rel="noopener noreferrer">' +
                  '<img class="resource-preview" src="' + item.preview + '" alt="' + title + '" loading="lazy">' +
              '</a>'
            : '';
        var iconHtml   = item.preview ? '' : '<div class="icon-wrap resource-icon-wrap">' + item.icon + '</div>';
        var authorHtml = item.author ? '<p class="resource-author">by <strong>' + item.author + '</strong></p>' : '';
        var textHtml =
            '<div class="resource-text">' +
                '<h3>' + title + '</h3>' +
                authorHtml +
                '<p>' + desc + '</p>' +
            '</div>';
        var slugHtml = '<span class="card-slug">// ' + item.date + '</span>';

        if (item.downloads) {
            var card = document.createElement('div');
            card.className = 'card-base resource-card resource-card-downloads reveal';
            var buttonsHtml = item.downloads.map(function (dl, i) {
                var dlLabel = (item.key && dl.key && window.t('resource.' + item.key + '.dl_' + dl.key)) || dl.label;
                return '<a class="btn-pill ' + (i === 0 ? 'btn-primary' : 'btn-ghost') + '" href="' + dl.href + '" download>' +
                    '<i class="fa-solid fa-download"></i><span>' + dlLabel + '</span>' +
                '</a>';
            }).join('');
            card.innerHTML =
                previewHtml +
                '<div class="resource-card-main">' + iconHtml + textHtml + '</div>' +
                '<div class="resource-downloads">' + buttonsHtml + '</div>' +
                slugHtml;
            return card;
        }

        var card = document.createElement('a');
        card.href = item.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'card-base resource-card reveal';
        card.innerHTML = previewHtml + '<div class="resource-card-main">' + iconHtml + textHtml + '</div>' + slugHtml;
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
