/* ═══════════════════════════════════════════════════════════════════════
   projects/circuit.js — justwhitee · Matteo Fontolan
   Browser-only rendering/animation/interaction engine for the /projects/
   PCB circuit. Consumes CircuitLayout (circuit-layout.js) for the board's
   geometry and CIRCUIT_SYMBOLS (circuit-symbols.js) for decorative parts.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CHAMFER = 10;

function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
}

function segmentPathD(segment, cellSize, chamfer) {
    const pts = window.CircuitLayout.chamferCorners(segment.corners, cellSize, chamfer);
    return window.CircuitLayout.pointsToPathD(pts);
}

function render(container, board, cellSize) {
    const width = board.columns * cellSize;
    const height = board.rows * cellSize;
    // Hand-authored corners are already the exact angles the artist drew;
    // chamfering them too would round them off. generateFromStatic sets
    // board.chamferAmount to 0 to skip that.
    const chamfer = board.chamferAmount !== undefined ? board.chamferAmount : CHAMFER;
    // Vias/decorative symbols anchor at col*cellSize - halfSize (etc.), which
    // goes negative at col/row 0 — outside a "0 0 w h" viewBox and clipped.
    const margin = 24;

    const svg = svgEl('svg', {
        viewBox: (-margin) + ' ' + (-margin) + ' ' + (width + margin * 2) + ' ' + (height + margin * 2),
        width: '100%',
        height: height + margin * 2,
        class: 'circuit-svg',
        'aria-hidden': 'true',
        focusable: 'false',
    });

    const defs = svgEl('defs');
    const parser = new DOMParser();
    Object.keys(window.CIRCUIT_SYMBOLS).forEach(function (name) {
        const doc = parser.parseFromString('<svg xmlns="' + SVG_NS + '">' + window.CIRCUIT_SYMBOLS[name] + '</svg>', 'image/svg+xml');
        defs.appendChild(doc.documentElement.firstChild);
    });
    // Displaces the flow overlay along noise, jump-cutting the seed several
    // times a second for a jittery "electric" kink instead of a smooth glow.
    // type must stay fractalNoise, not turbulence — turbulence sums each
    // octave's absolute value, which isn't zero-centered and visibly biases
    // the displacement toward one side. scale is kept modest so the jitter
    // stays on the wire instead of wandering off it.
    const lightningFilter = svgEl('filter', { id: 'circuit-lightning-jitter', x: '-40%', y: '-40%', width: '180%', height: '180%' });
    const turbulence = svgEl('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.35 0.12', numOctaves: '1', seed: '3', result: 'jitter-noise' });
    turbulence.appendChild(svgEl('animate', {
        attributeName: 'seed', values: '2;9;4;11;1;7;5;3;10', dur: '0.75s', repeatCount: 'indefinite', calcMode: 'discrete',
    }));
    lightningFilter.appendChild(turbulence);
    lightningFilter.appendChild(svgEl('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'jitter-noise', scale: '7', xChannelSelector: 'R', yChannelSelector: 'G',
    }));
    defs.appendChild(lightningFilter);
    svg.appendChild(defs);

    const untraveledGroup = svgEl('g', { class: 'circuit-trace circuit-trace-untraveled' });
    board.untraveled.forEach(function (seg) {
        untraveledGroup.appendChild(svgEl('path', { d: segmentPathD(seg, cellSize, chamfer), class: 'circuit-path circuit-path-untraveled' }));
        // capStart/capEnd mark a lane end that's part of a parallel bundle —
        // a thicker overlay reading as a chip solder pad. Every other
        // terminal gets a via-dot circle instead (board.vias below).
        if (seg.capStart) {
            untraveledGroup.appendChild(svgEl('path', { d: segmentPathD({ corners: seg.capStart }, cellSize, chamfer), class: 'circuit-path circuit-path-untraveled-cap' }));
        }
        if (seg.capEnd) {
            untraveledGroup.appendChild(svgEl('path', { d: segmentPathD({ corners: seg.capEnd }, cellSize, chamfer), class: 'circuit-path circuit-path-untraveled-cap' }));
        }
    });
    svg.appendChild(untraveledGroup);

    const traveledGroup = svgEl('g', { class: 'circuit-trace circuit-trace-traveled' });
    const traveledPaths = board.segments.map(function (seg, i) {
        const pts = window.CircuitLayout.chamferCorners(seg.corners, cellSize, chamfer);
        const d = window.CircuitLayout.pointsToPathD(pts);
        const length = pts.reduce(function (sum, p, idx) { return idx === 0 ? 0 : sum + Math.hypot(p.x - pts[idx - 1].x, p.y - pts[idx - 1].y); }, 0);
        // seg.kind drives stroke-width tiering in circuit.css. The group is
        // what gets is-lit/is-flowing toggled — both children style off it.
        const segGroup = svgEl('g', { class: 'circuit-segment circuit-path-' + seg.kind });
        const baseEl = svgEl('path', { d: d, class: 'circuit-path circuit-path-traveled circuit-path-' + seg.kind, 'data-length': length.toFixed(1) });
        const flowEl = svgEl('path', { d: d, class: 'circuit-flow-overlay' });
        segGroup.appendChild(baseEl);
        segGroup.appendChild(flowEl);
        traveledGroup.appendChild(segGroup);
        return { el: segGroup, length: length, corners: seg.corners, startDistance: seg.startDistance * cellSize };
    });
    svg.appendChild(traveledGroup);

    const viaGroup = svgEl('g', { class: 'circuit-vias' });
    board.vias.forEach(function (v) {
        const use = svgEl('use', { href: '#circuit-sym-via', x: v.col * cellSize - 12, y: v.row * cellSize - 12, width: 24, height: 24, class: 'circuit-via' });
        viaGroup.appendChild(use);
    });
    svg.appendChild(viaGroup);

    const decorGroup = svgEl('g', { class: 'circuit-decorative' });
    board.decorativeSpots.forEach(function (spot, i) {
        const name = window.CIRCUIT_SYMBOL_NAMES[i % window.CIRCUIT_SYMBOL_NAMES.length];
        const size = 20;
        const cx = spot.col * cellSize, cy = spot.row * cellSize;
        const use = svgEl('use', {
            href: '#circuit-sym-' + name, x: cx - size / 2, y: cy - size / 2, width: size, height: size,
            class: 'circuit-decor', transform: 'rotate(' + (spot.angle || 0) + ' ' + cx + ' ' + cy + ')',
        });
        decorGroup.appendChild(use);
    });
    svg.appendChild(decorGroup);

    const nodeGroup = svgEl('g', { class: 'circuit-nodes' });
    const nodeElements = board.nodes.map(function (n, i) {
        const cx = n.col * cellSize, cy = n.row * cellSize;
        const g = svgEl('g', { class: 'circuit-node', 'data-node-index': i, transform: 'translate(' + cx + ',' + cy + ')' });
        g.appendChild(svgEl('circle', { r: 38, class: 'circuit-node-pad' }));
        g.appendChild(svgEl('circle', { r: 30, class: 'circuit-node-fill' }));
        nodeGroup.appendChild(g);
        return { index: i, cx: cx, cy: cy, groupEl: g, distanceFromRoot: n.distanceFromRoot * cellSize };
    });
    svg.appendChild(nodeGroup);

    container.appendChild(svg);
    return {
        svg: svg, traveledPaths: traveledPaths, nodeElements: nodeElements,
        width: width + margin * 2, height: height + margin * 2, margin: margin,
    };
}

window.Circuit = window.Circuit || {};
window.Circuit.render = render;

function collectProjects() {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return null;
    const cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    const projects = cards.map(function (cardEl) {
        return { slug: cardEl.id.replace(/-card$/, ''), dateStr: cardEl.getAttribute('data-date') || '0000-00', cardEl: cardEl };
    });
    projects.sort(function (a, b) { return a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0; });
    return { grid: grid, projects: projects };
}

function columnsForWidth(width) {
    if (width < 480) return 7;
    if (width < 900) return 10;
    return 13;
}

function init() {
    const stage = document.getElementById('circuit-stage');
    const collected = collectProjects();
    if (!stage || !collected || !collected.projects.length) return; // no-JS/degraded path: grid stays visible as-is

    // Falls back to the procedural generator if the hand-authored board's
    // node count doesn't match the live project count (e.g. a project was
    // added before circuit-board-source.svg was updated).
    const staticData = window.CIRCUIT_BOARD_DATA;
    const useStatic = staticData && staticData.nodes.length === collected.projects.length;

    const board = useStatic
        ? window.CircuitLayout.generateFromStatic(staticData, {})
        : window.CircuitLayout.generate({
            projectCount: collected.projects.length,
            columns: columnsForWidth(window.innerWidth),
            rowsPerProject: 8,
            seed: Math.floor(Math.random() * 2147483647),
        });

    const cellSize = useStatic ? 1 : (window.innerWidth < 480 ? 26 : 32);
    const rendered = render(stage, board, cellSize);

    window.CIRCUIT_PROJECTS = collected.projects;
    window.CIRCUIT_BOARD = board;
    window.CIRCUIT_RENDERED = rendered;

    collected.grid.classList.add('circuit-active');
    collected.projects.forEach(function (p) { p.cardEl.classList.remove('reveal'); });
    runChargeAnimation(rendered, board);
    buildNodeButtons(stage, rendered, board, collected.projects, cellSize);
    wireHoverPopups(collected.projects);
    wireActivation(collected.projects);
    initRackControllerExcite();
    initHashCrackerzExcite();
    initEdgeCVExcite();
    initSliceCeiptExcite();
    initTypstExcite();
    buildViewToggle(stage, collected.grid);
}

// The plain grid stays in the DOM (.projects-grid.circuit-active in
// style.css hides it) — this toggles back to it without losing the circuit.
function buildViewToggle(stage, grid) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'circuit-view-toggle';
    btn.setAttribute('aria-pressed', 'false');
    let showingGrid = false;

    function applyLabel() {
        const key = showingGrid ? 'projects.view_circuit' : 'projects.view_grid';
        btn.setAttribute('data-i18n', key);
        btn.textContent = window.t ? window.t(key) : (showingGrid ? 'View as circuit' : 'View as grid');
    }
    applyLabel();

    btn.addEventListener('click', function () {
        showingGrid = !showingGrid;
        if (showingGrid) closeAnyOpenPanel();
        stage.classList.toggle('is-hidden', showingGrid);
        grid.classList.toggle('circuit-active', !showingGrid);
        btn.setAttribute('aria-pressed', String(showingGrid));
        applyLabel();
    });

    stage.insertAdjacentElement('beforebegin', btn);
    return btn;
}

const CHARGE_DURATION_MS = 2000;

function runChargeAnimation(rendered, board) {
    const totalDistance = rendered.traveledPaths.reduce(function (max, t) {
        return Math.max(max, t.startDistance + t.length);
    }, 0) || 1;

    if (window.prefersReducedMotion) {
        rendered.traveledPaths.forEach(function (t) { t.el.classList.add('is-lit'); });
        rendered.nodeElements.forEach(function (n) { n.groupEl.classList.add('is-lit'); });
        document.dispatchEvent(new CustomEvent('circuit:charged', { detail: { rendered: rendered, board: board } }));
        return;
    }

    rendered.traveledPaths.forEach(function (t) {
        const delay = (t.startDistance / totalDistance) * CHARGE_DURATION_MS;
        const duration = Math.max(150, (t.length / totalDistance) * CHARGE_DURATION_MS);
        setTimeout(function () { t.el.classList.add('is-lit'); }, delay);
        setTimeout(function () { t.el.classList.add('is-lit'); }, delay + duration);
    });

    rendered.nodeElements.forEach(function (n) {
        const delay = (n.distanceFromRoot / totalDistance) * CHARGE_DURATION_MS;
        setTimeout(function () { n.groupEl.classList.add('is-lit'); }, delay);
    });

    setTimeout(function () {
        document.dispatchEvent(new CustomEvent('circuit:charged', { detail: { rendered: rendered, board: board } }));
    }, CHARGE_DURATION_MS + 100);
}

const FLOW_SPEED_PX_PER_S = 180 / 1.2; // dash pattern total (26+154) / circuit-flow keyframe period, circuit.css
const FLOW_PERIOD_MS = 1200; // must match the circuit-flow keyframe duration in circuit.css

function startContinuousFlow(rendered) {
    if (window.prefersReducedMotion) return;
    // Same startDistance-based delay as is-lit in runChargeAnimation — a
    // segment must not start streaming before the pulse has reached it.
    const totalDistance = rendered.traveledPaths.reduce(function (max, t) {
        return Math.max(max, t.startDistance + t.length);
    }, 0) || 1;
    rendered.traveledPaths.forEach(function (t) {
        const delay = (t.startDistance / totalDistance) * CHARGE_DURATION_MS;
        setTimeout(function () { t.el.classList.add('is-flowing'); }, delay);
    });
}

document.addEventListener('circuit:charged', function (e) {
    startContinuousFlow(e.detail.rendered);
});

window.Circuit.FLOW_SPEED_PX_PER_S = FLOW_SPEED_PX_PER_S;
window.Circuit.FLOW_PERIOD_MS = FLOW_PERIOD_MS;

const EXCITE_DECAY_MS = 550;
const nodeExciteHandlers = {}; // slug -> function(nodeEl)
const nodeExciteTimers = {};   // slug -> timeout id (for decay-extend)

function onNodeExcite(slug, handler) {
    nodeExciteHandlers[slug] = handler;
}

function excite(project, nodeEl) {
    nodeEl.classList.add('is-excited');
    clearTimeout(nodeExciteTimers[project.slug]);
    nodeExciteTimers[project.slug] = setTimeout(function () {
        nodeEl.classList.remove('is-excited');
    }, EXCITE_DECAY_MS);
    const handler = nodeExciteHandlers[project.slug];
    if (handler) handler(nodeEl);
}

function startPulseScheduler(rendered, projects) {
    if (window.prefersReducedMotion) return;
    // Same warm-up delay as startContinuousFlow's per-segment one — a node
    // must not excite before its own wire visibly starts flowing.
    const totalDistance = rendered.traveledPaths.reduce(function (max, t) {
        return Math.max(max, t.startDistance + t.length);
    }, 0) || 1;
    const nodes = rendered.nodeElements.map(function (n) {
        return {
            distance: n.distanceFromRoot, nodeEl: n.groupEl, project: projects[n.index],
            warmupMs: (n.distanceFromRoot / totalDistance) * CHARGE_DURATION_MS,
        };
    });
    window.CircuitPulse.schedule(
        nodes,
        window.Circuit.FLOW_SPEED_PX_PER_S,
        window.Circuit.FLOW_PERIOD_MS,
        function (node) { excite(node.project, node.nodeEl); }
    );
}

document.addEventListener('circuit:charged', function (e) {
    startPulseScheduler(e.detail.rendered, window.CIRCUIT_PROJECTS);
});

window.Circuit.onNodeExcite = onNodeExcite;

function projectTitle(cardEl) {
    const h3 = cardEl.querySelector('h3');
    return h3 ? h3.textContent.trim() : cardEl.id;
}

function projectLogoSrc(cardEl) {
    const img = cardEl.querySelector('.project-img[src]');
    return img ? img.getAttribute('src') : null;
}

const boardIconEls = {}; // slug -> the small logo element inside that node's button

function buildNodeButtons(stage, rendered, board, projects, cellSize) {
    const overlay = document.createElement('div');
    overlay.className = 'circuit-node-overlay';
    // Matches circuit.css's SVG width:100% so % coords track the real board size.
    overlay.style.width = '100%';

    rendered.nodeElements.forEach(function (n) {
        const project = projects[n.index];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'circuit-node-btn';
        btn.dataset.slug = project.slug;
        btn.setAttribute('aria-label', projectTitle(project.cardEl));
        // n.cx/cy are in the unshifted board coordinate space; rendered.width/
        // height are the full margin-inclusive viewBox span (see render()),
        // so the margin has to be added back in before taking the fraction.
        btn.style.left = (((n.cx + rendered.margin) / rendered.width) * 100) + '%';
        btn.style.top = (((n.cy + rendered.margin) / rendered.height) * 100) + '%';

        const logoSrc = projectLogoSrc(project.cardEl);
        if (logoSrc) {
            const icon = document.createElement('img');
            icon.className = 'circuit-node-icon';
            icon.src = logoSrc;
            icon.alt = '';
            icon.loading = 'lazy';
            btn.appendChild(icon);
            boardIconEls[project.slug] = icon;
        }

        btn.addEventListener('click', function () {
            document.dispatchEvent(new CustomEvent('circuit:node-activate', { detail: { slug: project.slug } }));
        });

        overlay.appendChild(btn);
    });

    stage.appendChild(overlay);
    return overlay;
}

function getBoardIconEl(slug) { return boardIconEls[slug]; }
// Use this, not getBoardIconEl(...).closest(...) — misses edgecv4safety/sliceceipt.
function getNodeButtonEl(slug) { return document.querySelector('.circuit-node-btn[data-slug="' + slug + '"]'); }
window.Circuit.getBoardIconEl = getBoardIconEl;

let openPanel = null; // { type: 'popup'|'window', slug, panelEl, cardEl, originalParent, originalNextSibling, triggerBtn }

function closeAnyOpenPanel() {
    if (!openPanel) return;
    const { cardEl, originalParent, originalNextSibling, panelEl, triggerBtn } = openPanel;
    originalParent.insertBefore(cardEl, originalNextSibling);
    panelEl.remove();
    openPanel = null;
    if (triggerBtn) triggerBtn.focus();
}

function isPointerFine() {
    return window.matchMedia && window.matchMedia('(pointer: fine)').matches;
}

function openPopup(project, triggerBtn) {
    if (openPanel && openPanel.slug === project.slug && openPanel.type === 'popup') return;
    closeAnyOpenPanel();

    const panel = document.createElement('div');
    panel.className = 'circuit-popup';
    panel.setAttribute('role', 'tooltip');

    const originalParent = project.cardEl.parentNode;
    const originalNextSibling = project.cardEl.nextSibling;
    panel.appendChild(project.cardEl);
    document.body.appendChild(panel);

    const btnRect = triggerBtn.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    let left = btnRect.right + 12;
    if (left + panelRect.width > window.innerWidth - 12) left = btnRect.left - panelRect.width - 12;
    if (left < 12) left = 12;
    let top = btnRect.top + window.scrollY - panelRect.height / 2 + btnRect.height / 2;
    top = Math.max(12 + window.scrollY, Math.min(top, document.documentElement.scrollHeight - panelRect.height - 12));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';

    openPanel = { type: 'popup', slug: project.slug, panelEl: panel, cardEl: project.cardEl, originalParent, originalNextSibling, triggerBtn };
}

function wireHoverPopups(projects) {
    if (!isPointerFine()) return;
    projects.forEach(function (project) {
        const btn = getNodeButtonEl(project.slug);
        if (!btn) return;
        btn.addEventListener('mouseenter', function () { openPopup(project, btn); });
        btn.addEventListener('mouseleave', function () {
            if (openPanel && openPanel.type === 'popup' && openPanel.slug === project.slug) closeAnyOpenPanel();
        });
    });
}

function openWindow(project, triggerBtn) {
    closeAnyOpenPanel();

    const backdrop = document.createElement('div');
    backdrop.className = 'circuit-window-backdrop';

    const panel = document.createElement('div');
    panel.className = 'circuit-window';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'circuit-window-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeAnyOpenPanel);

    const originalParent = project.cardEl.parentNode;
    const originalNextSibling = project.cardEl.nextSibling;
    panel.appendChild(closeBtn);
    panel.appendChild(project.cardEl);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    backdrop.addEventListener('mousedown', function (e) {
        if (e.target === backdrop) closeAnyOpenPanel();
    });

    openPanel = { type: 'window', slug: project.slug, panelEl: backdrop, cardEl: project.cardEl, originalParent, originalNextSibling, triggerBtn };

    closeBtn.focus();
}

function wireActivation(projects) {
    document.addEventListener('circuit:node-activate', function (e) {
        const project = projects.filter(function (p) { return p.slug === e.detail.slug; })[0];
        if (!project) return;
        const btn = getNodeButtonEl(project.slug);
        openWindow(project, btn);
    });

    document.addEventListener('keydown', function (e) {
        if (!openPanel) return;
        if (e.key === 'Escape') { closeAnyOpenPanel(); return; }
        if (e.key !== 'Tab' || openPanel.type !== 'window') return;

        const focusable = Array.prototype.slice.call(
            openPanel.panelEl.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter(function (el) { return el.offsetParent !== null; });
        if (!focusable.length) return;

        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
}

function initRackControllerExcite() {
    const icon = getBoardIconEl('rackcontroller');
    if (!icon || window.prefersReducedMotion) return;
    const BASE_SPEED = 0.5, MAX_SPEED = 3.2, DECAY = 0.06;
    let angle = 0, speed = BASE_SPEED, target = BASE_SPEED;

    // Runs forever, so it must stay cheap while hidden (grid view toggled
    // on): offsetParent is null once a display:none ancestor takes this
    // icon out of the render tree, skipping the per-frame style write.
    function spin() {
        if (icon.offsetParent !== null) {
            speed += (target - speed) * DECAY;
            angle += speed;
            icon.style.transform = 'rotate(' + angle + 'deg)';
        }
        requestAnimationFrame(spin);
    }
    requestAnimationFrame(spin);

    window.Circuit.onNodeExcite('rackcontroller', function () {
        target = MAX_SPEED;
        setTimeout(function () { target = BASE_SPEED; }, 500);
    });
}

function initHashCrackerzExcite() {
    const icon = getBoardIconEl('hashcrackerz');
    if (!icon || window.prefersReducedMotion) return;
    const wrap = icon.parentElement; // .circuit-node-btn — small, positioned, good enough as the crumb spawn container

    function spawnCrumb() {
        const crumb = document.createElement('div');
        crumb.className = 'circuit-node-crumb';
        const size = Math.floor(Math.random() * 3) + 2;
        crumb.style.width = size + 'px';
        crumb.style.height = size + 'px';
        const colors = ['#e8a35c', '#d9914a', '#5a3820', '#fff2df'];
        crumb.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        crumb.style.left = (14 + Math.random() * 16) + 'px';
        crumb.style.top = (14 + Math.random() * 16) + 'px';
        const dx = (Math.random() - 0.5) * 30;
        const rot = (Math.random() - 0.5) * 500;
        crumb.style.setProperty('--dx', dx + 'px');
        crumb.style.setProperty('--rot', rot + 'deg');
        const duration = 0.3 + Math.random() * 0.3;
        crumb.style.animation = 'crumbFall ' + duration + 's cubic-bezier(0.55,0.06,0.68,0.19) forwards';
        wrap.appendChild(crumb);
        setTimeout(function () { crumb.remove(); }, duration * 1000);
    }

    window.Circuit.onNodeExcite('hashcrackerz', function () {
        icon.classList.add('is-vibrating');
        let count = 0;
        const id = setInterval(function () {
            spawnCrumb();
            if (++count >= 6) clearInterval(id);
        }, 60);
        setTimeout(function () { icon.classList.remove('is-vibrating'); }, 450);
    });
}

function injectSvgWithUniqueIds(url, suffix, onReady) {
    fetch(url)
        .then(function (r) { return r.text(); })
        .then(function (svgText) {
            const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
            const svg = doc.documentElement;
            const idMap = {};
            // doc, not svg: also covers the root <svg>'s own id attribute.
            doc.querySelectorAll('[id]').forEach(function (el) {
                const oldId = el.getAttribute('id');
                const newId = oldId + suffix;
                idMap[oldId] = newId;
                el.setAttribute('id', newId);
            });
            // hasAttribute/getAttribute (not a CSS `[xlink\:href]` selector) — the latter
            // silently matches nothing for namespaced attrs in an XML-parsed document.
            const refAttrs = ['href', 'xlink:href', 'fill', 'stroke', 'clip-path', 'mask', 'filter'];
            doc.querySelectorAll('*').forEach(function (el) {
                refAttrs.forEach(function (attr) {
                    if (!el.hasAttribute(attr)) return;
                    const val = el.getAttribute(attr);
                    if (!val) return;
                    const match = val.match(/^#(.+)$/) || val.match(/^url\(#(.+)\)$/);
                    if (match && idMap[match[1]]) {
                        el.setAttribute(attr, val.indexOf('url(') === 0 ? 'url(#' + idMap[match[1]] + ')' : '#' + idMap[match[1]]);
                    }
                });
            });
            onReady(svg, idMap);
        })
        .catch(function (err) { console.error('circuit board icon fetch failed for ' + url, err); });
}

function initEdgeCVExcite() {
    const btn = document.querySelector('.circuit-node-btn[data-slug="edgecv4safety"]');
    if (!btn) return;
    injectSvgWithUniqueIds('/assets/projects/edgecv4safety.svg', '-board', function (svg) {
        svg.classList.add('circuit-node-icon');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        btn.appendChild(svg);
        boardIconEls['edgecv4safety'] = svg;

        if (window.prefersReducedMotion) return;
        const pupil = svg.querySelector('#pupil-focus-group-board');
        if (!pupil) return;
        // No cursor to follow here, so each excite jumps the pupil to a
        // random spot and back. Range matches script.js's initEyeTracking
        // limits (120/100) — same 2750-unit SVG viewBox regardless of this
        // icon's tiny on-screen size, so the magnitude has to match too.
        pupil.style.transition = 'transform 0.18s ease-out';

        window.Circuit.onNodeExcite('edgecv4safety', function () {
            const rx = (Math.random() - 0.5) * 240;
            const ry = (Math.random() - 0.5) * 200;
            pupil.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
            setTimeout(function () {
                pupil.style.transform = 'translate(0px,0px)';
            }, 350);
        });
    });
}

function initSliceCeiptExcite() {
    const btn = document.querySelector('.circuit-node-btn[data-slug="sliceceipt"]');
    if (!btn) return;
    injectSvgWithUniqueIds('/assets/projects/sliceceipt.svg', '-board', function (svg) {
        svg.classList.add('circuit-node-icon');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        btn.appendChild(svg);
        boardIconEls['sliceceipt'] = svg;

        if (window.prefersReducedMotion) return;
        window.Circuit.onNodeExcite('sliceceipt', function () {
            svg.classList.add('is-flapping');
            setTimeout(function () { svg.classList.remove('is-flapping'); }, 500);
        });
    });
}

function initTypstExcite() {
    const icon = getBoardIconEl('justwhitee-notes');
    if (!icon || window.prefersReducedMotion) return;
    icon.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';

    window.Circuit.onNodeExcite('justwhitee-notes', function () {
        const angle = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 6);
        icon.style.transform = 'rotate(' + angle.toFixed(1) + 'deg)';
        setTimeout(function () { icon.style.transform = 'rotate(0deg)'; }, 350);
    });
}

window.Circuit.init = init;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
