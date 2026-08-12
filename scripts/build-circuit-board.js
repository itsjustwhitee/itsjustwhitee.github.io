// scripts/build-circuit-board.js
//
// Converts the hand-drawn circuit board (projects/circuit-board-source.svg,
// authored in Inkscape: a "Bg" layer of blue paths for the untraveled
// background, a "Main" layer of red paths for the active spine, and green
// circles marking project node positions) into projects/circuit-board-data.js
// — the fixed board geometry projects/circuit.js renders through
// CircuitLayout.generateFromStatic().
//
// The source SVG can contain more green circles than there are projects
// today (reserved slots for future ones) — CONFIRMED_NODE_IDS below is the
// explicit, in-order list of which circles are real nodes right now. Update
// it (and re-run this script) when adding project slots.
//
// Usage: node scripts/build-circuit-board.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_SVG = path.join(ROOT_DIR, 'projects', 'circuit-board-source.svg');
const OUTPUT_JS = path.join(ROOT_DIR, 'projects', 'circuit-board-data.js');

// Update this when the source SVG's node circles change — see file header.
const CONFIRMED_NODE_IDS = ['path93', 'path93-1-0', 'path93-1-0-7', 'path93-1-0-7-1', 'path93-1-0-7-1-5'];
const MAIN_PATH_ID = 'path3'; // the single continuous spine touching every node in order

// --- minimal SVG path 'd' parser: M/m L/l H/h V/v C/c (bezier control
// points discarded, only the endpoint kept — visually near-straight here) ---
function parsePathD(d) {
    const tokens = d.match(/[MmLlHhVvCc]|-?\d*\.?\d+(?:[eE]-?\d+)?/g) || [];
    let i = 0;
    const subpaths = [];
    let cur = null;
    let x = 0, y = 0;
    let cmd = null;
    const isCmd = (t) => /^[MmLlHhVvCc]$/.test(t);
    function num() { return parseFloat(tokens[i++]); }
    while (i < tokens.length) {
        if (isCmd(tokens[i])) { cmd = tokens[i]; i++; }
        switch (cmd) {
            case 'M': x = num(); y = num(); cur = [{ x, y }]; subpaths.push(cur); cmd = 'L'; break;
            case 'm': x += num(); y += num(); cur = [{ x, y }]; subpaths.push(cur); cmd = 'l'; break;
            case 'L': x = num(); y = num(); cur.push({ x, y }); break;
            case 'l': x += num(); y += num(); cur.push({ x, y }); break;
            case 'H': x = num(); cur.push({ x, y }); break;
            case 'h': x += num(); cur.push({ x, y }); break;
            case 'V': y = num(); cur.push({ x, y }); break;
            case 'v': y += num(); cur.push({ x, y }); break;
            case 'C': num(); num(); num(); num(); x = num(); y = num(); cur.push({ x, y }); break;
            case 'c': { num(); num(); num(); num(); const dx = num(), dy = num(); x += dx; y += dy; cur.push({ x, y }); break; }
            default: i++;
        }
    }
    return subpaths;
}

function extractPaths(svgText, groupLabel) {
    const groupMatch = svgText.match(new RegExp('<g[^>]*inkscape:label="' + groupLabel + '"[\\s\\S]*?</g>'));
    if (!groupMatch) return [];
    const group = groupMatch[0];
    const paths = [];
    const pathRe = /<path\b([^>]*)\/>/g;
    let m;
    while ((m = pathRe.exec(group))) {
        const attrs = m[1];
        const dMatch = attrs.match(/\bd="([^"]*)"/);
        if (!dMatch) continue;
        const idMatch = attrs.match(/\bid="([^"]*)"/);
        paths.push({ id: idMatch ? idMatch[1] : '?', subpaths: parsePathD(dMatch[1]) });
    }
    return paths;
}

