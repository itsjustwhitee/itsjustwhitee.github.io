// ─── BRAND DEFINITIONS ───────────────────────────────────────────────────────
const BRAND = {
    telegram:   { bgFrom: "#229ED9", bgTo: "#1575a5" },
    paypal:     { bgFrom: "#003087", bgTo: "#001a4d" },
    subito:     { bgFrom: "#f94840", bgTo: "#e93128" },
    vinted:     { bgFrom: "#00737e", bgTo: "#005c64" },
    wallapop:   { bgFrom: "#13c1ac", bgTo: "#0a9e8c" },
    ebay:       { bgFrom: "#0064d3", bgTo: "#003d83" },
    amazon:     { bgFrom: "#ffbb00", bgTo: "#e68a00" },
    notion:     { bgFrom: "#ffffff", bgTo: "#bbbbbb" },
    private_ig: { bgFrom: "#833ab4", bgTo: "#5851db" },
};

const bentoData = [
    // ── ROW 1+2: GitHub large + Telegram/PayPal stacked ──────────────────
    {
        type: "github-custom",
        size: "large",
        link: "https://github.com/itsjustwhitee",
        slug: "// github.com/itsjustwhitee",
        username: "itsjustwhitee",
    },
    {
        type: "solid", size: "wide",
        title: "Contact Me ✍️",
        desc: "Collaborations? Reach out here or at matteo.fontolan@justwhitee.org",
        svgAsset: "assets/telegram.svg", iconColor: "#fff",
        link: "https://t.me/justwhitee",
        slug: "// t.me/justwhitee", brand: "telegram",
    },
    {
        type: "solid", size: "wide",
        title: "Support Me 💰",
        desc: "Buy me a hot chocolate if you feel like it!",
        svgAsset: "assets/paypal.svg", iconColor: "#009cde",
        link: "https://www.paypal.com/paypalme/justwhitee",
        slug: "// paypal.me/justwhitee", brand: "paypal",
    },

    // ── ROW 3+4: INSTAGRAM ────────────────────────────────────────────────
    {
        type: "instagram-manual", size: "large",
        title: "Caricatures & Draws ✏️",
        username: "@justwhitee.caricature",
        images: [
            "assets/justwhitee.caricature/1.png",
            "assets/justwhitee.caricature/2.png",
            "assets/justwhitee.caricature/3.png",
            "assets/justwhitee.caricature/4.png",
        ],
        link: "https://www.instagram.com/justwhitee.caricature",
        slug: "// @justwhitee.caricature",
    },
    {
        type: "instagram-manual", size: "large",
        title: "Graphics & Art 🖱",
        username: "@justwhitee.studio",
        images: [
            "assets/justwhitee.studio/1.png",
            "assets/justwhitee.studio/2.png",
            "assets/justwhitee.studio/3.png",
            "assets/justwhitee.studio/4.png",
        ],
        link: "https://www.instagram.com/justwhitee.studio",
        slug: "// @justwhitee.studio",
    },

    // ── ROW 5: SHOPS (4 × small) ──────────────────────────────────────────
    {
        type: "solid", size: "small",
        title: "Subito",
        svgAsset: "assets/subito.svg", iconColor: "#fff",
        link: "https://www.subito.it/utente/115681616",
        slug: "// subito.it", brand: "subito",
    },
    {
        type: "solid", size: "small",
        title: "Vinted",
        svgAsset: "assets/vinted.svg", iconColor: "#fff",
        link: "https://www.vinted.it/member/98964478-matteottf",
        slug: "// vinted.it", brand: "vinted",
    },
    {
        type: "solid", size: "small",
        title: "Wallapop",
        svgAsset: "assets/wallapop.svg", iconColor: "#fff",
        link: "https://www.wallapop.com/user/matteof-452229251",
        slug: "// wallapop.com", brand: "wallapop",
    },
    {
        type: "solid", size: "small",
        title: "eBay",
        svgAsset: "assets/ebay.svg", iconColor: "#fff",
        link: "https://ebay.us/m/cxwlKH",
        slug: "// ebay.com", brand: "ebay",
    },

    // ── ROW 6: Amazon + Notion + Me in private ────────────────────────────
    {
        type: "solid", size: "small",
        title: "Amazon Wishlist ✨",
        svgAsset: "assets/amazon.svg", iconColor: "#2d2d2d",
        link: "https://www.amazon.it/hz/wishlist/ls/2VEY37Y3KUVK8?ref_=wl_share",
        slug: "// amazon.it", brand: "amazon",
    },
    {
        type: "solid", size: "small",
        title: "Notes & Resources 🤓",
        svgAsset: "assets/notion.svg", iconColor: "#2d2d2d",
        link: "https://justwhitee.notion.site/Materiali-utili-su-Notion-6d4afc02fd114ee1b65fac5ab8e25201?pvs=4",
        slug: "// notion.site", brand: "notion",
    },
    {
        type: "solid", size: "wide",
        title: "Me in private 🙈",
        svgAsset: "assets/instagram.svg", iconColor: "#fff",
        link: "https://www.instagram.com/matteo.ttf",
        slug: "// @matteo.ttf", brand: "private_ig",
    },
];

