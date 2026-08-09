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
    const maxSteps = (Math.abs(to.row - cur.row) + Math.abs(to.col - cur.col)) * 4 + 10;
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

    while ((cur.row !== to.row || cur.col !== to.col) && steps < maxSteps) {
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
            ? { row: cur.row + (dRow !== 0 ? Math.sign(dRow) : (rng() < 0.5 ? 1 : -1)), col: cur.col, dir: 'v' }
            : { row: cur.row, col: cur.col + (dCol !== 0 ? Math.sign(dCol) : (rng() < 0.5 ? 1 : -1)), dir: 'h' };
        if (tryStep(primary.row, primary.col, primary.dir)) continue;

        const secondary = axis === 'row' && dCol !== 0 ? { row: cur.row, col: cur.col + Math.sign(dCol), dir: 'h' }
            : axis === 'col' && dRow !== 0 ? { row: cur.row + Math.sign(dRow), col: cur.col, dir: 'v' }
            : null;
        if (secondary && tryStep(secondary.row, secondary.col, secondary.dir)) continue;

        // Blocked on both preferred axes — sidestep perpendicular (either
        // direction) to route AROUND the obstruction instead of giving up.
        const sideDir = axis === 'row' ? 'h' : 'v';
        const sideA = sideDir === 'h' ? { row: cur.row, col: cur.col + 1, dir: 'h' } : { row: cur.row + 1, col: cur.col, dir: 'v' };
        const sideB = sideDir === 'h' ? { row: cur.row, col: cur.col - 1, dir: 'h' } : { row: cur.row - 1, col: cur.col, dir: 'v' };
        if (tryStep(sideA.row, sideA.col, sideA.dir)) continue;
        if (tryStep(sideB.row, sideB.col, sideB.dir)) continue;

        break; // genuinely boxed in on all four sides — stop rather than jump
    }

    // Rare (fully boxed in): close the remaining gap one cell at a time, so
    // every cell is still recorded via markStep — never an unmarked jump
    // that later routes wouldn't know to avoid.
    while (cur.col !== to.col) {
        cur = { row: cur.row, col: cur.col + Math.sign(to.col - cur.col) };
        markStep(occupancy, cur.row, cur.col, 'h');
        path.push({ row: cur.row, col: cur.col });
    }
    while (cur.row !== to.row) {
        cur = { row: cur.row + Math.sign(to.row - cur.row), col: cur.col };
        markStep(occupancy, cur.row, cur.col, 'v');
        path.push({ row: cur.row, col: cur.col });
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

return { makeRng, randInt, placeNodes, routeOrthogonal, reduceToCorners, chamferCorners, pointsToPathD, cellKey, canStep, markStep };
});
