# Personal Website — Internal Documentation

A static personal website hosted on **GitHub Pages** with Cloudflare as CDN and DNS provider. No build tools, no frameworks — just vanilla HTML, CSS, and JavaScript.

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
├── sitemap.xml             # Single sitemap for all pages (covers / and /bento/)
├── robots.txt              # Crawler rules
├── favicon.ico             # Favicon (48×48)
├── CNAME                   # Custom domain binding for GitHub Pages
│
├── bento/
│   ├── index.html          # Bento page — header fadeUp, parallax orbs, mouse tracking
│   ├── script.js           # All bento card logic (async renderer, scroll reveal, GitHub fetch)
│   ├── style.css           # Bento-specific styles (grid layout, card variants, responsive)
│   └── assets/             # Brand SVGs and .webp images for bento cards
│
├── cv/
│   └── index.html          # CV page — embedded PDF viewer with download
│
├── contacts/
│   └── index.html          # Contacts page (noindex — QR/NFC only)
│
└── assets/                 # Global assets
    ├── logo.svg             # Vector logo (used in navbar and footer)
    ├── favicon.png          # Raster favicon (192×512px, used by manifest)
    ├── favicon.ico          # Legacy favicon (48×48)
    ├── og-image.jpg         # Open Graph preview image (1200×630, kept as JPG)
    ├── propic.webp          # Profile picture (WebP)
    └── ...
