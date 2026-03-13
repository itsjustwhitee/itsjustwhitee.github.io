# Personal Website — Internal Documentation

A static personal website hosted on **GitHub Pages**, structured as a multi-page site with a shared design system. No build tools, no frameworks — just vanilla HTML, CSS, and JavaScript.

---

## Project Structure

```
/
├── index.html              # Home page
├── shared.css              # Global design system
├── i18n.js                 # Internationalisation engine (EN/IT)
├── 404.html                # Custom 404 error page
├── manifest.json           # Web App Manifest (PWA metadata)
├── sitemap.xml             # Single sitemap for all pages (covers / and /bento/)
├── robots.txt              # Crawler rules
├── favicon.ico             # Favicon (48×48)
│
├── bento/
│   ├── index.html          # Bento page
│   ├── script.js           # Bento card logic
│   ├── style.css           # Bento-specific styles
│   └── assets/             # Brand SVGs and images for bento cards
│
├── contacts/
│   └── index.html          # Contacts page (noindex — QR/NFC only)
│
└── assets/                 # Global assets
    └── ...
```

> **Note:** There is no `bento/sitemap.xml`. A single `sitemap.xml` at the root covers all pages including `/bento/`. Do not add a secondary sitemap in subfolders.

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
Grid of link cards rendered dynamically from the `bentoData` array in `bento/script.js`. Card types:
- `github-custom` — fetches live user data from the GitHub REST API and renders GitHub Streak Stats as an inline SVG
- `solid` — branded gradient card with SVG icon
- `instagram-manual` — 2×2 photo grid with overlay

### `contacts/index.html` — Contacts
Minimal contact page designed for NFC/QR use cases (e.g. lost item tags).
- **Not indexed** (`<meta name="robots" content="noindex, nofollow">`) — accessible only via QR/NFC link, not from search engines.
- Features: WhatsApp deep-link with pre-filled message, Telegram link, tap-to-reveal phone number, vCard download.

### `404.html` — Error page
Custom 404 page served automatically by GitHub Pages for any non-existent URL. Matches the site's visual style (animated orbs, gradient typography). Supports i18n via `data-i18n` attributes.

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

---

## Internationalisation (`i18n.js`)

The site auto-detects language from `navigator.language` and defaults to **English** for non-Italian browsers. The user's choice is persisted in `localStorage` under the key `jw_lang`.

### How it works
1. `i18n.js` is loaded in `<head>` (before `DOMContentLoaded`) on every page.
2. On `DOMContentLoaded`, it injects a language toggle button into `.nav-links`, applies translations to the DOM, and sets `document.documentElement.lang`.
3. Static elements use `data-i18n="key"` (plain text) or `data-i18n-html="key"` (HTML content).
4. Dynamic card content (bento) uses `window.t('key')` inside the card builder functions.
5. Clicking the toggle calls `window.toggleLang()`, which re-applies translations and, on the bento page, re-renders the grid.

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

The `contacts/` page is intentionally excluded from indexing via `<meta name="robots" content="noindex, nofollow">`.

The `404.html` page is also excluded from indexing via the same meta tag.

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
| Fan animation (RackController card) | `requestAnimationFrame` loop; speed increases on hover |
| Eye tracking (EdgeCV4Safety card) | SVG loaded via `fetch`; `#pupil-focus-group` translated on `mousemove` |
| Cookie crumbs (HashCrackerz card) | `setInterval` spawns absolutely-positioned `div.crumb` elements with CSS animation on hover |

### Bento page
| Feature | How it works |
|---|---|
| GitHub live card | `fetch` to GitHub REST API (`/users/:username`) for profile data; streak stats fetched as raw SVG from `nirzak-streak-stats.vercel.app` and injected inline — bypasses any CSS clipping |
| Card shimmer | CSS `::after` pseudo-element animation triggered on `:hover` |
| Language re-render | `loadBento()` is called again on language toggle, clearing and rebuilding the grid |

### Contacts page
| Feature | How it works |
|---|---|
| Phone reveal | Toggling `.hidden-info` class between two `.card-content` views; card uses `role="button"` + `tabindex="0"` for keyboard accessibility |
| vCard download | Programmatically creates a `.vcf` blob and triggers a download via a temporary `<a>` element |
| WhatsApp pre-fill | Message text is sourced from `window.t('contacts.wa_msg')` so it switches language with the toggle |

---

## Deployment

The site is deployed as a **static GitHub Pages site** with no build step. To update:

1. Edit files locally.
2. `git add`, `git commit`, `git push` to the `main` (or `gh-pages`) branch.
3. GitHub Pages serves the updated files automatically within a few seconds.

There are no dependencies to install, no bundlers, no environment variables.

GitHub Pages automatically serves `404.html` for any non-existent URL — no configuration required.

---

## Adding a New Page

1. Create a new folder (e.g. `mypage/`) with an `index.html`.
2. Link `../shared.css` and `../i18n.js` in `<head>`.
3. Add `<link rel="manifest" href="/manifest.json">` and `<meta name="theme-color" content="#00bbc9">` in `<head>`.
4. Copy the `.site-nav` block from an existing page; add a nav link to it across all pages.
5. Add any page-specific translation keys to `i18n.js` under a new prefix.
6. Add a `<style>` block for page-specific CSS (or a separate `style.css` in the folder).
7. Add the new URL to `sitemap.xml` in the root (unless the page should not be indexed).

## Adding a New Bento Card

1. Add a new entry object to the `bentoData` array in `bento/script.js`.
2. If the title or description should be translated, use `window.t('card.yourkey')` and add the corresponding keys to `i18n.js` under `card.*`.
3. If it uses a brand gradient, add the colour pair to the `BRAND` object in `bento/script.js`.
4. Place any required SVG asset in `bento/assets/`.