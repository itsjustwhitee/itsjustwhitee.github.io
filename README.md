# [Personal Website](https://itsjustwhitee.github.io) - Internal Documentation

A static personal website hosted on **GitHub Pages** with Cloudflare as CDN and DNS provider. No build tools, no frameworks - just vanilla HTML, CSS, and JavaScript.

---

## Project Structure

```
/
├── index.html              # Home page
├── shared.css              # Global design system
├── components.js           # Shared nav & footer injector (loaded before i18n.js)
├── i18n.js                 # Internationalisation engine (EN/IT)
├── 404.html                # Custom 404 error page
├── manifest.json           # Web App Manifest (PWA metadata)
├── sitemap.xml             # Single sitemap for all pages (covers /, /bento/, /cv/, and /projects/)
├── robots.txt              # Crawler rules
├── favicon.ico             # Favicon (48×48)
├── CNAME                   # Custom domain binding for GitHub Pages
│
├── partials/
│   └── shared-head.html    # Single source of truth for the shared <head> boilerplate (see below)
├── scripts/
│   ├── sync-head.js        # Syncs partials/shared-head.html into every page
│   ├── sync-projects.js    # Generates project cards (home subset + full list) from projects/data.js
│   ├── generate-og-image.js # Screenshots the hero for assets/og-image.jpg (run by CI)
│   └── dev-server.js       # Local dev server with GitHub-Pages-like 404 handling (see Setup below)
│
├── projects/
│   ├── data.js             # Single source of truth for every project (pin/date/tags/links/…)
│   ├── index.html          # Full project list page
│   ├── style.css           # Project-card grid styles, shared with index.html's #projects section
│   └── script.js           # Per-project logo animations, shared with index.html
│
├── bento/
│   ├── index.html          # Bento page - header fadeUp, parallax orbs, mouse tracking
│   ├── script.js           # All bento card logic (async renderer, scroll reveal, GitHub fetch)
│   ├── style.css           # Bento-specific styles (grid layout, card variants, responsive)
│   └── assets/             # Brand SVGs and .webp images for bento cards
│
├── cv/
│   └── index.html          # CV page - embedded PDF viewer with download
│
├── contacts/
│   └── index.html          # Contacts page (noindex - QR/NFC only)
│
└── assets/                 # Global assets
    ├── logo.svg             # Vector logo (used in navbar and footer)
    ├── favicon.png          # Raster favicon (192×512px, used by manifest)
    ├── favicon.ico          # Legacy favicon (48×48)
    ├── og-image.jpg         # Open Graph preview image (auto-generated, see SEO section)
    ├── propic.webp          # Profile picture (WebP)
    └── ...
```

> There is no `bento/sitemap.xml` or `projects/sitemap.xml`. A single `sitemap.xml` at the root covers `/`, `/bento/`, `/cv/`, and `/projects/`. Don't add secondary sitemaps in subfolders.

---

## Shared `<head>` (no build step, still no duplication)

Every page is still a complete, independent HTML file - no bundler/SSG. But the boilerplate each one needs (charset/viewport, `shared.css`, Font Awesome, Google Fonts, favicons/manifest/theme-color, `components.js`+`i18n.js`) isn't hand-copied anymore. It lives once in [`partials/shared-head.html`](partials/shared-head.html) and gets synced into each page between a marker pair:

```html
<!-- SHARED-HEAD:START -->
... synced content, don't hand-edit ...
<!-- SHARED-HEAD:END -->
```

Page-specific tags (title, description, canonical, og/twitter, per-page stylesheets) live outside the markers and are never touched by the sync.

**To change the shared block:** edit `partials/shared-head.html`, then run `node scripts/sync-head.js`. [`check-head-sync.yml`](.github/workflows/check-head-sync.yml) runs the same script in `--check` mode on every push/PR, so a page that's drifted out of sync (e.g. hand-edited directly) fails CI instead of silently rotting.

`{{ROOT}}` in the partial resolves to `./` (root-level pages) or `../` (one level deep) - **except `404.html`, which always gets absolute `/`-rooted paths.** That's required, not stylistic: GitHub Pages serves `404.html`'s content for any unmatched URL while the browser keeps showing the original broken URL, so relative paths there would resolve against that URL's path, not the site root.

---

## Pages