```

> **Note:** There is no `bento/sitemap.xml`. A single `sitemap.xml` at the root covers all indexed pages: `/`, `/bento/`, and `/cv/`. Do not add secondary sitemaps in subfolders.

---

## Pages

### `index.html` — Home
Full-length scrollable portfolio page. Sections in order:
- **Hero** — name, role tag, description, CTA buttons
- **About** — photo, bio paragraphs, social links
- **Projects** — project cards (featured + regular); each card has interactive micro-animations
- **Skills** — grouped tech stack pills
- **Experience & Education** — timeline + edu grid
- **CTA** — contact call-to-action
- **Footer**

### `bento/index.html` — Bento
Grid of link cards. Card logic lives in `bento/script.js` (async renderer, scroll reveal observer, GitHub fetch). Card types:
- `github-custom` — fetches live user data from the GitHub REST API (cached 1h in `localStorage`) and renders GitHub Streak Stats as an image
- `solid` — branded gradient card with SVG icon; supports `i18n_key` for translated title/desc
- `instagram-manual` — 2×2 photo grid with overlay; images in `.webp` format

**Entry animation:** the header uses staggered `fadeUp` (photo → label → h1 → bio → cta). Cards use the shared `.reveal` + `IntersectionObserver` system — the observer is only activated after all card DOM (including the async GitHub fetch) is fully painted, preventing a double-flash where the spinner would animate in first and the fetched content would pop in separately.


### `cv/index.html` — CV
Dedicated page for the Curriculum Vitae.
- Embeds `assets/cvMatteoFontolan.pdf` in a full-width `<iframe>` (80vh, responsive).
- Two action buttons: **Download CV** (forces download via `download` attribute) and **Open in new tab** (standard link).
- Falls back gracefully if the browser does not support inline PDFs: a translated link is shown inside `<iframe>`.
- Fully i18n'd via `cv.*` keys; the page title, subtitle, button labels, and footer link all switch language.
- Linked from the home page hero button and the nav on all pages.

### `contacts/index.html` — Contacts
Minimal contact page designed for NFC/QR use cases (e.g. lost item tags).
- **Not indexed** (`<meta name="robots" content="noindex, nofollow">`) — accessible only via QR/NFC link.
- Features: WhatsApp deep-link with pre-filled message, Telegram link, tap-to-reveal phone number, vCard download.
- **Entry animation:** header uses staggered `fadeUp`; action cards use `.reveal` + `IntersectionObserver` with 100ms sibling stagger. Parallax orbs match homepage style.

### `404.html` — Error page
Custom 404 page served automatically by GitHub Pages for any non-existent URL. Matches the site's visual style (animated orbs, gradient typography). Supports i18n via `data-i18n` attributes. Also excluded from indexing via `noindex, nofollow`.

---

## Design System (`shared.css`)

All pages share a common set of CSS variables, base styles, and reusable components defined in `shared.css`.

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
- **`.site-nav`** — fixed top navbar with blur backdrop
- **`.card-base`** — base card style (border, hover lift, shimmer animation)
- **`.card-slug`** — bottom-right URL label on cards
- **`.card-corner-icon`** — top-right icon on cards
- **`.btn-pill`** — rounded button; variants: `.btn-primary`, `.btn-ghost`
- **`.reveal`** — scroll-triggered fade-up animation (managed by IntersectionObserver in each page's script)
- **`.site-footer`** — shared footer layout
- **`.profile-header`** — centred header with profile picture
- **`:focus-visible`** — keyboard navigation outline (accent colour)

### Hover & Animation Policy
All `:hover` transitions and card lift animations are wrapped inside:
```css
@media (hover: hover) and (pointer: fine) { ... }
```
This prevents the **"sticky hover" bug** on iOS and Android, where tapping a card leaves it permanently elevated or highlighted after the finger lifts. Touch devices don't have a hover state and must never trigger these styles.

### Reduced motion
`shared.css` neutralizes all CSS animations/transitions site-wide under `@media (prefers-reduced-motion: reduce)` (the standard `animation-duration/transition-duration: 0.01ms !important` pattern), and `components.js` computes `window.prefersReducedMotion` once so JS-driven continuous motion opts out the same way: the mouse parallax orbs, the RackController fan spin loop, the EdgeCV4Safety eye-tracking, the HashCrackerz crumb particles, the homepage giant-logo scroll parallax, and the section-nav's smooth-scroll (falls back to an instant jump) all check this flag before starting. The `.reveal` scroll-in system is unaffected either way — content still always ends up visible (via the IntersectionObserver, or the 2s hard-fallback in `initScrollReveal`), just without the animated fade/slide.

---

## Internationalisation (`i18n.js`)

The site auto-detects language from `navigator.language` and defaults to **English** for non-Italian browsers. The user's choice is persisted in `localStorage` under the key `jw_lang`.

### How it works
1. `i18n.js` is loaded in `<head>` (before `DOMContentLoaded`) on every page.
2. On `DOMContentLoaded`, it injects a language toggle button into `.nav-links`, applies translations to the DOM, and sets `document.documentElement.lang`.
3. Static elements use `data-i18n="key"` (plain text) or `data-i18n-html="key"` (HTML content).
4. Dynamic card content (bento) uses `window.t('key')` inside the card builder functions.
5. Clicking the toggle calls `window.toggleLang()`, which re-applies translations and, on the bento page, clears and re-renders the entire grid.
6. Missing translation keys emit a `console.warn` — the UI always falls back gracefully and never shows `undefined` on screen.

### Adding or editing a translation
Open `i18n.js` and edit the string inside the `en` or `it` object (or both). No other file needs to change.

```js
// Example: update the hero description in English
'hero.desc': 'Your new description here.',
```

### Key naming convention
Keys follow a `section.element` pattern:

| Prefix | Scope |
|---|---|
| `nav.*` | Navigation links |
| `hero.*` | Home hero section |
| `about.*` | About section |
| `projects.*` / `proj.*` | Projects section and individual project cards |
| `skills.*` | Skills section |
| `exp.*` / `edu.*` | Experience and education |
| `cta.*` | Call-to-action section |
| `home.footer_*` | Home footer |
| `bento.*` | Bento page header and footer |
| `card.*` | Bento card titles and descriptions |
| `contacts.*` | Contacts page |
| `cv.*` | CV page |
| `notfound.*` | 404 page |

### What is NOT in `i18n.js`
The following are hardcoded in HTML and must be edited there directly:
- Tech stack pills and project tags (`<span class="tag">`)
- Project year spans
- Proper names, social handles, email addresses
- `href` attributes and external links
- Decorative/structural elements with no text content

---

## SEO & Metadata

Every public page (`index.html`, `bento/index.html`) includes:
- `<meta name="description">` — page description for search engines
- **Open Graph** tags (`og:title`, `og:description`, `og:image`, `og:url`) — controls link previews on WhatsApp, Telegram, LinkedIn, etc.
- **Twitter Card** tags — controls previews on X/Twitter
- `<link rel="canonical">` — prevents duplicate content issues
- **JSON-LD structured data** (`@type: Person`) on the home page — helps Google associate social profiles with the site

The `contacts/` page and `404.html` are intentionally excluded from indexing via `<meta name="robots" content="noindex, nofollow">`. The `cv/` page is indexed and included in `sitemap.xml`.

### Image format policy
| Asset | Format | Reason |
|---|---|---|
| Profile picture, project images | `.webp` | Smallest size, broad browser support |
| Logo in navbar/footer | `.svg` | Vector — pixel-perfect at any resolution/DPI |
| `og:image`, `apple-touch-icon` | `.jpg` / `.png` | WhatsApp, Safari, and some crawlers reject WebP |
| `favicon.ico` | `.ico` | Legacy browser compatibility |

### OG image auto-generation
`assets/og-image.jpg` is not hand-maintained — it's a Playwright screenshot of the homepage hero (English), regenerated automatically by [`.github/workflows/og-image.yml`](.github/workflows/og-image.yml) whenever `index.html`, `shared.css`, `i18n.js`, `components.js`, `assets/logo.svg`, or `assets/propic.webp` change on `main` (or on demand via the Actions tab → "Run workflow"). The workflow serves the site locally and runs [`scripts/generate-og-image.js`](scripts/generate-og-image.js), which captures the 1200×630 viewport at `deviceScaleFactor: 2` and a 105% page zoom (crisper text, fewer empty margins than a plain 1x capture) and saves at JPEG quality 100. It commits the result back (`[skip ci]`) only if the image actually changed. To change the crop, zoom, or quality, edit that script directly.

---

## Web App Manifest (`manifest.json`)

Enables "Add to Home Screen" on mobile browsers. When installed:
- App name: `justwhitee — Matteo Fontolan`
- Short name: `justwhitee`
- Theme colour: `#00bbc9`
- Icons: `/favicon.ico` (48px) and `/assets/favicon.png` (192px, 512px)

