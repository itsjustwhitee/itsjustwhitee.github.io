// projects/data.js
//
// Single source of truth for every project card, consumed by
// scripts/sync-projects.js to generate the home page's #projects subset and
// the full list on /projects/. Node-only (CommonJS) — never shipped to the
// browser; the EN text fields below are only the pre-render/no-JS fallback,
// the real translations (EN+IT) live in i18n.js under `proj.<i18nKey>.*`.
//
// image.mode:
//   'img'         — plain <img src> with onerror->emoji-placeholder fallback
//   'svg-inject'  — empty container at id=visualId; projects/script.js fetches
//                   `fetchSrc` and injects the SVG into it
//   'spin-wrapper'— known <img src> wrapped in a <div id=visualId>;
//                   projects/script.js drives a rotation loop on that id
//
// Every card also gets id="${slug}-card" from the generator (used today by
// HashCrackerz's hover-crumb effect, free for any future project to hook).
//
// CAUTION: title/tags/descText/alt/url/etc. are interpolated into the
// generated HTML as raw strings — scripts/sync-projects.js does not escape
// them. A literal `&` or `<` in any text field must be hand-escaped
// (`&amp;`, `&lt;`) yourself, same as rackcontroller.taglineText below.

const projects = [
    {
        slug: 'edgecv4safety',
        i18nKey: 'edgecv',
        title: 'EdgeCV4Safety',
        date: '2025-10',
        yearLabel: 'apr-oct 2025',
        pinned: true,
        featured: true,
        badgeVariant: 'intern',
        badgeText: 'Internship · Thesis',
        taglineText: '🛡️ AI-Driven Contextual Safety System for Industry 5.0',
        descText: 'Modular Computer Vision system replacing physical safety barriers. Deployed on NVIDIA Jetson AGX Orin: YOLO + UniDepth/DepthAnything over ONNX Runtime, robot control via RTDE, real-time proximity awareness for Universal Robots.',
        tags: ['Python', 'ONNX', 'CUDA/TensorRT', 'YOLO', 'UniDepth', 'DepthAnything', 'RTDE', 'Docker', 'Aravis'],
        links: [
            { icon: 'fa-brands fa-github', label: 'GitHub', url: 'https://github.com/EdgeCV4Safety/EdgeCV4Safety', trailing: 'arrow-right' },
        ],
        contributors: ['Riccardo Venanzi', 'Davide Tazzioli'],
        stats: [
            { labelI18nKey: 'stat1_lbl', labelText: 'Inference', value: '~5 FPS', descI18nKey: 'stat1_desc', descText: 'on Jetson AGX Orin via TensorRT' },
            { labelI18nKey: 'stat2_lbl', labelText: 'Architecture', descI18nKey: 'stat2_desc', descText: 'Super-repo with Git Submodules: strict decoupling of Vision and Robot Control components.' },
        ],
        image: { mode: 'svg-inject', visualId: 'edgecv-container', fetchSrc: '/assets/projects/edgecv4safety.svg', placeholderEmoji: '🤖' },
    },
    {
        slug: 'hashcrackerz',
        i18nKey: 'hash',
        title: 'HashCrackerz',
        date: '2026-02',
        yearLabel: 'dec 2025 - feb 2026',
        pinned: false,
        featured: false,
        badgeText: 'MSc Course',
        taglineText: '🔓 Multi-Platform SHA-256 Parallel Cracking Suite',
        descText: 'High-performance SHA-256 cracker comparing NVIDIA CUDA, AMD ROCm/HIP, and multi-core CPU via OpenMP. Kernel optimizations include constant memory, loop unrolling, and dynamic work scheduling.',
        tags: ['C++', 'CUDA', 'ROCm/HIP', 'OpenMP', 'OpenSSL'],
        links: [
            { icon: 'fa-brands fa-github', label: 'GitHub', url: 'https://github.com/HashCrackerz', trailing: 'arrow-right' },
        ],
        contributors: ['Andrea Vitale'],
        image: { mode: 'img', src: '/assets/projects/hashcrackerz.webp', alt: 'HashCrackerz project logo', placeholderEmoji: '⚡' },
    },
    {
        slug: 'rackcontroller',
        i18nKey: 'rack',
        title: 'RackController v3.0',
        date: '2026-02',
        yearLabel: 'jan - feb 2026',
        pinned: false,
        featured: false,
        badgeText: 'Personal',
        taglineHtml: true,
        taglineText: '❄️ Smart Cooling &amp; IoT Ecosystem',
        descText: 'Custom cooling system for a DIY network rack on ESP32-S3. Decoupled: C++ REST firmware + Nginx/Docker frontend. Dynamic PWM fan control, OLED night-mode display, real-time web dashboard.',
        tags: ['C++', 'ESP32-S3', 'Docker', 'Nginx', 'HTML/JS', 'JSON'],
        links: [
            { icon: 'fa-brands fa-github', label: 'GitHub', url: 'https://github.com/itsjustwhitee/RackController', trailing: 'arrow-right' },
        ],
        image: { mode: 'spin-wrapper', visualId: 'rack-fan-wrapper', src: '/assets/projects/rackcontroller.svg', alt: 'RackController project logo', placeholderEmoji: '🖥️' },
    },
    {
        slug: 'sliceceipt',
        i18nKey: 'slice',
        title: 'SliceCeipt',
        date: '2026-07',
        yearLabel: 'jul 2026',
        pinned: false,
        featured: false,
        badgeText: 'Personal',
        taglineText: '🧾 Split Shared Receipts, Down to the Cent',
        descText: 'Mobile-first PWA for splitting a shared receipt (photo, PDF, or manual entry) among multiple people, item by item. Fully static and offline-capable: OCR and parsing run client-side, no backend, no accounts.',
        tags: ['SvelteKit', 'TypeScript', 'Vite PWA', 'Vitest'],
        links: [
            { icon: 'fa-brands fa-github', label: 'GitHub', url: 'https://github.com/itsjustwhitee/slice-ceipt', trailing: 'arrow-right' },
            { label: 'Live', url: 'https://sliceceipt.justwhitee.com', trailing: 'external' },
        ],
        image: { mode: 'svg-inject', visualId: 'sliceceipt-container', fetchSrc: '/assets/projects/sliceceipt.svg', placeholderEmoji: '🧾' },
    },
    {
        slug: 'justwhitee-notes',
        i18nKey: 'notes',
        title: 'justwhitee-notes',
        date: '2026-06',
        yearLabel: 'mar - jun 2026',
        pinned: false,
        featured: false,
        badgeText: 'Open Source',
        taglineText: '📝 A Modern Typst Template for University Notes',
        descText: 'Typst template for clean lecture notes: styled cover page, automatic table of contents, callouts and inline annotations. Published on Typst Universe, used in several course-note repos including ICCBD-notes.',
        tags: ['Typst', 'Template', 'Typography', 'AGPL-3.0'],
        links: [
            { icon: 'fa-solid fa-cube', label: 'Typst Universe', url: 'https://typst.app/universe/package/justwhitee-notes/', trailing: 'arrow-right' },
            { label: 'Example', url: 'https://github.com/itsjustwhitee/ICCBD-notes', trailing: 'external' },
        ],
        image: { mode: 'img', src: '/assets/projects/justwhitee-notes.svg', alt: 'Typst logo', placeholderEmoji: '📝' },
    },
];

module.exports = { projects: projects, HOME_COUNT: 4 };