// ─── CORNER ICON HELPER ───────────────────────────────────────────────────────
function getCornerIcon(link) {
    if (!link) return "";
    const map = [
        ["instagram.com", "fa-brands fa-instagram"],
        ["t.me",          "fa-brands fa-telegram"],
        ["paypal",        "fa-brands fa-paypal"],
        ["amazon",        "fa-brands fa-amazon"],
        ["github.com",    "fa-brands fa-github"],
        ["notion",        "fa-regular fa-note-sticky"],
        ["vinted",        "fa-solid fa-tags"],
        ["ebay",          "fa-brands fa-ebay"],
        ["subito",        "fa-solid fa-tag"],
    ];
    for (const [key, cls] of map) {
        if (link.includes(key)) return `<i class="${cls}"></i>`;
    }
    return '<i class="fa-solid fa-link"></i>';
}

// ─── SOLID CARD BUILDER ───────────────────────────────────────────────────────
function makeSolidCard(card, item) {
    const b = BRAND[item.brand] || { bgFrom: "#094f4f", bgTo: "#062e2e" };
    card.style.background = `linear-gradient(145deg, ${b.bgFrom} 0%, ${b.bgTo} 100%)`;
    card.style.borderColor = "rgba(255,255,255,0.09)";

    const isSmall = item.size === "small";
    const imgSize = isSmall ? 32 : 40;
    const iconHtml = item.svgAsset
        ? `<img src="${item.svgAsset}" width="${imgSize}" height="${imgSize}" alt="" class="brand-svg" style="filter:${item.iconColor === '#fff' ? 'brightness(0) invert(1)' : buildColorFilter(item.iconColor)}">`
        : "";

    const slugHtml = item.slug ? `<span class="card-slug">${item.slug}</span>` : "";

    card.innerHTML = `
        <div class="overlay solid-overlay">
            <div class="solid-icon-wrap">${iconHtml}</div>
            <div class="card-text-group">
                <h3>${item.title || ""}</h3>
                ${item.desc ? `<p class="solid-desc">${item.desc}</p>` : ""}
            </div>
        </div>
        ${slugHtml}
    `;
}

function buildColorFilter(hex) {
    if (!hex || hex === "#fff" || hex === "#ffffff") return "brightness(0) invert(1)";
    if (hex === "#2d2d2d" || hex === "#333") return "brightness(0)";
    if (hex === "#009cde") return "brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(175deg)";
    return "none";
}

