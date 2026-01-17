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
    }



    {
        type: "image",
        size: "wide",
        title: "Caricatures & Art",
        desc: "Turning people into cartoons since 2018.",
        bg: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800", // Sostituisci con le tue immagini
    },
    {
        type: "iframe",
        size: "tall",
        // Esempio GitHub: Puoi usare github-readme-stats o simili
        src: "https://github-readme-stats.vercel.app/api?username=TUO-USERNAME&show_icons=true&theme=dark&hide_border=true",
    },
    {
        type: "image",
        size: "small",
        title: "Foodie Life",
        desc: "Always hunting for the best sushi.",
        bg: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    },
    {
        type: "iframe",
        size: "large",
        // Esempio: Un post di Instagram (usa l'URL embed di IG o una pagina web)
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Esempio YouTube, sostituisci con IG embed
    },
    {
        type: "image",
        size: "tall",
        title: "Software Engineering",
        desc: "Master's WIP - Building complex systems.",
        bg: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500",
    },
    {
        type: "image",
        size: "wide",
        title: "Contact Me",
        desc: "Let's build something together!",
        bg: "#007aff", // Puoi usare anche un colore solido invece di un'immagine
    }
];

const grid = document.getElementById('bento-grid');

function loadBento() {
    bentoData.forEach(item => {
        const card = document.createElement('div');
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
            card.innerHTML = `<iframe src="${item.src}"></iframe>`;
        }

        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', loadBento);