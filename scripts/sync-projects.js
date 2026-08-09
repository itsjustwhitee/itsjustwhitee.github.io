// scripts/sync-projects.js
//
// Single source of truth: projects/data.js. Generates the project-card HTML
// for the home page's #projects section (pinned + most-recent, capped at
// HOME_COUNT) and for projects/index.html (every project), writing between
// <!-- PROJECTS:START/END --> markers — mirrors scripts/sync-head.js.
//
// Usage:
//   node scripts/sync-projects.js          apply and write changed files
//   node scripts/sync-projects.js --check  exit 1 if any file is out of sync (CI)
const fs = require('fs');
const path = require('path');
const { projects, HOME_COUNT } = require('../projects/data.js');

const ROOT_DIR = path.join(__dirname, '..');
const START = '<!-- PROJECTS:START -->';
const END = '<!-- PROJECTS:END -->';

const TARGETS = [
    { file: 'index.html', full: false },
    { file: 'projects/index.html', full: true },
];

function byDateDesc(a, b) {
    if (a.date === b.date) return 0;
    return a.date > b.date ? -1 : 1;
}

function selectHomeProjects(list, homeCount) {
    const pinned = list.filter(function (p) { return p.pinned; });
    const rest = list.filter(function (p) { return !p.pinned; }).sort(byDateDesc);
    if (pinned.length >= homeCount) return pinned.slice(0, homeCount);

    const filled = rest.slice(0, homeCount - pinned.length);

    // A featured card spans the full grid row (both columns) on home too, so
    // an odd count of non-featured cards leaves one stranded alone in the
    // last row. Trim the least-recent filler card to keep the rest pairing
    // up evenly whenever a featured card is in the mix. Only ever trims a
    // recency-filled card, never a pinned one — pins are deliberate choices.
    const hasFeatured = pinned.concat(filled).some(function (p) { return p.featured; });
    const nonFeaturedCount = pinned.concat(filled).filter(function (p) { return !p.featured; }).length;
    if (hasFeatured && nonFeaturedCount % 2 === 1) {
        for (let i = filled.length - 1; i >= 0; i--) {
            if (!filled[i].featured) { filled.splice(i, 1); break; }
        }
    }

    return pinned.concat(filled);
}

function renderLinks(links) {
    return links.map(function (l) {
        const leading = l.icon ? '<i class="' + l.icon + '"></i> ' : '';
        const trailingClass = l.trailing === 'external' ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-solid fa-arrow-right';
        const trailingSize = l.trailing === 'external' ? '0.55rem' : '0.58rem';
        return '<a href="' + l.url + '" target="_blank" rel="noopener noreferrer" class="project-link">' +
            leading + l.label + ' <i class="' + trailingClass + '" style="font-size:' + trailingSize + ';"></i></a>';
    }).join('\n                        ');
}

function renderTags(tags) {
    return tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('');
}

function renderStats(project) {
    if (!project.stats) return '';
    const boxes = project.stats.map(function (s) {
        const valueLine = s.value ? '\n                            <p class="stat-box-value">' + s.value + '</p>' : '';
        return '\n                        <div class="stat-box">' +
            '\n                            <p class="stat-box-label" data-i18n="proj.' + project.i18nKey + '.' + s.labelI18nKey + '">' + s.labelText + '</p>' +
            valueLine +
            '\n                            <p class="stat-box-desc" data-i18n="proj.' + project.i18nKey + '.' + s.descI18nKey + '">' + s.descText + '</p>' +
            '\n                        </div>';
    }).join('');
    return '\n                    <div class="project-stats">' + boxes + '\n                    </div>';
}

function renderImage(project) {
    const img = project.image;
    const ph = '<div class="project-img-placeholder" style="display:none;">' + img.placeholderEmoji + '</div>';
    if (img.mode === 'img') {
        return '<div class="project-img-wrap">\n' +
            '                    <img src="' + img.src + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" alt="' + img.alt + '" class="project-img" loading="lazy">\n' +
            '                    ' + ph + '\n' +
            '                </div>';
    }
    if (img.mode === 'svg-inject') {
        return '<div class="project-img-wrap">\n' +
            '                    <div class="project-img-wrap" id="' + img.visualId + '" data-svg-src="' + img.fetchSrc + '"></div>\n' +
            '                    ' + ph + '\n' +
            '                </div>';
    }
    if (img.mode === 'spin-wrapper') {
        return '<div class="project-img-wrap">\n' +
            '                    <div class="rack-spin-wrapper" id="' + img.visualId + '">\n' +
            '                        <img src="' + img.src + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" alt="' + img.alt + '" class="project-img" loading="lazy">\n' +
            '                    </div>\n' +
            '                    ' + ph + '\n' +
            '                </div>';
    }
    throw new Error('Unknown image.mode: ' + img.mode);
}

