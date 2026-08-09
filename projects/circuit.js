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

function segmentPathD(segment, cellSize) {
    const pts = window.CircuitLayout.chamferCorners(segment.corners, cellSize, CHAMFER);
    return window.CircuitLayout.pointsToPathD(pts);
}

function render(container, board, cellSize) {
    const width = board.columns * cellSize;
    const height = board.rows * cellSize;

    const svg = svgEl('svg', {
        viewBox: '0 0 ' + width + ' ' + height,
        width: '100%',
        height: height,
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
    svg.appendChild(defs);

    const untraveledGroup = svgEl('g', { class: 'circuit-trace circuit-trace-untraveled' });
    board.untraveled.forEach(function (seg) {
        untraveledGroup.appendChild(svgEl('path', { d: segmentPathD(seg, cellSize), class: 'circuit-path circuit-path-untraveled' }));
    });
    svg.appendChild(untraveledGroup);

    const traveledGroup = svgEl('g', { class: 'circuit-trace circuit-trace-traveled' });
    const traveledPaths = board.segments.map(function (seg, i) {
        const pts = window.CircuitLayout.chamferCorners(seg.corners, cellSize, CHAMFER);
        const d = window.CircuitLayout.pointsToPathD(pts);
        const length = pts.reduce(function (sum, p, idx) { return idx === 0 ? 0 : sum + Math.hypot(p.x - pts[idx - 1].x, p.y - pts[idx - 1].y); }, 0);
        // kind drives stroke-width tiering in circuit.css: main path thickest,
        // forks thinner, dead-ends thinnest-of-the-traveled — see Routing rules.
        const pathEl = svgEl('path', { d: d, class: 'circuit-path circuit-path-traveled circuit-path-' + seg.kind, 'data-length': length.toFixed(1) });
        traveledGroup.appendChild(pathEl);
        return { el: pathEl, length: length, corners: seg.corners };
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
        const use = svgEl('use', { href: '#circuit-sym-' + name, x: spot.col * cellSize - size / 2, y: spot.row * cellSize - size / 2, width: size, height: size, class: 'circuit-decor' });
        decorGroup.appendChild(use);
    });
    svg.appendChild(decorGroup);

    const nodeGroup = svgEl('g', { class: 'circuit-nodes' });
    const nodeElements = board.nodes.map(function (n, i) {
        const cx = n.col * cellSize, cy = n.row * cellSize;
        const g = svgEl('g', { class: 'circuit-node', 'data-node-index': i, transform: 'translate(' + cx + ',' + cy + ')' });
        g.appendChild(svgEl('circle', { r: 22, class: 'circuit-node-pad' }));
        g.appendChild(svgEl('circle', { r: 16, class: 'circuit-node-fill' }));
        nodeGroup.appendChild(g);
        return { index: i, cx: cx, cy: cy, groupEl: g };
    });
    svg.appendChild(nodeGroup);

    container.appendChild(svg);
    return { svg: svg, traveledPaths: traveledPaths, nodeElements: nodeElements, width: width, height: height };
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

    const columns = columnsForWidth(window.innerWidth);
    const board = window.CircuitLayout.generate({
        projectCount: collected.projects.length,
        columns: columns,
        rowsPerProject: 8,
        seed: Math.floor(Math.random() * 2147483647),
    });

    const cellSize = window.innerWidth < 480 ? 26 : 32;
    const rendered = render(stage, board, cellSize);

    window.CIRCUIT_PROJECTS = collected.projects;
    window.CIRCUIT_BOARD = board;
    window.CIRCUIT_RENDERED = rendered;

    collected.grid.classList.add('circuit-active');
    runChargeAnimation(rendered, board);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

const CHARGE_DURATION_MS = 2000;

function cumulativeDistanceFromRoot(rendered) {
    // Distance is approximated as the traveled path's own on-screen length,
    // ordered by its position in board.segments (built root-to-leaf in
    // circuit-layout.js's generate()), which is good enough for a wavefront
    // that only needs to *look* like it's expanding outward, not be exact.
    let running = 0;
    return rendered.traveledPaths.map(function (p) {
        const start = running;
        running += p.length;
        return { el: p.el, length: p.length, startOffset: start };
    });
}

function runChargeAnimation(rendered, board) {
    const timed = cumulativeDistanceFromRoot(rendered);
    const totalLength = timed.reduce(function (sum, t) { return sum + t.length; }, 0) || 1;

    if (window.prefersReducedMotion) {
        timed.forEach(function (t) { t.el.classList.add('is-lit'); });
        rendered.nodeElements.forEach(function (n) { n.groupEl.classList.add('is-lit'); });
        document.dispatchEvent(new CustomEvent('circuit:charged', { detail: { rendered: rendered, board: board } }));
        return;
    }

    timed.forEach(function (t) {
        const delay = (t.startOffset / totalLength) * CHARGE_DURATION_MS;
        const duration = Math.max(150, (t.length / totalLength) * CHARGE_DURATION_MS);
        setTimeout(function () { t.el.classList.add('is-lit'); }, delay);
        setTimeout(function () { t.el.classList.add('is-lit'); }, delay + duration);
    });

    rendered.nodeElements.forEach(function (n) {
        // Light a node once the segment(s) reaching it have had time to arrive:
        // approximate via the node's index fraction along the total charge duration.
        const frac = board.nodes.length > 1 ? n.index / (board.nodes.length - 1) : 0;
        setTimeout(function () { n.groupEl.classList.add('is-lit'); }, frac * CHARGE_DURATION_MS);
    });

    setTimeout(function () {
        document.dispatchEvent(new CustomEvent('circuit:charged', { detail: { rendered: rendered, board: board } }));
    }, CHARGE_DURATION_MS + 100);
}

const FLOW_SPEED_PX_PER_S = 24 / 1.4; // dash pattern total (6+18) / circuit-flow keyframe period, circuit.css
const FLOW_PERIOD_MS = 1400; // must match the circuit-flow keyframe duration in circuit.css

function startContinuousFlow(rendered) {
    if (window.prefersReducedMotion) return;
    rendered.traveledPaths.forEach(function (t) { t.el.classList.add('is-flowing'); });
}

document.addEventListener('circuit:charged', function (e) {
    startContinuousFlow(e.detail.rendered);
});

window.Circuit.FLOW_SPEED_PX_PER_S = FLOW_SPEED_PX_PER_S;
window.Circuit.FLOW_PERIOD_MS = FLOW_PERIOD_MS;

window.Circuit.init = init;

})();
