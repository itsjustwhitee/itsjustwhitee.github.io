// Keeps the shared <head> boilerplate (charset/viewport, shared.css, Font
// Awesome, Google Fonts, favicons/manifest/theme-color, components.js+i18n.js)
// in sync across every page, sourced from partials/shared-head.html.
//
// Each page's <head> has a marker pair:
//   <!-- SHARED-HEAD:START -->
//   ...synced content...
//   <!-- SHARED-HEAD:END -->
//
// Usage:
//   node scripts/sync-head.js          apply and write changed files
//   node scripts/sync-head.js --check  exit 1 if any file is out of sync (CI)
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PARTIAL_PATH = path.join(ROOT_DIR, 'partials', 'shared-head.html');
const START = '<!-- SHARED-HEAD:START -->';
const END = '<!-- SHARED-HEAD:END -->';

// root: the relative-path prefix this page needs for shared.css/components.js/i18n.js.
// 404.html is special-cased to absolute paths — GitHub Pages serves it for any
// unmatched URL while keeping the broken URL in the address bar, so relative
// paths resolve against that URL's path, not the site root.
const PAGES = [
    { file: 'index.html', root: './' },
    { file: '404.html', root: '/' },
    { file: 'bento/index.html', root: '../' },
    { file: 'contacts/index.html', root: '../' },
    { file: 'cv/index.html', root: '../' },
    { file: 'projects/index.html', root: '../' },
    { file: 'resources/index.html', root: '../' },
];

function render(root) {
    const partial = fs.readFileSync(PARTIAL_PATH, 'utf8');
    return partial.replace(/\{\{ROOT\}\}/g, root);
}

function main() {
    const checkOnly = process.argv.includes('--check');
    let drifted = [];

    for (const { file, root } of PAGES) {
        const filePath = path.join(ROOT_DIR, file);
        const original = fs.readFileSync(filePath, 'utf8');
        const startIdx = original.indexOf(START);
        const endIdx = original.indexOf(END);
        if (startIdx === -1 || endIdx === -1) {
            console.error(`Missing SHARED-HEAD markers in ${file}`);
            process.exitCode = 1;
            continue;
        }
        const rendered = render(root);
        const before = original.slice(0, startIdx + START.length);
        const after = original.slice(endIdx);
        const updated = `${before}\n${rendered}    ${after}`;

        if (updated !== original) {
            drifted.push(file);
            if (!checkOnly) fs.writeFileSync(filePath, updated);
        }
    }

    if (checkOnly) {
        if (drifted.length) {
            console.error('Out of sync with partials/shared-head.html:', drifted.join(', '));
            console.error('Run `node scripts/sync-head.js` and commit the result.');
            process.exit(1);
        }
        console.log('All pages in sync with partials/shared-head.html.');
    } else {
        console.log(drifted.length ? `Synced: ${drifted.join(', ')}` : 'Already in sync.');
    }
}

main();