### `index.html` - Home
Full-length scrollable portfolio: Hero → About → Projects → Skills → Experience & Education → CTA → Footer. The Projects section shows a bounded, pinned+recency-curated subset (see "Adding a New Project" below) with a link to the full list; each card has its own interactive micro-animation - see Interactive Features below.

### `projects/index.html` - Projects
Full list of every project, generated the same way as home's subset (see "Adding a New Project" below). Same card styles and logo animations as the home page's Projects section, via the shared `projects/style.css` / `projects/script.js`.

### `bento/index.html` - Bento
Grid of link cards rendered by `bento/script.js`. Card types: `github-custom` (live GitHub API data + streak-stats image, cached 1h), `solid` (branded gradient + SVG icon, i18n-able), `instagram-manual` (2×2 photo grid). Header uses a staggered `fadeUp`; cards only reveal once every async fetch has settled, so the loading spinner and the fetched content never double-flash. Hover glow (`--glow-rgb` in `bento/style.css`) is derived per-card from the same brand color already driving its background gradient (via `hexToRgb()` in `bento/script.js`), not a fixed site-wide accent - cards with no defined brand color (the Instagram photo-grid cards) fall back to the site's default accent glow.

### `cv/index.html` - CV
Embeds `assets/cvMatteoFontolan.pdf` in a responsive `<iframe>`, with Download and Open-in-new-tab buttons plus a translated text fallback for browsers without inline PDF support. Fully i18n'd.

### `contacts/index.html` - Contacts
QR/NFC-only contact page (`noindex, nofollow`) for use cases like lost-item tags: WhatsApp deep-link with pre-filled message, Telegram link, tap-to-reveal phone number, vCard download.

### `404.html` - Error page
GitHub Pages' custom 404, styled to match the site (animated orbs, gradient type). i18n'd, `noindex, nofollow`.

---

## Design System (`shared.css`)

### CSS Variables
| Variable | Purpose |
|---|---|
| `--bg-color` | Page background |
| `--card-bg` | Default card background |
| `--accent` | Primary accent colour |
| `--accent-bright` | Brighter accent for highlights and links |
| `--text-white/muted/bio/body` | Text colour hierarchy |
| `--radius` / `--radius-sm` | Border radius scale |

### Shared Components
- **`.site-nav`** - fixed top navbar with blur backdrop
- **`.card-base`** - base card style (border, hover lift, glow)
- **`.card-slug`** / **`.card-corner-icon`** - bottom-right URL label / top-right icon on cards
- **`.btn-pill`** - rounded button; variants: `.btn-primary`, `.btn-ghost`
- **`.reveal`** - scroll-triggered fade-up animation (see Interactive Features)
- **`.site-footer`** / **`.profile-header`** - shared footer layout / centred header with profile picture
- **`:focus-visible`** - keyboard navigation outline (accent colour)

### Hover & Animation Policy
All `:hover` transitions and card lift animations are wrapped in `@media (hover: hover) and (pointer: fine)`. This prevents the **"sticky hover" bug** on iOS/Android, where tapping a card leaves it permanently elevated after the finger lifts - touch devices have no hover state and must never trigger these styles.

### Reduced motion
`shared.css` neutralizes all CSS animations/transitions under `@media (prefers-reduced-motion: reduce)`. `components.js` computes `window.prefersReducedMotion` once so JS-driven motion opts out the same way: mouse parallax orbs, the RackController fan spin, EdgeCV4Safety eye-tracking, and HashCrackerz crumb particles (the latter three now live in `projects/script.js`, shared between home and `/projects/`), the hero's giant-logo scroll parallax, the hero logo's corner-trace animation, the page-transition fade, and the section-nav's smooth-scroll (falls back to an instant jump) all check this flag before starting. The `.reveal` system always ends up showing content either way - reduced motion just skips the animated fade/slide.

