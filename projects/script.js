/* ═══════════════════════════════════════════════════════════════════════
   projects/script.js — justwhitee · Matteo Fontolan
   Per-project logo animations, shared by index.html (home) and
   projects/index.html (full list). Each block targets a specific project's
   stable id (see projects/data.js's `image.visualId` / generated
   `${slug}-card`) and safely no-ops if that project isn't present on the
   current page. Placed at the end of <body> like index.html's own inline
   script, so the DOM already exists — no DOMContentLoaded wrapper needed.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
// ── FLUID FAN ROTATION - RACKCONTROLLER ──
const fanWrapper = document.getElementById('rack-fan-wrapper');

if (fanWrapper && !window.prefersReducedMotion) {
    const projectCard = fanWrapper.closest('.project-card');
    const BASE_SPEED = 0.7;
    const MAX_SPEED  = 1.8;
    let currentAngle = 0;
    let currentSpeed = BASE_SPEED;
    let targetSpeed = BASE_SPEED;
    projectCard.addEventListener('mouseenter', () => {
        if (projectCard.closest('.circuit-popup, .circuit-window')) return;
        targetSpeed = MAX_SPEED;
    });
    projectCard.addEventListener('mouseleave', () => {
        if (projectCard.closest('.circuit-popup, .circuit-window')) return;
        targetSpeed = BASE_SPEED;
    });
    function spinFan() {
        currentSpeed += (targetSpeed - currentSpeed) * 0.05;
        currentAngle += currentSpeed;
        fanWrapper.style.transform = `rotate(${currentAngle}deg)`;
        requestAnimationFrame(spinFan);
    }
    requestAnimationFrame(spinFan);
}

// ── LOADING AND EYE TRACKING EDGECV4SAFETY ──
const edgeContainer = document.getElementById('edgecv-container');

if (edgeContainer) {
    fetch(edgeContainer.dataset.svgSrc)
        .then(response => response.text())
        .then(svgCode => {
            edgeContainer.innerHTML = svgCode;
            const edgeSvg = edgeContainer.querySelector('svg');
            edgeSvg.classList.add('project-img');
            initEyeTracking(edgeSvg);
        })
        .catch(err => console.error("Errore nel caricamento del logo EdgeCV: ", err));
}

const sliceContainer = document.getElementById('sliceceipt-container');

if (sliceContainer) {
    fetch(sliceContainer.dataset.svgSrc)
        .then(response => response.text())
        .then(svgCode => {
            sliceContainer.innerHTML = svgCode;
            const sliceSvg = sliceContainer.querySelector('svg');
            sliceSvg.classList.add('project-img');
        })
        .catch(err => console.error("Errore nel caricamento del logo SliceCeipt: ", err));
}

function initEyeTracking(edgeSvg) {
    const pupilGroup = document.getElementById('pupil-focus-group');
    if (!pupilGroup || window.prefersReducedMotion) return;

    // Still off inside the circuit's hover popup (a fly-by preview) — on
    // again inside .circuit-window (a click deliberately opens the real
    // card, not a clone). The circuit's own small node icon is a separate
    // injected SVG instance (initEdgeCVExcite in circuit.js) with its own
    // excite-driven random jump, unaffected by this.
    let ticking = false;
    window.addEventListener('mousemove', (e) => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            if (edgeSvg.closest('.circuit-popup')) return;
            const rect = edgeSvg.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = (e.clientX - centerX) / (window.innerWidth / 2);
            const dy = (e.clientY - centerY) / (window.innerHeight / 2);

            const movementLimitX = 120;
            const movementLimitY = 100;
            const offsetX = 30;
            const tx = (dx * movementLimitX) - offsetX;
            const ty = dy * movementLimitY;
            pupilGroup.style.transform = `translate(${tx}px, ${ty}px)`;
        });
    }, { passive: true });
    const edgeCard = edgeSvg.closest('.project-card');
    if (edgeCard) {
        edgeCard.addEventListener('mouseleave', () => {
            pupilGroup.style.transform = `translate(0px, 0px)`;
        });
    }
}

const crackerCard = document.getElementById('hashcrackerz-card');
const crackerImg = crackerCard ? crackerCard.querySelector('.project-img') : null;
const imgWrap = crackerCard ? crackerCard.querySelector('.project-img-wrap') : null;
if (crackerCard && crackerImg && imgWrap && !window.prefersReducedMotion) {
    let intervalId = null;
    let edgePoints = null; // [{xPct,yPct}, ...] real silhouette-edge pixels of the cookie art, lazily computed once

    // Reads the actual artwork's pixels (via an offscreen canvas) and keeps only
    // the ones sitting right on the edge of the drawn cookie (opaque pixel with
    // a transparent neighbor) — so crumbs spawn exactly where the cookie's own
    // outline is, instead of a guessed rectangle that may land on empty space.
    // Runs once (cached), same-origin image, so this is a one-off ~cheap scan.
    function computeEdgePoints() {
        const w = crackerImg.naturalWidth, h = crackerImg.naturalHeight;
        if (!w || !h) return [];
        try {
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(crackerImg, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;
            const alphaAt = (x, y) => data[(y * w + x) * 4 + 3];
            const step = 2;
            const points = [];
            for (let y = step; y < h - step; y += step) {
                for (let x = step; x < w - step; x += step) {
                    if (alphaAt(x, y) < 80) continue;
                    if (alphaAt(x - step, y) < 40 || alphaAt(x + step, y) < 40 ||
                        alphaAt(x, y - step) < 40 || alphaAt(x, y + step) < 40) {
                        points.push({ xPct: x / w, yPct: y / h });
                    }
                }
            }
            return points;
        } catch (e) {
            return []; // e.g. tainted canvas on file:// — fall back below
        }
    }

    // `.project-img` uses object-fit:contain in a box that isn't the same aspect
    // ratio as the (square) source image, so the rendered artwork is letterboxed
    // (centered, with empty strip left/right or top/bottom) inside the element's
    // own box. Edge-point percentages are relative to the artwork itself, so they
    // must be mapped against that inner content rect, not the full element box.
    function getContentRect(rectImg, naturalW, naturalH) {
        const boxAspect = rectImg.width / rectImg.height;
        const imgAspect = naturalW / naturalH;
        let width = rectImg.width, height = rectImg.height, offsetX = 0, offsetY = 0;
        if (imgAspect > boxAspect) {
            height = rectImg.width / imgAspect;
            offsetY = (rectImg.height - height) / 2;
        } else if (imgAspect < boxAspect) {
            width = rectImg.height * imgAspect;
            offsetX = (rectImg.width - width) / 2;
        }
        return { left: rectImg.left + offsetX, top: rectImg.top + offsetY, width, height };
    }

    function createCrumb() {
        const crumb = document.createElement('div');
        crumb.classList.add('crumb');
        const size = Math.floor(Math.random() * 6) + 3;
        crumb.style.width = `${size}px`;
        crumb.style.height = `${size}px`;
        const colors = ['#e8a35c', '#d9914a', '#5a3820', '#fff2df'];
        crumb.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const rectImg = crackerImg.getBoundingClientRect();
        const rectWrap = imgWrap.getBoundingClientRect();
        const content = getContentRect(rectImg, crackerImg.naturalWidth || rectImg.width, crackerImg.naturalHeight || rectImg.height);
        const relativeLeft = content.left - rectWrap.left;
        const relativeTop = content.top - rectWrap.top;
        const imgW = content.width;
        const imgH = content.height;

        if (edgePoints === null) edgePoints = computeEdgePoints();
        let startX, startY;
        if (edgePoints.length) {
            const p = edgePoints[Math.floor(Math.random() * edgePoints.length)];
            startX = relativeLeft + p.xPct * imgW;
            startY = relativeTop + p.yPct * imgH;
        } else {
            startX = relativeLeft + imgW * (0.1 + Math.random() * 0.8);
            startY = relativeTop + imgH * (0.1 + Math.random() * 0.8);
        }
        crumb.style.left = `${startX}px`;
        crumb.style.top = `${startY}px`;
        const direction = startX < (relativeLeft + imgW / 2) ? -1 : 1;
        const dx = direction * (Math.random() * 50 + 20);
        const rot = (Math.random() - 0.5) * 1000;
        crumb.style.setProperty('--dx', `${dx}px`);
        crumb.style.setProperty('--rot', `${rot}deg`);
        const duration = Math.random() * 0.6 + 0.4;
        // Ease-in: crumbs accelerate as they fall, like gravity, instead of drifting at an even pace
        crumb.style.animation = `crumbFall ${duration}s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards`;
        imgWrap.appendChild(crumb);
        setTimeout(() => { crumb.remove(); }, duration * 1000);
    }
    crackerCard.addEventListener('mouseenter', () => {
        if (crackerCard.closest('.circuit-popup, .circuit-window')) return;
        if (!intervalId) intervalId = setInterval(createCrumb, 60);
    });
    crackerCard.addEventListener('mouseleave', () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    });
}

// ── TYPST WORDMARK REVEAL - JUSTWHITEE-NOTES ──
// The logo is just a lowercase "t" (Typst's own wordmark glyph) - on hover,
// "ypst" appears one letter at a time beside it so the pair reads as the
// full name. Built here as spans (not a CSS `content` string) because CSS
// alone can't stagger individual characters from one string.
const typstWrap = document.querySelector('#justwhitee-notes-card .project-img-wrap');
if (typstWrap) {
    const reveal = document.createElement('span');
    reveal.className = 'typst-reveal';
    const tilts = [-4, 3, -3, 4];
    'ypst'.split('').forEach((ch, i) => {
        const letter = document.createElement('span');
        letter.className = 'typst-letter';
        letter.textContent = ch;
        letter.style.setProperty('--tilt', tilts[i] + 'deg');
        letter.style.transitionDelay = (i * 70) + 'ms';
        reveal.appendChild(letter);
    });
    typstWrap.appendChild(reveal);
}
})();
