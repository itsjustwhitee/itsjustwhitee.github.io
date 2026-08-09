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

    let lastWasDiagonal = false;

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
        if (steps > maxSteps) { forceStep(primary.row, primary.col, primary.dir); lastWasDiagonal = false; continue; }

        // A diagonal step closes both the row and col gap at once, so it's
        // tried as a first-class move whenever both are open — this is what
        // produces real 45° runs instead of only tiny post-hoc chamfers at
        // orthogonal turns. The choice is sticky (much likelier to continue
        // diagonal once started, or to keep going orthogonal once not) so a
        // route reads as a few long clean runs, not a jittery diagonal/
        // orthogonal stitch re-decided every single cell.
        let diag = null;
        if (dRow !== 0 && dCol !== 0) {
            const dr = Math.sign(dRow), dc = Math.sign(dCol);
            diag = { row: cur.row + dr, col: cur.col + dc, dir: dr === dc ? 'd2' : 'd1' };
        }
        const diagChance = lastWasDiagonal ? 0.9 : 0.4;
        if (diag && rng() < diagChance && tryStep(diag.row, diag.col, diag.dir)) { lastWasDiagonal = true; continue; }

        if (tryStep(primary.row, primary.col, primary.dir)) { lastWasDiagonal = false; continue; }

        const secondary = axis === 'row' && dCol !== 0 ? { row: cur.row, col: cur.col + Math.sign(dCol), dir: 'h' }
            : axis === 'col' && dRow !== 0 ? { row: cur.row + Math.sign(dRow), col: cur.col, dir: 'v' }
            : null;
        if (secondary && tryStep(secondary.row, secondary.col, secondary.dir)) { lastWasDiagonal = false; continue; }

        if (diag && tryStep(diag.row, diag.col, diag.dir)) { lastWasDiagonal = true; continue; }

        // Both axes and the diagonal blocked — sidestep perpendicular around the obstruction.
        const sideDir = axis === 'row' ? 'h' : 'v';
        const sideA = sideDir === 'h' ? { row: cur.row, col: cur.col + 1, dir: 'h' } : { row: cur.row + 1, col: cur.col, dir: 'v' };
        const sideB = sideDir === 'h' ? { row: cur.row, col: cur.col - 1, dir: 'h' } : { row: cur.row - 1, col: cur.col, dir: 'v' };
        if (tryStep(sideA.row, sideA.col, sideA.dir)) { lastWasDiagonal = false; continue; }
        if (tryStep(sideB.row, sideB.col, sideB.dir)) { lastWasDiagonal = false; continue; }

        // Boxed in on all sides this iteration — force the primary move; the
        // loop re-evaluates both axes fresh next iteration either way.
        forceStep(primary.row, primary.col, primary.dir);
        lastWasDiagonal = false;
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
    { row: -1, col: 1, dir: 'd1' },
    { row: 1, col: -1, dir: 'd1' },
    { row: -1, col: -1, dir: 'd2' },
    { row: 1, col: 1, dir: 'd2' },
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
            // Mark the attachment cell itself too, not just the new cells —
            // otherwise a branch touching a straight run mid-segment never
            // registers a second direction there, so it never gets flagged
            // as a via and reads as visually unconnected even though it's
            // graph-connected.
            markStep(occupancy, from.row, from.col, d.dir);
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

function computeDistances(segments, root) {
    const adj = new Map();
    function key(p) { return p.row + ',' + p.col; }
    function addEdge(a, b, dist) {
        const ka = key(a), kb = key(b);
        if (!adj.has(ka)) adj.set(ka, []);
        if (!adj.has(kb)) adj.set(kb, []);
        adj.get(ka).push({ to: kb, dist: dist });
        adj.get(kb).push({ to: ka, dist: dist });
    }
    segments.forEach(function (seg) {
        for (let i = 1; i < seg.corners.length; i++) {
            const a = seg.corners[i - 1], b = seg.corners[i];
            // Chebyshev distance: a diagonal run covers both row and col
            // deltas in one grid step each, so max(...) — not Manhattan's
            // sum(...) — is the true step count along a corner-to-corner run.
            addEdge(a, b, Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)));
        }
    });

    const dist = new Map();
    dist.set(key(root), 0);
    const visited = new Set();
    for (;;) {
        let curKey = null, curDist = Infinity;
        dist.forEach(function (d, k) {
            if (!visited.has(k) && d < curDist) { curDist = d; curKey = k; }
        });
        if (curKey === null) break;
        visited.add(curKey);
        (adj.get(curKey) || []).forEach(function (edge) {
            const nd = curDist + edge.dist;
            if (!dist.has(edge.to) || nd < dist.get(edge.to)) dist.set(edge.to, nd);
        });
    }
    return dist;
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

    const leadIn = [{ row: nodes[0].row, col: nodes[0].col }];
    let leadCur = { row: nodes[0].row, col: nodes[0].col };
    while (leadCur.row > 0 && canStep(occupancy, leadCur.row - 1, leadCur.col, 'v')) {
        leadCur = { row: leadCur.row - 1, col: leadCur.col };
        markStep(occupancy, leadCur.row, leadCur.col, 'v');
        leadIn.push({ row: leadCur.row, col: leadCur.col });
    }
    if (leadIn.length > 1) segments.push({ corners: reduceToCorners(leadIn), traveled: true, kind: 'main' });

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
        const deadEndCount = randInt(rng, projectCount * 3, projectCount * 6);
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

    const root = leadIn[leadIn.length - 1];
    const distances = computeDistances(segments, root);
    nodes.forEach(function (n) {
        const d = distances.get(n.row + ',' + n.col);
        n.distanceFromRoot = d !== undefined ? d : 0;
    });
    segments.forEach(function (seg) {
        const a = seg.corners[0], b = seg.corners[seg.corners.length - 1];
        const da = distances.get(a.row + ',' + a.col);
        const db = distances.get(b.row + ',' + b.col);
        seg.startDistance = Math.min(da !== undefined ? da : Infinity, db !== undefined ? db : Infinity);
    });

    // Untraveled branches attach to any point already on the graph (traveled
    // or untraveled), so the whole board stays one connected network — only
    // whether current reaches a given branch differs, never its connectivity.
    const untraveled = [];
    const untraveledCount = randInt(rng, projectCount * 8, projectCount * 14);
    for (let i = 0; i < untraveledCount; i++) {
        const pool = segments.concat(untraveled);
        const seg = pool[randInt(rng, 0, pool.length - 1)];
        const point = seg.corners[randInt(rng, 0, seg.corners.length - 1)];
        const branch = growRandomWalk(occupancy, point, rng, columns, maxRow, 3, 10);
        if (branch) {
            untraveled.push({ corners: reduceToCorners(branch), traveled: false });
            if (rng() < 0.4) decorativeSpots.push(branch[branch.length - 1]);
        }
    }

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
    growRandomWalk, generateUntraveledNetwork, computeDistances, generate,
};
});
