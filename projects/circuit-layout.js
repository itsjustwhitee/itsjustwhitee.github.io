/* ═══════════════════════════════════════════════════════════════════════
   projects/circuit-layout.js — justwhitee · Matteo Fontolan
   Pure PCB-board layout algorithm: grid, node placement, trace routing,
   forks, untraveled network. No DOM — runs in Node (for testing, via
   circuit-layout.test.js) and in the browser (via circuit.js).
   ═══════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.CircuitLayout = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {

function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
}

function placeNodes(projectCount, columns, rowsPerProject, rng) {
    const centerCol = Math.floor(columns / 2);
    const centralRadius = Math.max(1, Math.floor(columns / 4));
    const minCol = Math.max(1, centerCol - centralRadius);
    const maxCol = Math.min(columns - 2, centerCol + centralRadius);
    const nodes = [];
    for (let i = 0; i < projectCount; i++) {
        nodes.push({
            row: i * rowsPerProject + Math.floor(rowsPerProject / 2),
            col: randInt(rng, minCol, maxCol),
        });
    }
    return nodes;
}

function cellKey(row, col) { return row + ',' + col; }

function canStep(occupancy, row, col, dir) {
    const entry = occupancy.get(cellKey(row, col));
    if (!entry) return true;
    return !entry.dirs.has(dir);
}

function markStep(occupancy, row, col, dir) {
    const key = cellKey(row, col);
    let entry = occupancy.get(key);
    if (!entry) { entry = { dirs: new Set(), via: false }; occupancy.set(key, entry); }
    if (entry.dirs.size > 0 && !entry.dirs.has(dir)) entry.via = true;
    entry.dirs.add(dir);
    return entry.via;
}

function routeOrthogonal(occupancy, from, to, rng, columns, maxRow) {
    const path = [{ row: from.row, col: from.col }];
    let cur = { row: from.row, col: from.col };
    // Generous: sidesteps are routine under a congested shared occupancy map, not rare.
    const maxSteps = (Math.abs(to.row - cur.row) + Math.abs(to.col - cur.col)) * 12 + 40;
    let steps = 0;

    function tryStep(nr, nc, dir) {
        nr = Math.max(0, Math.min(maxRow, nr));
        nc = Math.max(0, Math.min(columns - 1, nc));
        if (nr === cur.row && nc === cur.col) return false;
        if (!canStep(occupancy, nr, nc, dir)) return false;
        cur = { row: nr, col: nc };
        markStep(occupancy, cur.row, cur.col, dir);
        path.push({ row: cur.row, col: cur.col });
        return true;
    }

    // Last resort — skips canStep. Always moves toward `to` on the chosen
    // axis, so every forced step strictly shrinks the remaining distance —
    // this is what guarantees the loop below always terminates at `to`.
    function forceStep(nr, nc, dir) {
        nr = Math.max(0, Math.min(maxRow, nr));
        nc = Math.max(0, Math.min(columns - 1, nc));
        cur = { row: nr, col: nc };
        markStep(occupancy, cur.row, cur.col, dir);
        path.push({ row: cur.row, col: cur.col });
    }

    while (cur.row !== to.row || cur.col !== to.col) {
        steps++;
        const dRow = to.row - cur.row;
        const dCol = to.col - cur.col;
        let axis;
        if (dRow === 0) axis = 'col';
        else if (dCol === 0) axis = 'row';
        else {
            const preferLarger = Math.abs(dRow) >= Math.abs(dCol) ? 'row' : 'col';
            const preferSmaller = preferLarger === 'row' ? 'col' : 'row';
            axis = rng() < 0.7 ? preferLarger : preferSmaller;
        }

        const primary = axis === 'row'
            ? { row: cur.row + Math.sign(dRow), col: cur.col, dir: 'v' }
            : { row: cur.row, col: cur.col + Math.sign(dCol), dir: 'h' };

        // Past budget: stop trying alternatives, force straight toward `to`
        // every remaining iteration — still one cell at a time, always
        // shrinking distance, never an unconstrained beeline.
        if (steps > maxSteps) { forceStep(primary.row, primary.col, primary.dir); continue; }

        if (tryStep(primary.row, primary.col, primary.dir)) continue;

        const secondary = axis === 'row' && dCol !== 0 ? { row: cur.row, col: cur.col + Math.sign(dCol), dir: 'h' }
            : axis === 'col' && dRow !== 0 ? { row: cur.row + Math.sign(dRow), col: cur.col, dir: 'v' }
            : null;
        if (secondary && tryStep(secondary.row, secondary.col, secondary.dir)) continue;

        // Both axes blocked — sidestep perpendicular around the obstruction.
        const sideDir = axis === 'row' ? 'h' : 'v';
        const sideA = sideDir === 'h' ? { row: cur.row, col: cur.col + 1, dir: 'h' } : { row: cur.row + 1, col: cur.col, dir: 'v' };
        const sideB = sideDir === 'h' ? { row: cur.row, col: cur.col - 1, dir: 'h' } : { row: cur.row - 1, col: cur.col, dir: 'v' };
        if (tryStep(sideA.row, sideA.col, sideA.dir)) continue;
        if (tryStep(sideB.row, sideB.col, sideB.dir)) continue;

        // Boxed in on all sides this iteration — force the primary move; the
        // loop re-evaluates both axes fresh next iteration either way.
        forceStep(primary.row, primary.col, primary.dir);
    }

    return path;
}

function reduceToCorners(path) {
    if (path.length < 2) return path.slice();
    const corners = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
        const prev = path[i - 1], cur = path[i], next = path[i + 1];
        const dir1 = Math.sign(cur.row - prev.row) + ',' + Math.sign(cur.col - prev.col);
        const dir2 = Math.sign(next.row - cur.row) + ',' + Math.sign(next.col - cur.col);
        if (dir1 !== dir2) corners.push(cur);
    }
    corners.push(path[path.length - 1]);
    return corners;
}

function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

function lerpTowards(from, to, len) {
    const d = dist(from, to);
    if (d === 0) return { x: from.x, y: from.y };
    const t = len / d;
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

function chamferCorners(corners, cellSize, chamfer) {
    const pts = corners.map(function (c) { return { x: c.col * cellSize, y: c.row * cellSize }; });
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1], cur = pts[i], next = pts[i + 1];
        const inLen = Math.min(chamfer, dist(prev, cur) / 2);
        const outLen = Math.min(chamfer, dist(cur, next) / 2);
        out.push(lerpTowards(cur, prev, inLen));
        out.push(lerpTowards(cur, next, outLen));
    }
    out.push(pts[pts.length - 1]);
    return out;
}

function pointsToPathD(points) {
    return points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
}

const STEP_DIRS = [
    { row: -1, col: 0, dir: 'v' },
    { row: 1, col: 0, dir: 'v' },
    { row: 0, col: -1, dir: 'h' },
    { row: 0, col: 1, dir: 'h' },
];

function shuffled(arr, rng) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
}

function growRandomWalk(occupancy, from, rng, columns, maxRow, minLen, maxLen) {
    const len = randInt(rng, minLen, maxLen);
    for (const d of shuffled(STEP_DIRS, rng)) {
        const path = [{ row: from.row, col: from.col }];
        let cur = { row: from.row, col: from.col };
        let ok = true;
        for (let i = 0; i < len; i++) {
            const nr = Math.max(0, Math.min(maxRow, cur.row + d.row));
            const nc = Math.max(0, Math.min(columns - 1, cur.col + d.col));
            if ((nr === cur.row && nc === cur.col) || !canStep(occupancy, nr, nc, d.dir)) { ok = false; break; }
            cur = { row: nr, col: nc };
            path.push({ row: cur.row, col: cur.col });
        }
        if (ok && path.length > 1) {
            for (let i = 1; i < path.length; i++) markStep(occupancy, path[i].row, path[i].col, d.dir);
            return path;
        }
    }
    return null;
}

function generateUntraveledNetwork(occupancy, columns, maxRow, rng, traceCount, minLen, maxLen) {
    const traces = [];
    for (let i = 0; i < traceCount; i++) {
        const start = { row: randInt(rng, 0, maxRow), col: randInt(rng, 0, columns - 1) };
        const walk = growRandomWalk(occupancy, start, rng, columns, maxRow, minLen, maxLen);
        if (walk) traces.push(walk);
    }
    return traces;
}

function generate(opts) {
    const rng = makeRng(opts.seed != null ? opts.seed : Math.floor(Math.random() * 2147483647));
    const columns = opts.columns;
    const rowsPerProject = opts.rowsPerProject || 8;
    const projectCount = opts.projectCount;

    if (projectCount <= 0) {
        return { columns, rows: rowsPerProject, rowsPerProject, nodes: [], segments: [], untraveled: [], decorativeSpots: [], vias: [] };
    }

    const nodes = placeNodes(projectCount, columns, rowsPerProject, rng);
    const maxRow = nodes[nodes.length - 1].row + rowsPerProject;
    const occupancy = new Map();

    const segments = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        const rawPath = routeOrthogonal(occupancy, nodes[i], nodes[i + 1], rng, columns, maxRow);
        segments.push({ corners: reduceToCorners(rawPath), traveled: true, kind: 'main' });

        if (rng() < 0.35 && rawPath.length > 6) {
            const startIdx = Math.floor(rawPath.length * 0.25);
            const endIdx = Math.floor(rawPath.length * 0.75);
            const altPath = routeOrthogonal(occupancy, rawPath[startIdx], rawPath[endIdx], rng, columns, maxRow);
            if (altPath.length > 2) segments.push({ corners: reduceToCorners(altPath), traveled: true, kind: 'fork' });
        }
    }

    const decorativeSpots = [];
    if (segments.length > 0) {
        const deadEndCount = randInt(rng, projectCount, projectCount * 2);
        for (let i = 0; i < deadEndCount; i++) {
            const seg = segments[randInt(rng, 0, segments.length - 1)];
            const point = seg.corners[randInt(rng, 0, seg.corners.length - 1)];
            const branch = growRandomWalk(occupancy, point, rng, columns, maxRow, 3, 6);
            if (branch) {
                segments.push({ corners: reduceToCorners(branch), traveled: true, kind: 'deadend' });
                decorativeSpots.push(branch[branch.length - 1]);
            }
        }
    }

    const untraveledPaths = generateUntraveledNetwork(occupancy, columns, maxRow, rng, projectCount * 2, 4, 10);
    const untraveled = untraveledPaths.map(function (path) { return { corners: reduceToCorners(path), traveled: false }; });
    untraveled.forEach(function (t) {
        if (rng() < 0.4) decorativeSpots.push(t.corners[randInt(rng, 0, t.corners.length - 1)]);
    });

    const vias = [];
    occupancy.forEach(function (entry, key) {
        if (entry.via) {
            const parts = key.split(',');
            vias.push({ row: Number(parts[0]), col: Number(parts[1]) });
        }
    });

    return { columns, rows: maxRow + 1, rowsPerProject, nodes, segments, untraveled, decorativeSpots, vias };
}

return {
    makeRng, randInt, placeNodes,
    routeOrthogonal, reduceToCorners, chamferCorners, pointsToPathD, cellKey, canStep, markStep,
    growRandomWalk, generateUntraveledNetwork, generate,
};
});