function renderContributors(project) {
    if (!project.contributors) return '';
    const chips = project.contributors.map(function (c) { return '<span class="contrib-chip">' + c + '</span>'; }).join('\n                                ');
    return '\n                        <div class="project-contributors">' +
        '\n                            <span class="contrib-label" data-i18n="projects.contrib_label">with</span>' +
        '\n                            <div class="contrib-names">\n                                ' + chips + '\n                            </div>' +
        '\n                        </div>';
}

function renderCard(project) {
    // `featured` gets the 2-column large-card treatment on every page it
    // appears on, home included — a "big" card (extra stat-boxes, longer
    // copy) stretching its shorter row-mates to match its own height (even
    // with align-items:start, the row itself is still as tall as its
    // tallest cell) reads as more broken than one asymmetric last row.
    const featuredClass = project.featured ? ' featured' : '';
    const badgeClass = project.badgeVariant ? ' ' + project.badgeVariant : '';
    const taglineAttr = project.taglineHtml ? 'data-i18n-html' : 'data-i18n';

    return '            <div class="project-card' + featuredClass + ' reveal" id="' + project.slug + '-card" data-date="' + project.date + '">\n' +
        '                ' + renderImage(project) + '\n' +
        '                <div class="project-body">\n' +
        '                    <div class="project-meta">\n' +
        '                        <span class="project-badge' + badgeClass + '" data-i18n="proj.' + project.i18nKey + '.badge">' + project.badgeText + '</span>\n' +
        '                        <span class="project-year">' + project.yearLabel + '</span>\n' +
        '                    </div>\n' +
        '                    <h3>' + project.title + '</h3>\n' +
        '                    <p class="tagline" ' + taglineAttr + '="proj.' + project.i18nKey + '.tagline">' + project.taglineText + '</p>\n' +
        '                    <p class="proj-desc" data-i18n="proj.' + project.i18nKey + '.desc">' + project.descText + '</p>' +
        renderStats(project) + '\n' +
        '                    <div class="project-tags">\n' +
        '                        ' + renderTags(project.tags) + '\n' +
        '                    </div>\n' +
        '                    <div class="project-footer">\n' +
        '                        ' + renderLinks(project.links) +
        renderContributors(project) + '\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '            </div>';
}

function render(list) {
    return list.map(renderCard).join('\n\n');
}

module.exports = {
    byDateDesc: byDateDesc,
    selectHomeProjects: selectHomeProjects,
    renderCard: renderCard,
    render: render,
    main: main,
};

function main() {
    const checkOnly = process.argv.includes('--check');
    let drifted = [];

    const fullList = projects.slice().sort(byDateDesc);
    const homeList = selectHomeProjects(projects, HOME_COUNT);

    TARGETS.forEach(function (target) {
        const filePath = path.join(ROOT_DIR, target.file);
        const original = fs.readFileSync(filePath, 'utf8');
        const startIdx = original.indexOf(START);
        const endIdx = original.indexOf(END);
        if (startIdx === -1 || endIdx === -1) {
            console.error('Missing PROJECTS markers in ' + target.file);
            process.exitCode = 1;
            return;
        }
        const rendered = render(target.full ? fullList : homeList);
        const before = original.slice(0, startIdx + START.length);
        const after = original.slice(endIdx);
        const updated = before + '\n' + rendered + '\n            ' + after;

        if (updated !== original) {
            drifted.push(target.file);
            if (!checkOnly) fs.writeFileSync(filePath, updated);
        }
    });

    if (checkOnly) {
        if (drifted.length) {
            console.error('Out of sync with projects/data.js:', drifted.join(', '));
            console.error('Run `node scripts/sync-projects.js` and commit the result.');
            process.exit(1);
        }
        console.log('All pages in sync with projects/data.js.');
    } else {
        console.log(drifted.length ? 'Synced: ' + drifted.join(', ') : 'Already in sync.');
    }
}

if (require.main === module) {
    main();
}