function extractCircles(svgText) {
    const circles = [];
    const circleRe = /<circle\b([^>]*)\/>/g;
    let m;
    while ((m = circleRe.exec(svgText))) {
        const attrs = m[1];
        const cx = parseFloat((attrs.match(/\bcx="([^"]*)"/) || [])[1]);
        const cy = parseFloat((attrs.match(/\bcy="([^"]*)"/) || [])[1]);
        const idMatch = attrs.match(/\bid="([^"]*)"/);
        // Inkscape sometimes wraps a circle in transform="scale(-1)" (flips
        // both axes) rather than just writing positive cx/cy directly.
        const flipped = /transform="scale\(-1\)"/.test(attrs);
        circles.push({ id: idMatch ? idMatch[1] : '?', x: flipped ? -cx : cx, y: flipped ? -cy : cy });
    }
    return circles;
}

function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

function segIntersect(p1, p2, p3, p4) {
    const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-9) return null;
    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
    const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
    // exclude near-endpoints — those are shared vertices (intentional
    // attachments), not true mid-run crossings.
    if (t <= 0.02 || t >= 0.98 || u <= 0.02 || u >= 0.98) return null;
    return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

function build() {
    const svg = fs.readFileSync(SOURCE_SVG, 'utf8');
    const widthMatch = svg.match(/\bwidth="(\d+(?:\.\d+)?)"/);
    const heightMatch = svg.match(/\bheight="(\d+(?:\.\d+)?)"/);

    const bg = extractPaths(svg, 'Bg');
    const main = extractPaths(svg, 'Main');
    const circles = extractCircles(svg);

    const nodes = circles
        .filter((c) => CONFIRMED_NODE_IDS.includes(c.id))
        .map((c) => ({ row: c.y, col: c.x }))
        .sort((a, b) => a.row - b.row);
    if (nodes.length !== CONFIRMED_NODE_IDS.length) {
        throw new Error('Expected ' + CONFIRMED_NODE_IDS.length + ' confirmed node circles, found ' + nodes.length + ' in the SVG.');
    }

    const mainPathEntry = main.find((p) => p.id === MAIN_PATH_ID);
    if (!mainPathEntry) throw new Error('Main path id "' + MAIN_PATH_ID + '" not found.');
    const mainPath = mainPathEntry.subpaths[0];

    // A node doesn't have to sit exactly at a drawn corner — it can fall
    // mid-run on a straight or diagonal leg (the artist only marks direction
    // changes as corners, not every node along a run). computeDistances'
    // graph only has edges between *consecutive corners*, so a node that
    // isn't itself a corner is never a vertex in that graph and its
    // distance-from-root lookup silently comes back as 0 for every node.
    // Every node has to be inserted as an explicit corner, splitting
    // whichever leg it falls on.
    function insertNodesAsCorners(pathXY, nodesRC) {
        let remaining = nodesRC.slice();
        const out = [pathXY[0]];
        for (let i = 1; i < pathXY.length; i++) {
            const a = pathXY[i - 1], b = pathXY[i];
            const onThisLeg = remaining.filter((n) => {
                const np = { x: n.col, y: n.row };
                return Math.abs(dist(a, np) + dist(np, b) - dist(a, b)) < 0.5;
            });
            onThisLeg.sort((n1, n2) => dist(a, { x: n1.col, y: n1.row }) - dist(a, { x: n2.col, y: n2.row }));
            onThisLeg.forEach((n) => { out.push({ x: n.col, y: n.row }); remaining = remaining.filter((x) => x !== n); });
            out.push(b);
        }
        if (remaining.length) throw new Error('Node(s) not found on the main path: ' + JSON.stringify(remaining));
        return out;
    }
    const spine = insertNodesAsCorners(mainPath, nodes);

    // Every other path in the Main layer (dead-end spurs off a node, plus
    // whatever the spine itself continues into past the last confirmed
    // node) renders too — active/bright, current genuinely reaches it via
    // computeDistances same as everything else — just without a node
    // circle or click/hover behavior, since there's no real project there
    // yet. Visually says "there's room to grow" instead of the spine just
    // stopping dead at the last real node.
    const reservedMainSegments = main
        .filter((p) => p.id !== MAIN_PATH_ID)
        .map((p) => ({ corners: p.subpaths[0].map((pt) => ({ row: pt.y, col: pt.x })), traveled: true, kind: 'deadend' }));

    const untraveled = [];
    bg.forEach((p) => {
        p.subpaths.forEach((sp) => {
            if (sp.length < 2) return;
            untraveled.push({ corners: sp.map((pt) => ({ row: pt.y, col: pt.x })), traveled: false });
        });
    });

    // Groups of parallel lanes that end together get a short, thicker cap
    // over their last stretch — like the row of solder pads on a chip's
    // parallel pins, instead of every lane just trailing off on its own.
    const CAP_LENGTH = 22;
    const CLUSTER_RADIUS = 45; // px between endpoints to count as "ending together"
    const ANGLE_TOLERANCE_DEG = 12; // final-leg direction similarity
    function finalDirectionDeg(corners) {
        const a = corners[corners.length - 2], b = corners[corners.length - 1];
        return Math.atan2(b.row - a.row, b.col - a.col) * 180 / Math.PI;
    }
    function angleDiff(a1, a2) {
        let d = Math.abs(a1 - a2) % 360;
        if (d > 180) d = 360 - d;
        return Math.min(d, 180 - d); // parallel and anti-parallel both count
    }
    function splitTail(corners, capLength) {
        let remaining = capLength;
        const capPts = [corners[corners.length - 1]];
        for (let i = corners.length - 1; i > 0; i--) {
            const a = corners[i - 1], b = corners[i];
            const legLen = dist({ x: a.col, y: a.row }, { x: b.col, y: b.row });
            if (legLen >= remaining) {
                const t = (legLen - remaining) / legLen;
                capPts.unshift({ row: a.row + (b.row - a.row) * t, col: a.col + (b.col - a.col) * t });
                return capPts;
            }
            remaining -= legLen;
            capPts.unshift(a);
        }
        return capPts;
    }

    const tips = untraveled.map((seg) => ({
        point: seg.corners[seg.corners.length - 1],
        angle: finalDirectionDeg(seg.corners),
    }));
    const parent = tips.map((_, i) => i);
    function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
    function union(i, j) { const ri = find(i), rj = find(j); if (ri !== rj) parent[ri] = rj; }
    for (let i = 0; i < tips.length; i++) {
        for (let j = i + 1; j < tips.length; j++) {
            const d = dist({ x: tips[i].point.col, y: tips[i].point.row }, { x: tips[j].point.col, y: tips[j].point.row });
            if (d <= CLUSTER_RADIUS && angleDiff(tips[i].angle, tips[j].angle) <= ANGLE_TOLERANCE_DEG) union(i, j);
        }
    }
    const groups = new Map();
    tips.forEach((t, i) => {
        const root = find(i);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(i);
    });
    let cappedCount = 0;
    const isolatedTipVias = [];
    groups.forEach((memberIdxs) => {
        if (memberIdxs.length < 2) {
            // Not part of a parallel bundle — no solder-pad cap, so it needs
            // the other terminal treatment instead: a via dot at the tip, same
            // as reservedMainSegments below, so no trace tip is ever left as a
            // bare rounded line-cap trailing into nothing.
            isolatedTipVias.push(tips[memberIdxs[0]].point);
            return;
        }
        memberIdxs.forEach((idx) => {
            untraveled[idx].cap = splitTail(untraveled[idx].corners, CAP_LENGTH);
            cappedCount++;
        });
    });

    const allLegs = [];
    function collectLegs(cornersXY, owner) {
        for (let i = 1; i < cornersXY.length; i++) allLegs.push({ a: cornersXY[i - 1], b: cornersXY[i], owner });
    }
    collectLegs(spine, -1);
    reservedMainSegments.forEach((seg, si) => collectLegs(seg.corners.map((c) => ({ x: c.col, y: c.row })), -2 - si));
    bg.forEach((p, pi) => p.subpaths.forEach((sp, si) => collectLegs(sp, pi * 1000 + si)));

    const vias = [];
    for (let i = 0; i < allLegs.length; i++) {
        for (let j = i + 1; j < allLegs.length; j++) {
            if (allLegs[i].owner === allLegs[j].owner) continue;
            const hit = segIntersect(allLegs[i].a, allLegs[i].b, allLegs[j].a, allLegs[j].b);
            if (hit) vias.push({ row: hit.y, col: hit.x });
        }
    }
    const dedupedVias = [];
    vias.forEach((v) => {
        if (!dedupedVias.some((o) => dist({ x: o.col, y: o.row }, { x: v.col, y: v.row }) < 2)) dedupedVias.push(v);
    });

    // Reserved branches don't get a node circle (no real project to click
    // into yet) — a via dot at the tip instead of the trace just trailing
    // off into a rounded line-cap, reading as a deliberate unpopulated pad
    // rather than an accident.
    reservedMainSegments.forEach((seg) => {
        const tip = seg.corners[seg.corners.length - 1];
        dedupedVias.push({ row: tip.row, col: tip.col });
    });
    isolatedTipVias.forEach((tip) => dedupedVias.push({ row: tip.row, col: tip.col }));

    const board = {
        columns: widthMatch ? parseFloat(widthMatch[1]) : 1125,
        rows: heightMatch ? parseFloat(heightMatch[1]) : 2436,
        rowsPerProject: 0,
        nodes,
        segments: [{ corners: spine.map((p) => ({ row: p.y, col: p.x })), traveled: true, kind: 'main' }].concat(reservedMainSegments),
        untraveled,
        vias: dedupedVias,
    };

    const header = '/* ═══════════════════════════════════════════════════════════════════════\n' +
        '   projects/circuit-board-data.js — justwhitee · Matteo Fontolan\n' +
        '   Generated by scripts/build-circuit-board.js from\n' +
        '   projects/circuit-board-source.svg — do not hand-edit; re-run the script\n' +
        '   after changing the source SVG instead. Coordinates are plain pixels (this\n' +
        '   board is hand-authored, not grid-quantized like the procedural one), so\n' +
        '   it renders through circuit-layout.js/generateFromStatic with cellSize\n' +
        '   fixed at 1. Only decorativeSpots and each node.distanceFromRoot are\n' +
        '   computed fresh per page load — everything else here is fixed geometry.\n' +
        '   ═══════════════════════════════════════════════════════════════════════ */\n' +
        '(function (root) {\n\n' +
        'var CIRCUIT_BOARD_DATA = ' + JSON.stringify(board) + ';\n\n' +
        'if (typeof module === \'object\' && module.exports) {\n' +
        '    module.exports = CIRCUIT_BOARD_DATA;\n' +
        '} else {\n' +
        '    root.CIRCUIT_BOARD_DATA = CIRCUIT_BOARD_DATA;\n' +
        '}\n\n' +
        '})(typeof self !== \'undefined\' ? self : this);\n';

    fs.writeFileSync(OUTPUT_JS, header);
    console.log('Wrote ' + path.relative(ROOT_DIR, OUTPUT_JS) + ' — ' + nodes.length + ' nodes, ' +
        board.segments[0].corners.length + ' main-path corners, ' + untraveled.length + ' background traces (' +
        cappedCount + ' with a parallel-bundle cap, ' + isolatedTipVias.length + ' isolated tips), ' +
        dedupedVias.length + ' vias.');
}

build();