All pages include `<link rel="manifest" href="/manifest.json">` in `<head>`.

---

## Interactive Features

### Home page
| Feature | How it works |
|---|---|
| Scroll reveal | `IntersectionObserver` on `.reveal` elements; bidirectional (fades out on scroll up) |
| Giant logo parallax | CSS transform on scroll via `window.addEventListener('scroll')` |
| Mouse parallax orbs | Two fixed `.parallax-orb` divs offset via `mousemove` |
| Nav active state | Section `offsetTop` tracking on scroll |
| Section nav (vertical dots) | Fixed right-side pill nav; active dot tracks whichever section centre is closest to viewport centre via `scroll` + `requestAnimationFrame`; hover expands pill with label; click flashes label for 600ms then collapses |
| Fan animation (RackController card) | `requestAnimationFrame` loop; speed increases on hover |
| Eye tracking (EdgeCV4Safety card) | SVG loaded via `fetch`; `#pupil-focus-group` translated on `mousemove` |
| Cookie crumbs (HashCrackerz card) | `setInterval` spawns absolutely-positioned `div.crumb` elements with CSS animation on hover |

### Bento page
| Feature | How it works |
|---|---|
| Header entry animation | Staggered `fadeUp` on profile pic, label, h1, bio, cta (delays 0.1s–0.7s) |
| Card scroll reveal | `.reveal` + `IntersectionObserver`; observer starts only after `Promise.allSettled` on all GitHub fetches + one `requestAnimationFrame`, so every card is fully rendered before any animation fires |
| Sibling stagger | Each card's `transitionDelay` is set to `index × 60ms` (capped at 320ms) at observe time |
| Mouse parallax orbs | Two fixed `#orb1`/`#orb2` divs offset via `mousemove` + `requestAnimationFrame` (throttled) |
| GitHub live card | `fetch` to GitHub REST API (`/users/:username`) for profile data; result cached in `localStorage` for 1 hour (with `try/catch` for restrictive browsers) to avoid rate-limiting (HTTP 403 after 60 req/h); streak stats served as an image from `streak-stats.demolab.com` |
| i18n card titles | `makeSolidCard` and instagram cards read `window.t('card.{i18n_key}.title')` at render time; fallback to hardcoded `item.title` if key is missing, never `undefined` |
| Card shimmer | CSS `::after` pseudo-element animation triggered on `:hover` (desktop only via `@media (hover: hover)`) |
| Language re-render | `grid.innerHTML = ""` + `loadBento()` called again on language toggle; reveal observer is reconnected after the new render completes |
| Security | All dynamically created `<a target="_blank">` elements have `rel="noopener noreferrer"` set via `card.rel` in JS |