// ─── GITHUB CUSTOM CARD ───────────────────────────────────────────────────────
async function buildGithubCard(card, username) {
    card.innerHTML = `<div class="gh-loading"><i class="fa-brands fa-github gh-spinner"></i></div>`;

    try {
        const [userRes, eventsRes] = await Promise.all([
            fetch(`https://api.github.com/users/${username}`),
            fetch(`https://api.github.com/users/${username}/events/public?per_page=100`),
        ]);
        const user   = await userRes.json();
        const events = await eventsRes.json();

        const year = new Date().getFullYear();
        let commits = 0;
        const days = {};
        if (Array.isArray(events)) {
            events.forEach(e => {
                if (e.type === "PushEvent") {
                    const d = e.created_at?.slice(0, 10);
                    const n = e.payload?.commits?.length || 0;
                    commits += n;
                    if (d) days[d] = (days[d] || 0) + n;
                }
            });
        }

        const sorted = Object.entries(days).sort(([a],[b]) => a.localeCompare(b)).slice(-28);
        const maxVal = Math.max(1, ...sorted.map(([,v]) => v));
        const barsHtml = sorted.map(([date, val]) => {
            const h = Math.max(4, Math.round((val / maxVal) * 52));
            return `<div class="gh-bar" style="height:${h}px" title="${date}: ${val} commits"></div>`;
        }).join("");

        const joinYear = new Date(user.created_at).getFullYear();
        const yearsOn  = new Date().getFullYear() - joinYear;

        card.innerHTML = `
            <div class="gh-card">
                <div class="gh-header">
                    <img src="${user.avatar_url}" class="gh-avatar" alt="avatar">
                    <div class="gh-user-info">
                        <div class="gh-name">${user.name || username}</div>
                        <div class="gh-handle">@${user.login}</div>
                        ${user.location ? `<div class="gh-location"><i class="fa-solid fa-location-dot"></i> ${user.location}</div>` : ""}
                        ${user.bio ? `<div class="gh-bio">${user.bio}</div>` : ""}
                    </div>
                </div>
                <div class="gh-stats">
                    <div class="gh-stat"><span class="gh-stat-val">${user.public_repos}</span><span class="gh-stat-lbl">repos</span></div>
                    <div class="gh-stat"><span class="gh-stat-val">${user.followers}</span><span class="gh-stat-lbl">followers</span></div>
                    <div class="gh-stat"><span class="gh-stat-val">${yearsOn}y</span><span class="gh-stat-lbl">on github</span></div>
                    <div class="gh-stat"><span class="gh-stat-val">${commits}</span><span class="gh-stat-lbl">recent commits</span></div>
                </div>
                <div class="gh-graph">
                    <div class="gh-bars">${barsHtml || '<span class="gh-no-data">no recent push activity</span>'}</div>
                    <div class="gh-graph-label">last 28 days of pushes</div>
                </div>
            </div>
            <div class="card-corner-icon"><i class="fa-brands fa-github"></i></div>
        `;
    } catch (err) {
        card.innerHTML = `
            <div class="gh-error">
                <i class="fa-brands fa-github" style="font-size:2rem;opacity:.4"></i>
                <p>Could not load GitHub data</p>
            </div>
            <div class="card-corner-icon"><i class="fa-brands fa-github"></i></div>
        `;
    }
}

// ─── MAIN RENDERER ────────────────────────────────────────────────────────────
const grid = document.getElementById("bento-grid");

function loadBento() {
    bentoData.forEach(item => {
        const card = document.createElement(item.link ? "a" : "div");
        if (item.link) { card.href = item.link; card.target = "_blank"; card.classList.add("card-link"); }
        card.classList.add("card", item.size);

        if (item.type === "github-custom") {
            card.classList.add("card-github");
            card.style.background = "linear-gradient(145deg, #0d2233 0%, #0a1a28 100%)";
            card.style.borderColor = "rgba(48,130,198,0.25)";
            buildGithubCard(card, item.username);
            if (item.slug) card.insertAdjacentHTML("beforeend", `<span class="card-slug">${item.slug}</span>`);

        } else if (item.type === "solid") {
            makeSolidCard(card, item);

        } else if (item.type === "instagram-manual") {
            const photosHtml = item.images.map(src => `<img src="${src}" class="ig-photo" loading="lazy">`).join("");
            card.innerHTML = `
                <div class="ig-grid-container">${photosHtml}</div>
                <div class="card-corner-icon"><i class="fa-brands fa-instagram"></i></div>
                <div class="overlay">
                    <h3>${item.title}</h3>
                    <p>${item.username}</p>
                </div>
                ${item.slug ? `<span class="card-slug">${item.slug}</span>` : ""}
            `;
        }

        grid.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", loadBento);