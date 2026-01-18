const bentoData = [
    {
        // GitHub
        type: "iframe",
        size: "wide",
        src: "https://github-readme-streak-stats.herokuapp.com/?user=justwhitee&theme=dark&background=094f4f&hide_border=true", //"https://github-readme-stats.vercel.app/api?username=itsjustwhitee&show_icons=true&theme=dark&hide_border=true",
        link: "https://github.com/itsjustwhitee"
    },
    {
        type: "image",
        size: "small",
        bg: "assets/logo_justwhitee.png",
        transparent: true
    },
    {
        type: "instagram-manual",
        size: "wide",
        title: "Caricatures & Draws",
        username: "@justwhitee.caricature",
        images: [
            "assets/justwhitee.caricature/1.png",
            "assets/justwhitee.caricature/2.png",
            "assets/justwhitee.caricature/3.png",
            "assets/justwhitee.caricature/4.png",
        ],
        link: "https://www.instagram.com/justwhitee.caricature"
    },
    {
        type: "instagram-manual",
        size: "wide",
        title: "Graphics & Art",
        username: "@justwhitee.studio",
        images: [
            "assets/justwhitee.studio/1.png",
            "assets/justwhitee.studio/2.png",
            "assets/justwhitee.studio/3.png",
            "assets/justwhitee.studio/4.png",
        ],
        link: "https://www.instagram.com/justwhitee.studio"
    },
    {
        type: "image",
        size: "wide",
        title: "Contact Me",
        desc: "If you want to collaborate, reach out here or on justwhitee.studio@gmail.com!",
        bg: "assets/writeTelegram.jpg",
        link: "https://t.me/justwhitee"
    },
    {
        type: "image",
        size: "wide",
        title: "Support Me",
        desc: "If you want to buy me a coffee or something, you can do it here!",
        bg: "assets/paypalBanner.jpg",
        link: "https://www.paypal.com/paypalme/justwhitee"
    },
    {
        type: "image",
        size: "wide",
        title: "My Subito Shop",
        //desc: "Something I do not use anymore, may be you can find something useful!",
        bg: "assets/Subito.jpg",
        link: "https://www.subito.it/utente/115681616"
    },
    {
        type: "image",
        size: "wide",
        title: "My Vinted Shop",
        //desc: "...Or here...",
        bg: "assets/Vinted.webp",
        link: "https://www.vinted.it/member/98964478-matteottf"
    },
    {
        type: "image",
        size: "wide",
        title: "My Wallapop Shop",
        //desc: "...Or even here...",
        bg: "assets/Wallapop.webp",
        link: "https://www.wallapop.com/user/matteof-452229251"
    },
    {
        type: "image",
        size: "wide",
        title: "My ebay Shop",
        //desc: "...Or finally here!",
        bg: "assets/ebay.jpg",
        link: "https://ebay.us/m/cxwlKH"
    },
    {
        type: "image",
        size: "wide",
        title: "Me in private🙈",
        link: "https://www.instagram.com/matteo.ttf",
        bg: "#094f4f",
    },
    {
        type: "image",
        size: "wide",
        title: "Some Notes and Resources🤓",
        link: "https://justwhitee.notion.site/Materiali-utili-su-Notion-6d4afc02fd114ee1b65fac5ab8e25201?pvs=4",
        bg: "#094f4f",
    },
    {
        type: "image",
        size: "wide",
        title: "My amazon wishlist✨",
        link: "https://www.amazon.it/hz/wishlist/ls/2VEY37Y3KUVK8?ref_=wl_share",
        bg: "#094f4f",
    },
];

function getIcon(link) {
    if (!link) return "";
    if (link.includes("instagram.com")) return '<i class="fa-brands fa-instagram"></i>';
    if (link.includes("telegram.me") || link.includes("t.me")) return '<i class="fa-brands fa-telegram"></i>';
    if (link.includes("paypal.me")) return '<i class="fa-brands fa-paypal"></i>';
    if (link.includes("amazon.")) return '<i class="fa-brands fa-amazon"></i>';
    if (link.includes("github.com")) return '<i class="fa-brands fa-github"></i>';
    if (link.includes("notion.site")) return '<i class="fa-solid fa-note-sticky"></i>';
    if (link.includes("vinted")) return '<i class="fa-solid fa-shirt"></i>';
    if (link.includes("ebay")) return '<i class="fa-brands fa-ebay"></i>';
    if (link.includes("subito")) return '<i class="fa-solid fa-cart-shopping"></i>';
    return '<i class="fa-solid fa-link"></i>'; // Icona di default
}

const grid = document.getElementById('bento-grid');

function loadBento() {
    bentoData.forEach(item => {
        const card = document.createElement(item.link ? 'a' : 'div');
        if (item.link) {
            card.href = item.link;
            card.target = "_blank";
            card.classList.add('card-link');
        }

        if (item.transparent) {
            card.classList.add('transparent');
        }
        
        card.classList.add('card', item.size);

        if (item.type === "image") {
            const isColor = item.bg.startsWith('#');
            const bgStyle = isColor ? `background-color: ${item.bg}` : `background-image: url('${item.bg}')`;
            const iconHtml = isColor ? `<div class="card-icon">${getIcon(item.link)}</div>` : '';
            const cornerIconHtml = (!isColor && item.link) ? `<div class="card-corner-icon">${getIcon(item.link)}</div>` : '';

            card.innerHTML = `
                <div class="card-image-bg" style="${bgStyle}"></div>
                ${cornerIconHtml}
                <div class="overlay">
                    <div class="title-row">
                        ${iconHtml}
                        <h3>${item.title || ''}</h3>
                    </div>
                    ${item.desc ? `<p>${item.desc}</p>` : ''}
                </div>
            `;
        } else if (item.type === "iframe") {
            const cornerIconHtml = item.link ? `<div class="card-corner-icon">${getIcon(item.link)}</div>` : '';
            card.innerHTML = `
            <div class="iframe-container">
                <iframe src="${item.src}"></iframe>
            </div>
            ${cornerIconHtml}
        `;
        }
        else if (item.type === "instagram-manual") {
            let photosHtml = '';
            item.images.forEach(img => {
                photosHtml += `<img src="${img}" class="ig-photo">`;
            });

            card.innerHTML = `
                <div class="ig-grid-container">
                    ${photosHtml}
                </div>
                <div class="card-corner-icon"><i class="fa-brands fa-instagram"></i></div>
                <div class="overlay">
                    <h3>${item.title}</h3>
                    <p>${item.username}</p>
                </div>
            `;
        }

        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', loadBento);