### Contacts page
| Feature | How it works |
|---|---|
| Header entry animation | Staggered `fadeUp` (same pattern as bento) |
| Card scroll reveal | `.reveal` + `IntersectionObserver` with 100ms sibling stagger |
| Mouse parallax orbs | Same implementation as homepage and bento |
| Phone reveal | Toggling `.hidden-info` class between two `.card-content` views; card uses `role="button"` + `tabindex="0"` + `onkeydown` for full keyboard accessibility; attributes removed after unlock |
| vCard download | Programmatically creates a `.vcf` blob and triggers a download via a temporary `<a>` element |
| WhatsApp pre-fill | Message text is sourced from `window.t('contacts.wa_msg')` so it switches language with the toggle |


---

## Shared Components (`components.js`)

`components.js` lives at the site root and must be loaded **before** `i18n.js` on every page. It registers a `DOMContentLoaded` handler that injects the shared nav and footer into placeholder elements.

### How it works
1. Reads `document.currentScript.src` to compute `rootUrl` — the absolute path to the site root. This makes all asset paths work under `file://`, Live Server, and production without any hardcoded paths.
2. Builds the nav from a `NAV_LINKS` array and injects it into `<nav id="site-nav" data-active="...">`.
3. Builds a unified full footer (logo, name, copyright copy, GitHub/email/LinkedIn links) and injects it into `<footer id="site-footer" data-copy-key="...">`.
4. Because it runs before `i18n.js`'s handler, `.nav-links` already exists when `i18n.js` appends the language toggle.

### Page markup
Each page needs two placeholder elements:
```html
<nav id="site-nav" class="site-nav" data-active="bento"></nav>
...
<footer id="site-footer" class="site-footer" data-copy-key="bento.footer_copy"></footer>
```

`data-active` controls which nav link gets the `.active` class. Valid values: `home`, `bento`, `cv`, `contacts`, `""` (404).

### Adding a new nav link
Edit the `NAV_LINKS` array at the top of `components.js` — no HTML changes required across pages.

### Email addresses in the footer
The footer email is a plain `mailto:` string inside `components.js` (not in static HTML). Cloudflare's email obfuscation only rewrites static HTML, so the address is never mangled during deployment.

### Easter eggs 🥚
There are a handful of hidden easter eggs sprinkled around the site — a console message, a couple of click-based triggers, a typed sequence or two. Deliberately undocumented here beyond that. Good hunting! If you're the one maintaining this and genuinely need to find them again, they're all in `components.js` under the `EASTER EGG` comment markers.