### Page transitions
Navigating between pages fades the current page out, then the next one in - `components.js` adds a `pt-loading` class to `<html>` synchronously (before `<body>` even exists, so there's no flash of unstyled content), removes it once the page is ready, and adds `pt-leaving` on any plain left-click to a same-origin, same-tab, same-document link before actually navigating ~160ms later. New-tab links, downloads, modified clicks (ctrl/cmd/shift), external links, and in-page `#anchor` jumps are all left alone. Deliberately opacity-only on `<body>`, not the native CSS View Transitions API or a `transform`/`filter`-based effect - both were tried and broke click-through on `position: fixed` elements (the nav bar specifically) once the page was scrolled, since those properties change the containing block for fixed descendants. See the comment above `.pt-loading`/`.pt-leaving` in `shared.css` for the full story.

Entrance and exit are intentionally asymmetric: entrance decelerates in over 260ms (a "settle" curve) while exit accelerates out over a shorter 160ms (so the click still feels instant, not sluggish) - the JS delay above is hand-kept in sync with the CSS exit duration, there's no shared constant between them.

On a fresh load or reload (as opposed to in-app navigation), `components.js` also sets `history.scrollRestoration = 'manual'` and resets scroll to the top (unless a `#hash` is present) - browsers restore the previous scroll offset on reload by default, which otherwise fights the hero's role as "the first thing you see."

---

## Internationalisation (`i18n.js`)

The site auto-detects language from `navigator.language`, defaulting to **English** for non-Italian browsers. The choice persists in `localStorage` (`jw_lang`).

### How it works
1. `i18n.js` loads in `<head>` on every page.
2. On `DOMContentLoaded`, it injects a language toggle into `.nav-links`, applies translations, and sets `document.documentElement.lang`.
3. Static elements use `data-i18n="key"` (text) or `data-i18n-html="key"` (HTML).
4. Dynamic content (bento cards) uses `window.t('key')` at render time.
5. `window.toggleLang()` re-applies translations and, on bento, clears and re-renders the grid.
6. A missing key logs `console.warn` and falls back gracefully - never `undefined` on screen.

### Adding or editing a translation
Edit the string inside the `en` or `it` object in `i18n.js` (or both). No other file needs to change.

### Key naming convention
Keys follow a `section.element` pattern:

| Prefix | Scope |
|---|---|
| `nav.*` | Navigation links |
| `hero.*` / `about.*` / `skills.*` / `cta.*` | Home page sections |
| `projects.*` / `proj.*` | Projects section and individual project cards |
| `exp.*` / `edu.*` | Experience and education |
| `home.footer_*` | Home footer |
| `bento.*` / `card.*` | Bento page header/footer / individual card titles & descriptions |
| `contacts.*` / `cv.*` / `notfound.*` | Contacts / CV / 404 pages |

### What is NOT in `i18n.js`
Hardcoded in HTML, edited there directly: tech stack pills and project tags, project year spans, proper names/social handles/email addresses, `href` attributes, decorative elements with no text content.

---

## SEO & Metadata

Every public page includes a description meta, Open Graph tags, Twitter Card tags, a canonical link, and (home page only) JSON-LD `Person` structured data. `contacts/` and `404.html` are excluded from indexing via `noindex, nofollow`; `cv/` is indexed and in `sitemap.xml`.

### Image format policy
| Asset | Format | Reason |
|---|---|---|
| Profile picture, project images | `.webp` | Smallest size, broad browser support |
| Logo in navbar/footer | `.svg` | Vector - pixel-perfect at any resolution/DPI |
| `og:image`, `apple-touch-icon` | `.jpg` / `.png` | WhatsApp, Safari, and some crawlers reject WebP |
| `favicon.ico` | `.ico` | Legacy browser compatibility |

### OG image auto-generation
`assets/og-image.jpg` is a Playwright screenshot of the homepage hero, not hand-maintained. [`og-image.yml`](.github/workflows/og-image.yml) regenerates it whenever `index.html`, `shared.css`, `i18n.js`, `components.js`, `assets/logo.svg`, or `assets/propic.webp` change on `main` (or on manual dispatch), via [`scripts/generate-og-image.js`](scripts/generate-og-image.js): a 1200×630 capture at `deviceScaleFactor: 2` with a 105% page zoom (crisper text, less empty margin than a plain 1x shot), saved at JPEG quality 100. Commits the result back (`[skip ci]`) only if it actually changed.

---

## Web App Manifest (`manifest.json`)

Enables "Add to Home Screen". App name `justwhitee - Matteo Fontolan`, short name `justwhitee`, theme colour `#00bbc9`, icons at `/favicon.ico` (48px) and `/assets/favicon.png` (192/512px). All pages link it via `<link rel="manifest">`.

---

## Interactive Features

Two mechanisms are shared across pages via `components.js` rather than reimplemented per page:
- **Mouse parallax orbs** - `initParallaxOrbs()` offsets `#orb1`/`#orb2` on `mousemove` (throttled with `requestAnimationFrame`). Used by home, bento, and contacts; no-ops on pages without those elements.
- **Scroll reveal** - `window.initScrollReveal(opts)` is a bidirectional `IntersectionObserver` with a configurable stagger, used by home and contacts. Accepts an optional `initialGrace` (home page only, 900ms) - extra delay applied only to elements already in view at page load without any scrolling. Without it, a section that happens to be visible on a short mobile screen (hero's `100vh` vs. the browser's real visible viewport) could finish its near-zero-stagger reveal transition before the hero's own longer, fixed-delay CSS entrance animations did. Scroll-triggered reveals later on are unaffected. `bento/script.js` keeps its own variant because cards can still be loading (async GitHub fetch) when the page settles - its observer only attaches after every fetch resolves, so nothing flashes in twice.

Page-specific features:

| Page | Feature | How it works |
|---|---|---|
| Home | Giant logo parallax | Hero logo drifts and fades on scroll |
| Home | Logo corner-trace | A short blurred segment traces the giant logo's actual silhouette (the two wing paths copied verbatim from `assets/logo.svg`, not a bounding box) once on load, then fades |
| Home | Section nav dots | Fixed pill nav; active dot tracks whichever section is closest to viewport centre |
| Home / Projects | Fan spin (RackController card) | `requestAnimationFrame` loop, speeds up on hover — `projects/script.js` |
| Home / Projects | Eye tracking (EdgeCV4Safety card) | SVG pupil group follows the cursor — `projects/script.js` |
| Home / Projects | Crumb particles (HashCrackerz card) | Spawned on hover, positioned from the artwork's actual alpha-channel edges so they fall from the visible cookie outline — `projects/script.js` |
| Bento | GitHub live card | Fetches `/users/:username`, cached 1h in `localStorage` to stay under the 60 req/h rate limit |
| Bento | Sibling stagger | Reveal `transitionDelay` set to `index × 60ms` (capped at 320ms) |
| Contacts | Phone reveal | Keyboard-accessible tap-to-reveal (`role="button"`, `tabindex`, `onkeydown`) |
| Contacts | vCard download | Builds a `.vcf` blob and triggers download via a temporary `<a>` |

All of the above respect `window.prefersReducedMotion` (see Reduced Motion above).

---

## Shared Components (`components.js`)

Must load **before** `i18n.js` on every page. On `DOMContentLoaded` it injects the shared nav and footer into placeholder elements:

```html
<nav id="site-nav" class="site-nav" data-active="bento"></nav>
...
<footer id="site-footer" class="site-footer" data-copy-key="bento.footer_copy"></footer>
```

- `data-active` sets which nav link gets `.active`: `home`, `projects`, `bento`, `cv`, `contacts`, or `""` (404).
- Add a nav link by editing the `NAV_LINKS` array - no per-page HTML changes needed.
- The footer email is injected here rather than written in static HTML, so Cloudflare's email obfuscation can't mangle it (see Security below).
- `window.prefersReducedMotion`, `initParallaxOrbs()`, and `window.initScrollReveal()` also live here (see Reduced Motion / Interactive Features above).

### Easter eggs 🥚
A handful of hidden easter eggs are sprinkled around the site - a console message, click-based triggers, typed sequences. Deliberately undocumented beyond that; they're all in `components.js` under `EASTER EGG` comment markers if you need to find them again.

---

## Security

### Tabnabbing protection
Every `target="_blank"` link - static and dynamically generated - sets `rel="noopener noreferrer"`, so a linked page can't reach back into the opener tab via `window.opener`.

### Email obfuscation
Cloudflare's Scrape Shield rewrites `mailto:` links it finds in static HTML. The footer email is injected at runtime by `components.js` instead, so Cloudflare never sees it in the raw HTML and can't mangle it. Any `mailto:` link added directly to an HTML file will get rewritten on the next deploy - move it into JS, or disable Scrape Shield for that page.

---

## Setup & Local Development

No build step, bundlers, or package managers required.

```bash
git clone https://github.com/itsjustwhitee/your-repo-name.git
cd your-repo-name
```

> Don't open `index.html` via `file://` - `fetch()` calls (GitHub API, streak-stats image) hit CORS errors outside `http(s)`. Serve it instead.

Recommended: `node scripts/dev-server.js [port]` (default 8080). It behaves like GitHub Pages rather than a generic static server - unmatched routes get `404.html` with a real 404 status instead of a bare connection error, and it disables all caching so edits always show up on the next reload. If the port's already in use (e.g. a previous instance still running), it exits cleanly with a message instead of crashing - safe to launch from something like a VS Code folder-open task without worrying about a second instance colliding. Plain alternatives also work fine for quick checks: VS Code's [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, or `python3 -m http.server 8000` (neither replicates the 404 behavior).

---

## Deployment & Cloudflare Configuration

Hosted on **GitHub Pages**, with **Cloudflare** as DNS/CDN/security layer.

- Any push to `main` deploys automatically - no CI build step for the site itself.
- `CNAME` binds the custom domain (`justwhitee.org`).
- GitHub Pages serves `404.html` for any unmatched URL automatically.

| Cloudflare setting | Value | Notes |
|---|---|---|
| DNS | A records → GitHub Pages IPs (or CNAME → `itsjustwhitee.github.io`) | Proxy enabled |
| SSL/TLS | Full | GitHub Pages' own Let's Encrypt cert; Cloudflare enforces end-to-end encryption |
| Scrape Shield / Email Obfuscation | Enabled | See Security above |
| Caching | Default (CDN) | Static assets cached at edge globally |

---

## Adding a New Page

1. Create a new folder (e.g. `mypage/`) with an `index.html`.
2. Add `<!-- SHARED-HEAD:START -->`/`<!-- SHARED-HEAD:END -->` markers in `<head>`, add `mypage` to the `PAGES` list in `scripts/sync-head.js` (with `root: '../'`), then run `node scripts/sync-head.js`. See "Shared `<head>`" above.
3. Add page-specific `<title>`/description/canonical/og/twitter tags right after the markers.
4. Add `<nav id="site-nav" class="site-nav" data-active="mypage"></nav>` and `<footer id="site-footer" class="site-footer" data-copy-key="home.footer_copy"></footer>` where they should appear.
5. Add the new page key to `NAV_LINKS` in `components.js` if it should appear in the navbar.
6. Add any page-specific translation keys to `i18n.js` under a new prefix.
7. Add a `<style>` block for page-specific CSS (or a separate `style.css`).
8. Add the new URL to `sitemap.xml` (unless it shouldn't be indexed).
9. Add `rel="noopener noreferrer"` to any `target="_blank"` links.

## Adding a New Project

1. Add a new entry object to the `projects` array in `projects/data.js` — see the field reference in the comment at the top of that file. Set `pinned`/`featured`/`date` as appropriate; the home page always shows every pinned project plus the most recent non-pinned ones, capped at `HOME_COUNT`.
2. For a translated badge/tagline/description, add `proj.<i18nKey>.badge` / `.tagline` / `.desc` (and `.stat1_lbl`/`.stat1_desc`/etc. if there are stat boxes) to both `en` and `it` in `i18n.js`, matching the `i18nKey` used in the data entry. The `badgeText`/`taglineText`/`descText` fields in `projects/data.js` only need the English fallback — i18n.js is the source of truth for both languages at runtime.
3. If the logo needs a custom animation beyond a plain `<img>` (see `image.mode` in `projects/data.js`'s header comment), write it in `projects/script.js`, targeting the project's `slug`-derived id(s) — the generator only knows how to emit the container, never what happens inside it.
4. Place any image asset in `assets/projects/`; `.webp` for raster, `.svg` for vector (see Image format policy above).
5. Run `node scripts/sync-projects.js` to regenerate both `index.html` and `projects/index.html`. `check-projects-sync.yml` fails CI if this step is forgotten.

## Adding a New Bento Card

1. Add a new entry object to the `bentoData` array in `bento/script.js`.
2. For a translated title/description, set `i18n_key: "yourkey"` and add `card.yourkey.title` (and optionally `.desc`) to both `en` and `it` in `i18n.js`. The builder falls back to `item.title` if the key is missing - the UI never breaks.
3. For a brand gradient, add the colour pair to the `BRAND` object in `bento/script.js`.
4. Place any SVG asset in `bento/assets/`; images as `.webp`.
