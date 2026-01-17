const bentoData = [
    {
        // GitHub
        type: "iframe",
        size: "tall",
        src: "https://github-readme-stats.vercel.app/api?username=itsjustwhitee&show_icons=true&theme=dark&hide_border=true",
    },
    {
        type: "image",
        size: "small",
        bg: "assets/logo_itsjustwhitee.png",
    },
    {
        type: "image",
        size: "wide",
        title: "Caricatures & Draws",
        desc: "Turning people into cartoons for hobby.",
        bg: "assets/justwhitee.caricature.jpg"
    },
    {
        type: "image",
        size: "wide",
        title: "Graphics & Art",
        desc: "Creating digital art since 2016 for hobby.",
        bg: "assets/justwhitee.studio.jpg"
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
        desc: "Something I do not use anymore, may be you can find something useful!",
        bg: "assets/Subito.jpg",
        link: "https://www.subito.it/utente/115681616"
    },
    {
        type: "image",
        size: "wide",
        title: "My Vinted Shop",
        desc: "...Or here...",
        bg: "assets/Vinted.jpg",
        link: "https://www.vinted.it/member/98964478-matteottf"
    },
    {
        type: "image",
        size: "wide",
        title: "My Wallapop Shop",
        desc: "...Or even here...",
        bg: "assets/Wallapop.jpg",
        link: "https://www.wallapop.com/user/matteof-452229251"
    },
    {
        type: "image",
        size: "wide",
        title: "My ebay Shop",
        desc: "...Or finally here!",
        bg: "assets/ebay.jpg",
        link: "https://ebay.us/m/cxwlKH"
    },
    {
        type: "image",
        size: "wide",
        title: "Me in private :D",
        link: "https://www.instagram.com/matteo.ttf",
        bg: "#ffffff",
    },
    {
        type: "image",
        size: "wide",
        title: "Some Notes and Resources",
        link: "https://justwhitee.notion.site/Materiali-utili-su-Notion-6d4afc02fd114ee1b65fac5ab8e25201?pvs=4",
        bg: "#ffffff",
    },
    {
        type: "image",
        size: "wide",
        title: "My amazon wishlist",
        link: "https://www.amazon.it/hz/wishlist/ls/2VEY37Y3KUVK8?ref_=wl_share",
        bg: "#ffffff",
    },
];

const grid = document.getElementById('bento-grid');

function loadBento() {
    bentoData.forEach(item => {
        // Se c'è un link, creiamo un tag 'a', altrimenti un 'div'
        const card = document.createElement(item.link ? 'a' : 'div');
        if (item.link) {
            card.href = item.link;
            card.target = "_blank"; // Apre in una nuova scheda
            card.classList.add('card-link');
        }
        
        card.classList.add('card', item.size);

        if (item.type === "image") {
            card.innerHTML = `
                <div class="card-image-bg" style="background-image: url('${item.bg}')"></div>
                <div class="overlay">
                    <h3>${item.title}</h3>
                    <p>${item.desc}</p>
                </div>
            `;
        } else if (item.type === "iframe") {
            // if item is iframe it appears here to avoid clicks
            card.innerHTML = `<div class="iframe-container"><iframe src="${item.src}"></iframe></div>`;
        }

        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', loadBento);