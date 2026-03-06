# Personal Website — Internal Documentation

A static personal website hosted on **GitHub Pages**, structured as a multi-page site with a shared design system. No build tools, no frameworks — just vanilla HTML, CSS, and JavaScript.

---

## Project Structure

```
/
├── index.html              # Home page
├── shared.css              # Global design system (variables, base styles, components)
├── i18n.js                 # Internationalisation engine (EN/IT)
│
├── bento/
│   ├── index.html          # Bento page
│   ├── style.css           # Bento-specific styles
│   └── assets/             # Brand SVGs and images for bento cards
│
├── contacts/
│   └── index.html          # Contacts page (with phone reveal + vCard download)
│
└── assets/                 # Global assets (logo, profile picture, project images, CV)
```

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
Grid of link cards rendered dynamically from the `bentoData` array in the page script. Card types:
- `github-custom` — fetches live data from the GitHub API
- `solid` — branded gradient card with SVG icon
- `instagram-manual` — 2×2 photo grid with overlay

### `contacts/index.html` — Contacts
Minimal contact page designed for NFC/QR use cases (e.g. lost item tags). Features:
- WhatsApp direct link with pre-filled message
- Telegram link
- Phone number reveal (hidden by default, shown on tap) with call button and vCard download

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

---

## Internationalisation (`i18n.js`)

The site auto-detects language from `navigator.language` and defaults to **English** for non-Italian browsers. The user's choice is persisted in `localStorage` under the key `jw_lang`.

### How it works
1. `i18n.js` is loaded in `<head>` (before `DOMContentLoaded`) on every page.
2. On `DOMContentLoaded`, it injects a language toggle button into `.nav-links` and applies translations to the DOM.
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

### What is NOT in `i18n.js`
The following are hardcoded in HTML and must be edited there directly:
- Tech stack pills and project tags (`<span class="tag">`)
- Project year spans
- Proper names, social handles, email addresses
- `href` attributes and external links
- Decorative/structural elements with no text content

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
| GitHub live card | Parallel `fetch` to GitHub REST API (`/users/:username` + `/events/public`); renders stats and a bar chart of recent push activity |
| Card shimmer | CSS `::after` pseudo-element animation triggered on `:hover` |
| Language re-render | `loadBento()` is called again on language toggle, clearing and rebuilding the grid |

### Contacts page
| Feature | How it works |
|---|---|
| Phone reveal | Toggling `.hidden-info` class between two `.card-content` views |
| vCard download | Programmatically creates a `.vcf` blob and triggers a download via a temporary `<a>` element |
| WhatsApp pre-fill | Message text is sourced from `window.t('contacts.wa_msg')` so it switches language with the toggle |

---

## Deployment

The site is deployed as a **static GitHub Pages site** with no build step. To update:

1. Edit files locally.
2. `git add`, `git commit`, `git push` to the `main` (or `gh-pages`) branch.
3. GitHub Pages serves the updated files automatically within a few seconds.

There are no dependencies to install, no bundlers, no environment variables.

---

## Adding a New Page

1. Create a new folder (e.g. `mypage/`) with an `index.html`.
2. Link `../shared.css` and `../i18n.js` in `<head>`.
3. Copy the `.site-nav` block from an existing page; add a nav link to it across all pages.
4. Add any page-specific translation keys to `i18n.js` under a new prefix.
5. Add a `<style>` block for page-specific CSS (or a separate `style.css` in the folder).

## Adding a New Bento Card

1. Add a new entry object to the `bentoData` array in `bento/index.html`.
2. If the title or description should be translated, add an `i18n_key` property and the corresponding keys to `i18n.js` under `card.*`.
3. If it uses a brand gradient, add the colour pair to the `BRAND` object.
4. Place any required SVG asset in `bento/assets/`.
