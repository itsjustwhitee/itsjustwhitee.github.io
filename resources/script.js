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
    // (array of { key, label, href, external }) renders a row of buttons instead
    // (external: true swaps the download icon/attribute for an outbound-link one).
    // item.price (1-3, optional): shows that many '$' top-right; omitted = free.
    var resourceSections = [
        {
            key: 'printing',
            title: '3D Printing',
            items: [
                {
                    key: 'nexprint',
                    title: 'Nexprint Profile',
                    desc: '3D models I print and share, from my newest hobby.',
                    preview: 'assets/nexprint.svg',
                    downloads: [
                        { key: 'visit', label: 'View Profile', href: 'https://www.nexprint.com/en/U0053881860/home', external: true }
                    ],
                    author: 'justwhitee',
                    date: '2026-09'
                }
            ]
        },
        {
            key: 'electronics',
            title: 'Electronics',
            items: [
                {
                    key: 'fritzing',
                    title: 'Fritzing',
                    desc: 'Open-source app I use to sketch breadboard circuits and PCBs.',
                    preview: 'assets/fritzing.png',
                    downloads: [
                        { key: 'visit', label: 'Get Fritzing', href: 'https://fritzing.org/', external: true }
                    ],
                    price: 1,
                    date: '2026-09'
                }
            ]
        },
        {
            key: 'uni',
            title: 'Uni',
            items: [
                {
                    key: 'notion',
                    title: 'Notes & Resources',
                    desc: 'A running Notion page with notes, references, and other things worth keeping.',
                    preview: 'assets/notion.png',
                    downloads: [
                        { key: 'visit', label: 'Open Notion', href: 'https://justwhitee.notion.site/Materiali-utili-su-Notion-6d4afc02fd114ee1b65fac5ab8e25201?pvs=4', external: true }
                    ],
                    author: 'justwhitee',
                    date: '2026-09'
                }
            ]
        },
        {
            key: 'appearance',
            title: 'Improve Appearance',
            items: [
                {
                    key: 'deskmat',
                    title: 'BluePrint Wallpaper',
                    desc: 'Blueprint-style desktop wallpaper, in two variants.',
                    // Preview stays in-repo (small, needed by the site itself); the
                    // full-size downloads live in a GitHub Release instead, so this
                    // repo doesn't grow with every large downloadable asset.
                    preview: 'assets/deskmat-wallpaper-preview.png',
                    downloads: [
                        { key: 'normal', label: 'Normale', href: 'https://github.com/itsjustwhitee/itsjustwhitee.github.io/releases/download/resources-assets-v1/deskmat-wallpaper.png' },
                        { key: 'blank', label: 'Blank', href: 'https://github.com/itsjustwhitee/itsjustwhitee.github.io/releases/download/resources-assets-v1/deskmat-wallpaper-blank.png' }
                    ],
                    author: 'justwhitee',
                    date: '2026-08',
                    icon: '🖥️'
                }
            ]
        },
        {
            key: 'security',
            title: 'Security',
            items: [
                {
                    key: 'bitwarden',
                    title: 'Bitwarden',
                    desc: 'The password manager I use to keep everything locked down.',
                    preview: 'assets/bitwarden.png',
                    downloads: [
                        { key: 'visit', label: 'Get Bitwarden', href: 'https://bitwarden.com', external: true }
                    ],
                    price: 1,
                    date: '2026-09'
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
        // item.price: 1-3 -> that many '$', shown top-right; omitted means free, no badge.
        var priceHtml = item.price ? '<span class="resource-price">' + Array(item.price + 1).join('$') + '</span>' : '';

        if (item.downloads) {
            var card = document.createElement('div');
            card.className = 'card-base resource-card resource-card-downloads reveal';
            var buttonsHtml = item.downloads.map(function (dl, i) {
                var dlLabel = (item.key && dl.key && window.t('resource.' + item.key + '.dl_' + dl.key)) || dl.label;
                var dlIcon  = dl.external ? 'fa-arrow-up-right-from-square' : 'fa-download';
                return '<a class="btn-pill ' + (i === 0 ? 'btn-primary' : 'btn-ghost') + '" href="' + dl.href + '"' + (dl.external ? '' : ' download') + ' target="_blank" rel="noopener noreferrer">' +
                    '<i class="fa-solid ' + dlIcon + '"></i><span>' + dlLabel + '</span>' +
                '</a>';
            }).join('');
            card.innerHTML =
                previewHtml +
                '<div class="resource-card-main">' + iconHtml + textHtml + '</div>' +
                '<div class="resource-downloads">' + buttonsHtml + '</div>' +
                slugHtml + priceHtml;
            return card;
        }

        var card = document.createElement('a');
        card.href = item.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'card-base resource-card reveal';
        card.innerHTML = previewHtml + '<div class="resource-card-main">' + iconHtml + textHtml + '</div>' + slugHtml + priceHtml;
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