---

## Security

### Tabnabbing protection
All links with `target="_blank"` include `rel="noopener noreferrer"` — both in static HTML and in dynamically generated elements in `script.js` (`card.rel = "noopener noreferrer"`). This prevents third-party pages from accessing or hijacking the opener tab via `window.opener`.

### Email obfuscation
Cloudflare's **Scrape Shield / Email Obfuscation** feature is enabled on the domain and rewrites `mailto:` links found in static HTML. To prevent mangling, the contact email in the footer is injected by `components.js` at runtime (not present in the raw HTML), so Cloudflare never sees it. If you add any `mailto:` links directly to HTML files, be aware they will be rewritten by Cloudflare on every deploy — either move them into JS or disable the feature for that page.

---

## Setup & Local Development

This project requires **no build step**, bundlers, or package managers.

```bash
git clone https://github.com/itsjustwhitee/your-repo-name.git
cd your-repo-name
```

> **Important:** Do not open `index.html` directly via `file://`. The site uses `fetch()` for external resources (GitHub API, streak stats image), which triggers CORS errors under the `file://` protocol. Always use a local web server. For instance:
>
> - **VS Code** — install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension and click "Go Live"
> - **Python** — run `python3 -m http.server 8000` and open `http://localhost:8000`

---

## Deployment & Cloudflare Configuration

The site is hosted on **GitHub Pages** with **Cloudflare** as DNS provider, CDN, and security layer.

### GitHub Pages
- Any `git push` to the `main` branch triggers the default GitHub Pages workflow — changes go live in seconds.
- The `CNAME` file in the repository root binds the custom domain (`justwhitee.org`) to GitHub's servers.
- GitHub Pages automatically serves `404.html` for any non-existent URL — no configuration required.

### Cloudflare Settings
| Setting | Value | Notes |
|---|---|---|
| DNS | A records → GitHub Pages IPs (or CNAME → `itsjustwhitee.github.io`) | Proxy enabled |
| SSL/TLS | Full | GitHub Pages provisions its own Let's Encrypt cert; Cloudflare ensures strict end-to-end encryption |
| Scrape Shield / Email Obfuscation | Enabled | Protects email addresses from spam bots (see Security section) |
| Caching | Default (CDN) | WebP images and static assets cached at edge globally |

---

## Adding a New Page

1. Create a new folder (e.g. `mypage/`) with an `index.html`.
2. Link `../shared.css` and `../i18n.js` in `<head>`.
3. Add `<link rel="manifest" href="/manifest.json">` and `<meta name="theme-color" content="#00bbc9">` in `<head>`.
4. Add `<nav id="site-nav" class="site-nav" data-active="mypage"></nav>` where the navbar should appear.
5. Add `<footer id="site-footer" class="site-footer" data-copy-key="home.footer_copy"></footer>` where the footer should appear.
6. Add the new page key to `NAV_LINKS` in `components.js` if it should appear in the navbar.
7. Add any page-specific translation keys to `i18n.js` under a new prefix.
8. Add a `<style>` block for page-specific CSS (or a separate `style.css` in the folder).
9. Add the new URL to `sitemap.xml` in the root (unless the page should not be indexed).
10. Add `rel="noopener noreferrer"` to any `target="_blank"` links.

## Adding a New Bento Card

1. Add a new entry object to the `bentoData` array in `bento/script.js`.
2. If the title or description should be translated, set `i18n_key: "yourkey"` and add `card.yourkey.title` (and optionally `card.yourkey.desc`) to both `en` and `it` in `i18n.js`. The builder falls back to `item.title` if the key is missing — the UI will never break.
3. If it uses a brand gradient, add the colour pair to the `BRAND` object in `bento/script.js`.
4. Place any required SVG asset in `bento/assets/` and any images as `.webp`.