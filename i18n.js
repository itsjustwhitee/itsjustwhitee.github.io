// ─── i18n.js — justwhitee · Matteo Fontolan ──────────────────────────────────
// Automatic language detection (IT/EN) with user-override toggle.
// Usage: add data-i18n="key" or data-i18n-html="key" to any static element.
// Card builders use window.t('key') for dynamic content.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
    'use strict';

    // ── DETECTION ────────────────────────────────────────────────────────────
    function detectLang() {
        const stored = localStorage.getItem('jw_lang');
        if (stored === 'en' || stored === 'it') return stored;
        const browser = (navigator.language || navigator.userLanguage || 'en')
                            .slice(0, 2).toLowerCase();
        return browser === 'it' ? 'it' : 'en';
    }

    window.currentLang = detectLang();

    // ── TRANSLATIONS ─────────────────────────────────────────────────────────
    const T = {
        en: {
            // ── Home: nav ────────────────────────────────────────────────────
            'nav.about':    '// about',
            'nav.projects': '// projects',
            'nav.skills':   '// skills',
            'nav.bento':    '// bento',

            // ── Home: hero ───────────────────────────────────────────────────
            'hero.eyebrow':      '// hello world · itsjustwhitee',
            'hero.role_tag':     'MSc Computer Engineering · Università di Bologna',
            'hero.desc':         "I build things at the intersection of software and hardware, from Edge AI systems to IoT controllers to parallel GPU algorithms. I'm a firm believer that you don't truly 'own' a system until you've understood exactly how it works under the hood.",
            'hero.btn_projects': 'View Projects',
            'hero.btn_cv':       'Curriculum',
            'hero.scroll':       'scroll',

            // ── Home: about ──────────────────────────────────────────────────
            'about.label':   '// 01 — about me',
            'about.title':   'Passionate geek,<br><span class="accent">practical engineer.</span>',
            'about.badge':   'BSc grade',
            'about.h3':      'From Corbola to...',
            'about.p1':      "I'm a Computer Engineering student at the University of Bologna (Alma Mater Studiorum), currently pursuing my Master's Degree after graduating, but I'm originally from Corbola, a small quiet town (really?) in the Rovigo province (Veneto).",
            'about.p2':      "I love digging into how things actually work and I define myself as a practical person. My journey has taken me from designing real-time safety systems for industrial robots to optimizing parallel algorithms on GPUs.",
            'about.p3_html': "When I'm not staring at a terminal, I'm likely eating sushi 🍣, or drawing caricatures or overthinking a graphic design layout 🖱️.<br> I believe <em>knowledge is worthless if it's not shared</em>.",

            // ── Home: projects ───────────────────────────────────────────────
            'projects.label':         '// 02 — projects',
            'projects.title':         'Things I\'ve <span class="accent">built.</span>',
            'projects.sub':           'Selected work from university courses, internships, and personal curiosity.',
            'projects.contrib_label': 'with',

            'proj.edgecv.badge':      'Internship · Thesis',
            'proj.edgecv.tagline':    'AI-Driven Contextual Safety System for Industry 5.0',
            'proj.edgecv.desc':       'Modular Computer Vision system replacing physical safety barriers. Deployed on NVIDIA Jetson AGX Orin: YOLO + UniDepth/DepthAnything over ONNX Runtime, robot control via RTDE, real-time proximity awareness for Universal Robots.',
            'proj.edgecv.stat1_lbl':  'Inference',
            'proj.edgecv.stat1_desc': 'on Jetson AGX Orin via TensorRT',
            'proj.edgecv.stat2_lbl':  'Architecture',
            'proj.edgecv.stat2_desc': 'Super-repo with Git Submodules — strict decoupling of Vision and Robot Control components.',

            'proj.hash.badge':   'MSc Course',
            'proj.hash.tagline': 'Multi-Platform SHA-256 Parallel Cracking Suite',
            'proj.hash.desc':    'High-performance SHA-256 cracker comparing NVIDIA CUDA, AMD ROCm/HIP, and multi-core CPU via OpenMP. Kernel optimizations include constant memory, loop unrolling, and dynamic work scheduling.',

            'proj.rack.badge':   'Personal',
            'proj.rack.tagline': 'Smart Cooling &amp; IoT Ecosystem',
            'proj.rack.desc':    'Custom cooling system for a DIY network rack on ESP32-S3. Decoupled: C++ REST firmware + Nginx/Docker frontend. Dynamic PWM fan control, OLED night-mode display, real-time web dashboard.',

            // ── Home: skills ─────────────────────────────────────────────────
            'skills.label': '// 03 — skills',
            'skills.title': 'Tech <span class="accent">stack.</span>',
            'skills.sub':   'A focused collection of technologies I learned to wield.',

            // ── Home: experience & education ─────────────────────────────────
            'exp.label':    '// 04 — experience &amp; education',
            'exp.title':    'Where I\'ve <span class="accent">been.</span>',
            'exp.col_work': 'Work',
            'exp.col_edu':  'Education',

            'exp.tutor.period':  'may 2025 — now',
            'exp.tutor.role':    'Didactic Tutor',
            'exp.tutor.company': 'Ferrara, IT',
            'exp.tutor.desc':    'Academic support for upper secondary students in Computer Science and Mathematics, with a focus on logic and problem solving.',

            'exp.birex.period':  'apr 2025 — oct 2025',
            'exp.birex.role':    'Computer Vision Engineer Intern',
            'exp.birex.company': 'BI-REX Competence Center · Bologna, IT',
            'exp.birex.desc':    'Development of the EdgeCV4Safety framework on the industrial pilot line: optimized computer vision pipelines integrated with collaborative robotics UR.',

            'edu.msc.period': 'oct 2025 — in progress',
            'edu.msc.degree': 'Master Degree<br>Computer Engineering',
            'edu.msc.school': 'Università di Bologna',
            'edu.msc.grade':  '// Real-Time Systems · Accelerated Computing and more...',

            'edu.bsc.period': 'oct 2022 — dec 2025',
            'edu.bsc.degree': 'Bachelor Degree<br>Computer Engineering',
            'edu.bsc.school': 'Università di Bologna',
            'edu.bsc.grade':  '// Grade 96/110',

            'edu.hs.period': 'sep 2017 — jul 2022',
            'edu.hs.degree': 'Scientific High School Diploma',
            'edu.hs.school': 'Liceo Galileo Galilei · Adria (RO)',
            'edu.hs.grade':  '// Grade 96/100 · Applied Sciences',

            // ── Home: CTA ────────────────────────────────────────────────────
            'cta.label': "// let's connect",
            'cta.title': 'Want to <span class="accent">work together?</span>',
            'cta.desc':  "I'm open to internships, collaborations, and interesting projects. If you have an idea or just want to chat tech, I'm always up for it.",

            // ── Home: footer ─────────────────────────────────────────────────
            'home.footer_copy': '&copy; YEAR Matteo Fontolan<br>Creative work (caricatures, illustrations, graphic design) is protected by copyright. Do not reproduce without explicit permission.<br>Code and repositories are released under <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">copyleft</a> — because knowledge is worthless if it\'s not shared.',

            // ── Bento ────────────────────────────────────────────────────────
            'bento.header_label': "// justwhitee's bento",
            'bento.bio':          'Tech enthusiast 👾 | Computer Engineering (M.Sc. WIP) 🧑‍💻 | Foodie 🍣 | Caricature &amp; Graphic Design for hobby 🖱️',
            'bento.cta':          'So, how can I help you? 😁 Feel free to ask! 💡',
            'bento.footer_copy':  '&copy; YEAR Matteo Fontolan<br>Creative work (caricatures, illustrations, graphic design) is protected by copyright. Do not reproduce without explicit permission.<br>Code, repositories and other works/assets are released under <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">copyleft</a> &mdash; because knowledge is worthless if it\'s not shared.',

            'card.telegram.title':   'Contact Me ✍️',
            'card.telegram.desc':    'Collaborations? Reach out here or at justwhitee.studio@gmail.com',
            'card.paypal.title':     'Support Me 💰',
            'card.paypal.desc':      'Buy me a hot chocolate if you feel like it!',
            'card.amazon.title':     'Amazon Wishlist ✨',
            'card.notion.title':     'Notes & Resources 🤓',
            'card.private_ig.title': 'Me in private 🙈',
            'card.caricature.title': 'Caricatures & Draws ✏️',
            'card.studio.title':     'Graphics & Art 🖱',

            // ── Contacts ─────────────────────────────────────────────────────
            'contacts.header_label': '// contacts',
            'contacts.h1':           "Hi, I'm <span>Matteo</span>!",
            'contacts.bio':          "If you're here, you found something of mine... 😅<br>You can contact me below to return it or let me know where you found it.<br>Thank you! 🙏",
            'contacts.wa.title':     'Message me on WhatsApp',
            'contacts.wa.desc':      'I reply quickly!',
            'contacts.tg.title':     'Message me on Telegram',
            'contacts.phone.title':  'Show Number',
            'contacts.phone.desc':   'Tap to unlock and call',
            'contacts.btn.call':     'Call',
            'contacts.btn.save':     'Save Contact',
            'contacts.footer_back':  '← back to bento',
            'contacts.wa_msg':       'Hi Matteo, I found something of yours! 👋',
        },
        it: {
            // ── Home: nav ────────────────────────────────────────────────────
            'nav.about':    '// chi sono',
            'nav.projects': '// progetti',
            'nav.skills':   '// competenze',
            'nav.bento':    '// bento',

            // ── Home: hero ───────────────────────────────────────────────────
            'hero.eyebrow':      '// hello world · itsjustwhitee',
            'hero.role_tag':     'Ing. Informatica Magistrale · Università di Bologna',
            'hero.desc':         "Costruisco cose tra software e hardware: dai sistemi Edge AI ai controller IoT fino agli algoritmi GPU paralleli. Sono convinto che non si conosca davvero un sistema finché non si capisce esattamente come funziona all'interno.",
            'hero.btn_projects': 'Vai ai Progetti',
            'hero.btn_cv':       'Curriculum',
            'hero.scroll':       'scorri',

            // ── Home: about ──────────────────────────────────────────────────
            'about.label':   '// 01 — chi sono',
            'about.title':   'Geek appassionato,<br><span class="accent">ingegnere pratico.</span>',
            'about.badge':   'voto triennale',
            'about.h3':      'Da Corbola a...',
            'about.p1':      "Sono uno studente di Ingegneria Informatica all'Università di Bologna (Alma Mater Studiorum), attualmente alla Magistrale, ma in realtàvengo da Corbola, un piccolo e tranquillo paesino in provincia di Rovigo (Veneto).",
            'about.p2':      "Amo capire come funzionano davvero le cose e mi considero una persona pratica. Il mio percorso mi ha portato dalla progettazione di sistemi di sicurezza real-time per robot industriali all'ottimizzazione di algoritmi paralleli su GPU.",
            'about.p3_html': "Quando non fisso un terminale, probabilmente sto mangiando sushi 🍣, disegnando caricature o rimuginando su un layout di graphic design 🖱️.<br> Credo che <em>la conoscenza non valga nulla se non viene condivisa</em>.",

            // ── Home: projects ───────────────────────────────────────────────
            'projects.label':         '// 02 — progetti',
            'projects.title':         'Cose che ho <span class="accent">costruito.</span>',
            'projects.sub':           'Lavori selezionati da corsi universitari, tirocini e curiosità personale.',
            'projects.contrib_label': 'con',

            'proj.edgecv.badge':      'Tirocinio · Tesi',
            'proj.edgecv.tagline':    'Sistema di Sicurezza Contestuale AI-Driven per Industry 5.0',
            'proj.edgecv.desc':       'Sistema modulare di Computer Vision per sostituire le barriere di sicurezza fisiche. Implementato su NVIDIA Jetson AGX Orin: YOLO + UniDepth/DepthAnything via ONNX Runtime, controllo robot via RTDE, rilevamento prossimità in tempo reale per Universal Robots.',
            'proj.edgecv.stat1_lbl':  'Inferenza',
            'proj.edgecv.stat1_desc': 'su Jetson AGX Orin via TensorRT',
            'proj.edgecv.stat2_lbl':  'Architettura',
            'proj.edgecv.stat2_desc': 'Super-repo con Git Submodules — disaccoppiamento rigoroso dei componenti Vision e Controller.',

            'proj.hash.badge':   'Corso Magistrale',
            'proj.hash.tagline': 'Suite Multi-Piattaforma per Cracking SHA-256 Parallelo',
            'proj.hash.desc':    'Cracker SHA-256 ad alte prestazioni che confronta NVIDIA CUDA, AMD ROCm/HIP e CPU multi-core via OpenMP. Ottimizzazioni kernel: constant memory, loop unrolling e scheduling dinamico del lavoro.',

            'proj.rack.badge':   'Personale',
            'proj.rack.tagline': 'Raffreddamento Intelligente &amp; Ecosistema IoT',
            'proj.rack.desc':    'Sistema di raffreddamento personalizzato per un rack di rete DIY su ESP32-S3. Architettura disaccoppiata: firmware C++ REST + frontend Nginx/Docker. Controllo PWM dinamico delle ventole, display OLED night-mode, dashboard web in tempo reale.',

            // ── Home: skills ─────────────────────────────────────────────────
            'skills.label': '// 03 — competenze',
            'skills.title': 'Tech <span class="accent">stack.</span>',
            'skills.sub':   'Una raccolta mirata di tecnologie che ho imparato a maneggiare.',

            // ── Home: experience & education ─────────────────────────────────
            'exp.label':    '// 04 — esperienza &amp; formazione',
            'exp.title':    'Dove sono <span class="accent">stato.</span>',
            'exp.col_work': 'Lavoro',
            'exp.col_edu':  'Formazione',

            'exp.tutor.period':  'mag 2025 — oggi',
            'exp.tutor.role':    'Tutor Didattico',
            'exp.tutor.company': 'Ferrara, IT',
            'exp.tutor.desc':    'Supporto accademico per studenti delle scuole superiori in Informatica e Matematica, con focus su logica e problem solving.',

            'exp.birex.period':  'apr 2025 — ott 2025',
            'exp.birex.role':    'Computer Vision Engineer Intern',
            'exp.birex.company': 'BI-REX Competence Center · Bologna, IT',
            'exp.birex.desc':    'Sviluppo del framework EdgeCV4Safety sulla linea pilota industriale: pipeline di computer vision ottimizzate integrate con la robotica collaborativa UR.',

            'edu.msc.period': 'ott 2025 — in corso',
            'edu.msc.degree': 'Laurea Magistrale<br>Ingegneria Informatica',
            'edu.msc.school': 'Università di Bologna',
            'edu.msc.grade':  '// Sistemi Real-Time · Accelerated Computing e altro...',

            'edu.bsc.period': 'ott 2022 — dic 2025',
            'edu.bsc.degree': 'Laurea Triennale<br>Ingegneria Informatica',
            'edu.bsc.school': 'Università di Bologna',
            'edu.bsc.grade':  '// Voto 96/110',

            'edu.hs.period': 'set 2017 — lug 2022',
            'edu.hs.degree': 'Diploma Scientifico',
            'edu.hs.school': 'Liceo Galileo Galilei · Adria (RO)',
            'edu.hs.grade':  '// Voto 96/100 · Scienze Applicate',

            // ── Home: CTA ────────────────────────────────────────────────────
            'cta.label': '// connettiamoci',
            'cta.title': 'Vuoi <span class="accent">collaborare?</span>',
            'cta.desc':  "Sono aperto a tirocini, collaborazioni e progetti interessanti. Se hai un'idea o vuoi semplicemente parlare di tech, sono sempre disponibile.",

            // ── Home: footer ─────────────────────────────────────────────────
            'home.footer_copy': '&copy; YEAR Matteo Fontolan<br>Le opere creative (caricature, illustrazioni, graphic design) sono protette da copyright. Non riprodurre senza permesso esplicito.<br>Codice e repository sono rilasciati sotto <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">copyleft</a> — perché la conoscenza non vale nulla se non viene condivisa.',

            // ── Bento ────────────────────────────────────────────────────────
            'bento.header_label': '// bento di justwhitee',
            'bento.bio':          'Appassionato di tech 👾 | Ingegneria Informatica (Magistrale WIP) 🧑‍💻 | Foodie 🍣 | Caricature &amp; Graphic Design per hobby 🖱️',
            'bento.cta':          'Come posso esserti utile? 😁 Chiedi pure! 💡',
            'bento.footer_copy':  '&copy; YEAR Matteo Fontolan<br>Le opere creative (caricature, illustrazioni, graphic design) sono protette da copyright. Non riprodurre senza permesso esplicito.<br>Codice, repository e altri lavori/asset sono rilasciati sotto <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">copyleft</a> &mdash; perché la conoscenza non vale nulla se non viene condivisa.',

            'card.telegram.title':   'Contattami ✍️',
            'card.telegram.desc':    'Collaborazioni? Scrivimi qui o a justwhitee.studio@gmail.com',
            'card.paypal.title':     'Supportami 💰',
            'card.paypal.desc':      'Offrimi una cioccolata calda se ti va!',
            'card.amazon.title':     'Whishlist Amazon ✨',
            'card.notion.title':     'Appunti & Risorse 🤓',
            'card.private_ig.title': 'Io in privato 🙈',
            'card.caricature.title': 'Caricature & Disegni ✏️',
            'card.studio.title':     'Grafica & Arte 🖱',

            // ── Contacts ─────────────────────────────────────────────────────
            'contacts.header_label': '// contatti',
            'contacts.h1':           'Ciao, sono <span>Matteo</span>!',
            'contacts.bio':          "Se sei qui, hai trovato qualcosa di mio... 😅<br>Puoi contattarmi qui sotto per restituirmelo o farmi sapere dove l'hai trovato.<br>Grazie! 🙏",
            'contacts.wa.title':     'Scrivimi su WhatsApp',
            'contacts.wa.desc':      'Rispondo subito!',
            'contacts.tg.title':     'Scrivimi su Telegram',
            'contacts.phone.title':  'Mostra Numero',
            'contacts.phone.desc':   'Tocca per sbloccare e chiamare',
            'contacts.btn.call':     'Chiama',
            'contacts.btn.save':     'Salva Contatto',
            'contacts.footer_back':  '← torna al bento',
            'contacts.wa_msg':       'Ciao Matteo, ho trovato il tuo oggetto! 👋',
        }
    };

    // ── PUBLIC TRANSLATOR ────────────────────────────────────────────────────
    window.t = function (key) {
        const lang = T[window.currentLang] || T.en;
        return lang[key] !== undefined ? lang[key] : (T.en[key] !== undefined ? T.en[key] : key);
    };

    // ── APPLY TRANSLATIONS TO STATIC DOM ────────────────────────────────────
    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const val = window.t(el.getAttribute('data-i18n'));
            if (val) el.textContent = val;
        });
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            let val = window.t(el.getAttribute('data-i18n-html'));
            if (val) el.innerHTML = val.replace('YEAR', new Date().getFullYear());
        });
        document.documentElement.lang = window.currentLang;
        const btn = document.getElementById('jw-lang-toggle');
        if (btn) btn.textContent = window.currentLang === 'it' ? 'EN' : 'IT';
    }

    // ── PUBLIC: TOGGLE ───────────────────────────────────────────────────────
    window.toggleLang = function () {
        window.currentLang = window.currentLang === 'it' ? 'en' : 'it';
        localStorage.setItem('jw_lang', window.currentLang);
        applyTranslations();
        const grid = document.getElementById('bento-grid');
        if (grid && typeof loadBento === 'function') {
            grid.innerHTML = '';
            loadBento();
        }
    };

    // ── INJECT TOGGLE BUTTON INTO NAV ────────────────────────────────────────
    function injectToggle() {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks || document.getElementById('jw-lang-toggle')) return;
        const li  = document.createElement('li');
        const btn = document.createElement('button');
        btn.id          = 'jw-lang-toggle';
        btn.textContent = window.currentLang === 'it' ? 'EN' : 'IT';
        btn.title       = 'Switch language / Cambia lingua';
        btn.setAttribute('onclick', 'toggleLang()');
        btn.style.cssText = [
            'background:none',
            'border:1px solid rgba(0,187,201,0.38)',
            'color:var(--accent-bright)',
            'cursor:pointer',
            'font-family:\'JetBrains Mono\',monospace',
            'font-size:0.67rem',
            'letter-spacing:0.1em',
            'padding:3px 9px',
            'border-radius:6px',
            'transition:background 0.2s,color 0.2s',
            'line-height:1.6',
        ].join(';');
        btn.addEventListener('mouseenter', function () {
            this.style.background = 'rgba(0,187,201,0.12)';
            this.style.color      = '#fff';
        });
        btn.addEventListener('mouseleave', function () {
            this.style.background = 'none';
            this.style.color      = 'var(--accent-bright)';
        });
        li.appendChild(btn);
        navLinks.appendChild(li);
    }

    // ── INIT ─────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        injectToggle();
        applyTranslations();
    });

})();
