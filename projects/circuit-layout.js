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

function markStep(occupancy, row, col, dir, dirIdx) {
    const key = cellKey(row, col);
    let entry = occupancy.get(key);
    if (!entry) { entry = { dirs: new Set(), preciseDirs: new Set(), via: false }; occupancy.set(key, entry); }
    if (!entry.preciseDirs) entry.preciseDirs = new Set(); // defensive: entries built by hand (e.g. tests) may predate this field
    if (entry.dirs.size > 0 && !entry.dirs.has(dir)) entry.via = true;
    entry.dirs.add(dir);
    if (dirIdx !== undefined) entry.preciseDirs.add(dirIdx);
    return entry.via;
}

function routeLeg(occupancy, from, to, rng, columns, maxRow) {
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
        const dirIdx = compassIndexFor(Math.sign(nr - cur.row), Math.sign(nc - cur.col));
        cur = { row: nr, col: nc };
        markStep(occupancy, cur.row, cur.col, dir, dirIdx);
        path.push({ row: cur.row, col: cur.col });
        return true;
    }

    // Last resort — skips canStep. Always moves toward `to` on the chosen
    // axis, so every forced step strictly shrinks the remaining distance —
    // this is what guarantees the loop below always terminates at `to`.
    function forceStep(nr, nc, dir) {
        nr = Math.max(0, Math.min(maxRow, nr));
        nc = Math.max(0, Math.min(columns - 1, nc));
        const dirIdx = compassIndexFor(Math.sign(nr - cur.row), Math.sign(nc - cur.col));
        cur = { row: nr, col: nc };
        markStep(occupancy, cur.row, cur.col, dir, dirIdx);
        path.push({ row: cur.row, col: cur.col });
    }

    // Candidate moves that make genuine progress toward `to` this iteration —
    // up to 3: the diagonal (if both deltas are open) plus the two orthogonal
    // axes. `id` is the actual (dr,dc) signature, not just the occupancy
    // lane tag, so "continuing" means the same real direction, not just
    // "still vertical" (which would count a reversal as a continuation).
    function candidateMoves(dRow, dCol) {
        const moves = [];
        if (dRow !== 0 && dCol !== 0) {
            const dr = Math.sign(dRow), dc = Math.sign(dCol);
            moves.push({ row: cur.row + dr, col: cur.col + dc, dir: dr === dc ? 'd2' : 'd1', id: dr + ',' + dc });
        }
        if (dRow !== 0) {
            const dr = Math.sign(dRow);
            moves.push({ row: cur.row + dr, col: cur.col, dir: 'v', id: dr + ',0' });
        }
        if (dCol !== 0) {
            const dc = Math.sign(dCol);
            moves.push({ row: cur.row, col: cur.col + dc, dir: 'h', id: '0,' + dc });
        }
        return moves;
    }

    // Weighted order for when there's no continuation preference in play:
    // diagonal ~70% (the main lever for real 45° runs — this is a PCB board
    // that should read as mostly-diagonal with straight runs as the accent,
    // not the reverse), then the axis with the larger remaining delta 70%
    // of the remainder.
    function weightedOrder(moves, dRow, dCol) {
        const pool = moves.slice();
        const weight = function (m) {
            if (m.dir === 'd1' || m.dir === 'd2') return 0.7;
            const larger = Math.abs(dRow) >= Math.abs(dCol) ? 'v' : 'h';
            return m.dir === larger ? 0.3 * 0.7 : 0.3 * 0.3;
        };
        const ordered = [];
        while (pool.length) {
            const weights = pool.map(weight);
            const total = weights.reduce(function (a, b) { return a + b; }, 0);
            let r = rng() * total, idx = 0;
            for (; idx < pool.length - 1; idx++) { r -= weights[idx]; if (r <= 0) break; }
            ordered.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return ordered;
    }

    function isDiagonalId(id) {
        const comma = id.indexOf(',');
        return id.slice(0, comma) !== '0' && id.slice(comma + 1) !== '0';
    }

    // Runs are biased to hold their current direction rather than re-decide
    // every cell — bounds are asymmetric on purpose: a diagonal run gets a
    // much longer leash (reads as one clean 45° stroke) while a straight
    // run is capped short (an accent between diagonal stretches, not the
    // dominant shape).
    const MIN_RUN = 2, MAX_RUN_DIAG = 14, MAX_RUN_STRAIGHT = 5, CONTINUE_CHANCE = 0.85;
    let lastId = null, runLen = 0;

    while (cur.row !== to.row || cur.col !== to.col) {
        steps++;
        const dRow = to.row - cur.row;
        const dCol = to.col - cur.col;
        const moves = candidateMoves(dRow, dCol);

        // Past budget: stop trying alternatives, force straight toward `to`
        // every remaining iteration — still one cell at a time, always
        // shrinking distance, never an unconstrained beeline.
        if (steps > maxSteps) { const m = moves[0]; forceStep(m.row, m.col, m.dir); lastId = null; runLen = 0; continue; }

        const continuing = moves.find(function (m) { return m.id === lastId; });
        const maxRunForContinuing = continuing && isDiagonalId(continuing.id) ? MAX_RUN_DIAG : MAX_RUN_STRAIGHT;
        const preferContinue = continuing && runLen < maxRunForContinuing && (runLen < MIN_RUN || rng() < CONTINUE_CHANCE);
        const ordered = preferContinue
            ? [continuing].concat(weightedOrder(moves.filter(function (m) { return m !== continuing; }), dRow, dCol))
            : weightedOrder(moves, dRow, dCol);

        let moved = false;
        for (let i = 0; i < ordered.length; i++) {
            const m = ordered[i];
            if (tryStep(m.row, m.col, m.dir)) {
                runLen = (m.id === lastId) ? runLen + 1 : 1;
                lastId = m.id;
                moved = true;
                break;
            }
        }
        if (moved) continue;

        // Every progress-making candidate is blocked — sidestep perpendicular
        // around the obstruction (relative to whichever axis has the larger
        // remaining delta).
        const sideDir = Math.abs(dRow) >= Math.abs(dCol) ? 'h' : 'v';
        const sideA = sideDir === 'h' ? { row: cur.row, col: cur.col + 1, dir: 'h' } : { row: cur.row + 1, col: cur.col, dir: 'v' };
        const sideB = sideDir === 'h' ? { row: cur.row, col: cur.col - 1, dir: 'h' } : { row: cur.row - 1, col: cur.col, dir: 'v' };
        if (tryStep(sideA.row, sideA.col, sideA.dir)) { lastId = null; runLen = 0; continue; }
        if (tryStep(sideB.row, sideB.col, sideB.dir)) { lastId = null; runLen = 0; continue; }

        // Boxed in on all sides this iteration — force progress; the loop
        // re-evaluates fresh next iteration either way.
        const m = moves[0];
        forceStep(m.row, m.col, m.dir);
        lastId = null; runLen = 0;
    }

    return path;
}

function routeOrthogonal(occupancy, from, to, rng, columns, maxRow) {
    const totalDRow = to.row - from.row;
    const totalDCol = to.col - from.col;

    // A direct leg between nodes (many rows apart, few columns apart) would
    // exhaust its column delta almost immediately then run straight — a long
    // straight capped with a short diagonal nub. Waypoints zigzag it into
    // legs with comparable row/column magnitude instead, closer to a true
    // 45° run. Only kicks in with a real column delta to stretch out.
    const waypoints = [from];
    if (totalDCol !== 0 && Math.abs(totalDRow) > 6 && Math.abs(totalDRow) > Math.abs(totalDCol) * 2) {
        const legCount = Math.max(2, Math.round(Math.abs(totalDRow) / 5));
        const wanderMag = Math.max(2, Math.round(Math.abs(totalDRow) / legCount));
        let side = rng() < 0.5 ? 1 : -1;
        for (let i = 1; i < legCount; i++) {
            const frac = i / legCount;
            const row = Math.round(from.row + totalDRow * frac);
            const straightCol = from.col + totalDCol * frac;
            const col = Math.max(0, Math.min(columns - 1, Math.round(straightCol) + side * wanderMag));
            waypoints.push({ row: row, col: col });
            side = -side;
        }
    }
    waypoints.push(to);

    let fullPath = [{ row: from.row, col: from.col }];
    for (let i = 1; i < waypoints.length; i++) {
        const leg = routeLeg(occupancy, waypoints[i - 1], waypoints[i], rng, columns, maxRow);
        fullPath = fullPath.concat(leg.slice(1));
    }
    return fullPath;
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

// Expands a reduced corner list back to every cell it passes through (turns
// only reduceToCorners keeps endpoints, so a long run collapses to 2 points)
// — the candidate pool for branch attachment points, so branches spread
// along a run instead of landing only on turns. Each cell carries dirIdx (the
// local compass direction) so an attaching branch can start related to its
// parent's heading instead of at an unrelated, sharp-looking angle.
function segmentCells(corners) {
    const cells = [];
    if (corners.length < 2) { if (corners.length === 1) cells.push({ row: corners[0].row, col: corners[0].col, dirIdx: 0 }); return cells; }
    for (let i = 1; i < corners.length; i++) {
        const a = corners[i - 1], b = corners[i];
        const dr = Math.sign(b.row - a.row), dc = Math.sign(b.col - a.col);
        const dirIdx = compassIndexFor(dr, dc);
        const steps = Math.max(Math.abs(b.row - a.row), Math.abs(b.col - a.col));
        if (i === 1) cells.push({ row: a.row, col: a.col, dirIdx: dirIdx });
        for (let s = 1; s <= steps; s++) cells.push({ row: a.row + dr * s, col: a.col + dc * s, dirIdx: dirIdx });
    }
    return cells;
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

// In compass order (N, NE, E, SE, S, SW, W, NW) so index ±1 (mod 8) is
// always the neighboring direction 45° either side — used to let a walk
// bend gently instead of jumping to an unrelated heading.
const COMPASS_DIRS = [
    { row: -1, col: 0, dir: 'v' },
    { row: -1, col: 1, dir: 'd1' },
    { row: 0, col: 1, dir: 'h' },
    { row: 1, col: 1, dir: 'd2' },
    { row: 1, col: 0, dir: 'v' },
    { row: 1, col: -1, dir: 'd1' },
    { row: 0, col: -1, dir: 'h' },
    { row: -1, col: -1, dir: 'd2' },
];

function compassIndexFor(dr, dc) {
    for (let i = 0; i < COMPASS_DIRS.length; i++) {
        if (COMPASS_DIRS[i].row === dr && COMPASS_DIRS[i].col === dc) return i;
    }
    return 0;
}

function directionSequenceFromPath(path) {
    const seq = [];
    for (let i = 1; i < path.length; i++) {
        seq.push(compassIndexFor(Math.sign(path[i].row - path[i - 1].row), Math.sign(path[i].col - path[i - 1].col)));
    }
    return seq;
}

function growRandomWalk(occupancy, from, rng, columns, maxRow, minLen, maxLen, parentDirIdx) {
    const len = randInt(rng, minLen, maxLen);
    // Left fully free (all 8), a branch's starting heading has no relation
    // to the direction the trace it's attaching to is actually running in
    // at that point — no chamfering ever gets applied between two separate
    // paths meeting at a junction, only within one path's own corners, so
    // an unrelated departure angle reads as a sharp, disconnected-looking
    // elbow right where it attaches. When the parent's local direction is
    // known, restrict the start to a forward-facing arc off of it (same
    // direction through ±90°) — never doubling back sharply against it.
    const startCandidates = parentDirIdx === undefined
        ? [0, 1, 2, 3, 4, 5, 6, 7]
        : [parentDirIdx, (parentDirIdx + 1) % 8, (parentDirIdx + 7) % 8, (parentDirIdx + 2) % 8, (parentDirIdx + 6) % 8];
    // Real PCB traces (and the background of this board) read as
    // predominantly orthogonal with 45° chamfers as the exception, not the
    // rule — the opposite bias from the main path. Weights the start (and
    // every bend below) toward even compass indices (N/E/S/W).
    function orthoBiasedOrder(candidates) {
        const weight = function (idx) { return idx % 2 === 0 ? 0.78 : 0.35; };
        const pool = candidates.slice();
        const ordered = [];
        while (pool.length) {
            const weights = pool.map(weight);
            const total = weights.reduce(function (a, b) { return a + b; }, 0);
            let r = rng() * total, i = 0;
            for (; i < pool.length - 1; i++) { r -= weights[i]; if (r <= 0) break; }
            ordered.push(pool[i]);
            pool.splice(i, 1);
        }
        return ordered;
    }
    // Two direction indices are "correctly" joinable when they're at most
    // 90° apart (compass distance <=2) — 45°/90° reads as a clean merge,
    // 135° as an unrelated trace grazed at a shallow, near-parallel angle
    // right before it happens to touch. 180° (running straight into the
    // same lane) is already excluded by the same-tag block below.
    function anglesJoinCleanly(idxA, idxB) {
        const diff = Math.abs(idxA - idxB) % 8;
        return Math.min(diff, 8 - diff) <= 2;
    }

    for (const startIdx of orthoBiasedOrder(startCandidates)) {
        const path = [{ row: from.row, col: from.col }];
        const dirs = [];
        const dirIdxs = [];
        let cur = { row: from.row, col: from.col };
        let dirIdx = startIdx;
        // Once the branch establishes a vertical trend (descending or
        // ascending), a bend may only ease it toward horizontal or hold it —
        // never flip it. Enough small 45° bends compounding in the same
        // rotational direction can otherwise walk a branch's heading all the
        // way around to its own reverse, producing a hook that climbs back
        // over itself instead of reading as one consistent stroke.
        let verticalSign = Math.sign(COMPASS_DIRS[dirIdx].row);
        for (let i = 0; i < len; i++) {
            // Bends mostly turn a straight orthogonal run 90° onto another
            // orthogonal heading — a real PCB trace's normal turn — and only
            // occasionally ease 45° into a diagonal; once ON a diagonal, a
            // bend eases straight back toward orthogonal rather than
            // continuing the diagonal run, so diagonal stays the occasional
            // accent rather than a sustained style. Kept rare and delayed
            // past the first couple of steps — these branches are short, so
            // a high chance here reads as a wiggly snake, not an occasional
            // gentle bend.
            if (i > 1 && rng() < 0.15) {
                const isOrtho = dirIdx % 2 === 0;
                const raw = isOrtho && rng() < 0.7
                    ? [(dirIdx + 2) % 8, (dirIdx + 6) % 8]
                    : [(dirIdx + 1) % 8, (dirIdx + 7) % 8];
                const bendCandidates = raw.filter(function (idx) {
                    const s = Math.sign(COMPASS_DIRS[idx].row);
                    return verticalSign === 0 || s === 0 || s === verticalSign;
                });
                if (bendCandidates.length) {
                    dirIdx = bendCandidates[Math.floor(rng() * bendCandidates.length)];
                    const s = Math.sign(COMPASS_DIRS[dirIdx].row);
                    if (s !== 0) verticalSign = s;
                }
            }
            const d = COMPASS_DIRS[dirIdx];
            const nr = Math.max(0, Math.min(maxRow, cur.row + d.row));
            const nc = Math.max(0, Math.min(columns - 1, cur.col + d.col));
            if (nr === cur.row && nc === cur.col) break; // hit the board edge — stop here
            const entry = occupancy.get(cellKey(nr, nc));
            if (entry && entry.dirs.has(d.dir)) break; // same-lane overlap — stop without taking this step
            if (entry && entry.preciseDirs && entry.preciseDirs.size > 0) {
                let joinsCleanly = false;
                entry.preciseDirs.forEach(function (existingIdx) {
                    if (anglesJoinCleanly(dirIdx, existingIdx)) joinsCleanly = true;
                });
                // Every existing direction here is a shallow, near-parallel
                // graze rather than a real join — stop one cell short instead
                // of touching it at an unrelated angle.
                if (!joinsCleanly) break;
            }
            cur = { row: nr, col: nc };
            path.push({ row: cur.row, col: cur.col });
            dirs.push(d.dir);
            dirIdxs.push(dirIdx);
            // Touching a different trace: join it with this one step (flags
            // a via) and stop growing, rather than crossing through it and
            // continuing — branches read as organically grown until they
            // hit something, not free to crisscross the whole board.
            if (entry) break;
        }
        if (path.length > 1) {
            // Mark the attachment cell itself too, not just the new cells —
            // otherwise a branch touching a straight run mid-segment never
            // registers a second direction there, so it never gets flagged
            // as a via and reads as visually unconnected even though it's
            // graph-connected.
            markStep(occupancy, from.row, from.col, dirs[0], dirIdxs[0]);
            for (let i = 1; i < path.length; i++) markStep(occupancy, path[i].row, path[i].col, dirs[i - 1], dirIdxs[i - 1]);
            return path;
        }
    }
    return null;
}

// Replays an already-grown branch's exact direction sequence from a
// perpendicular-offset start point, so the result runs alongside it —
// same turns, same shape, just shifted — like a real PCB's parallel bus
// bundle, rather than every trace being an independent, uncorrelated walk.
// Stops early (same rules as growRandomWalk: same-lane block, or one final
// step to touch-and-join a different trace) wherever the sibling's own
// path happens to run into something the original didn't.
function growParallelWalk(occupancy, start, dirSeq, columns, maxRow) {
    const path = [{ row: start.row, col: start.col }];
    const dirs = [];
    const dirIdxs = [];
    let cur = { row: start.row, col: start.col };
    for (let i = 0; i < dirSeq.length; i++) {
        const d = COMPASS_DIRS[dirSeq[i]];
        const nr = Math.max(0, Math.min(maxRow, cur.row + d.row));
        const nc = Math.max(0, Math.min(columns - 1, cur.col + d.col));
        if (nr === cur.row && nc === cur.col) break;
        const entry = occupancy.get(cellKey(nr, nc));
        if (entry && entry.dirs.has(d.dir)) break;
        cur = { row: nr, col: nc };
        path.push({ row: cur.row, col: cur.col });
        dirs.push(d.dir);
        dirIdxs.push(dirSeq[i]);
        if (entry) break;
    }
    if (path.length <= 1) return null;
    markStep(occupancy, start.row, start.col, dirs[0], dirIdxs[0]);
    for (let i = 1; i < path.length; i++) markStep(occupancy, path[i].row, path[i].col, dirs[i - 1], dirIdxs[i - 1]);
    return path;
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

// distanceFn defaults to Chebyshev (correct for the procedural board's
// grid, where a diagonal run's row/col deltas are always equal) — the
// hand-authored static board has arbitrary-angle legs, so it passes true
// Euclidean distance instead.
function computeDistances(segments, root, distanceFn) {
    distanceFn = distanceFn || function (a, b) { return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)); };
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
            addEdge(a, b, distanceFn(a, b));
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
    }

    function countVias(occ) {
        let n = 0;
        occ.forEach(function (e) { if (e.via) n++; });
        return n;
    }
    // Caps how many crossings the decorative branches below are allowed to
    // add — without it, enough dead-end/untraveled branches will eventually
    // cross something no matter how sparse the board, reading as visual
    // clutter rather than a clean board. Reference PCB boards read as
    // packed edge-to-edge, not sparse — this is deliberately generous; the
    // local anti-clustering check below keeps density even rather than
    // clumped, so a high cap here reads as "full," not "messy."
    const maxVias = projectCount * 10;

    // A global cap alone still lets crossings bunch up around one busy spot
    // (typically a node, where several segments already meet) — this steers
    // new attachment points away from a neighborhood that's already crossing
    // -heavy, spreading vias across the board instead of just capping their
    // total.
    function localViaCount(point, radius) {
        let n = 0;
        occupancy.forEach(function (e, key) {
            if (!e.via) return;
            const comma = key.indexOf(',');
            const r = Number(key.slice(0, comma)), c = Number(key.slice(comma + 1));
            if (Math.abs(r - point.row) <= radius && Math.abs(c - point.col) <= radius) n++;
        });
        return n;
    }
    // Re-picks both the segment and the cell on each retry — retrying only
    // the cell within one already-chosen segment can't escape a hot spot
    // when that whole segment runs through it.
    function pickAttachmentPoint(pool) {
        let point = null;
        for (let attempt = 0; attempt < 20; attempt++) {
            const seg = pool[randInt(rng, 0, pool.length - 1)];
            const cells = segmentCells(seg.corners);
            point = cells[randInt(rng, 0, cells.length - 1)];
            if (localViaCount(point, 3) < 1) break;
        }
        return point;
    }

    if (segments.length > 0) {
        // Dead-ends render bright/lit/flowing, same as the main path — they
        // need to stay a minor accent (roughly on the order of the main
        // path's own segment count), not outnumber it several times over,
        // or the board reads as uniformly busy instead of one clear glowing
        // path with occasional bright branches. Board texture/density
        // belongs to the untraveled network below, which renders dim.
        const deadEndCount = randInt(rng, Math.max(2, Math.floor(projectCount / 2)), projectCount);
        for (let i = 0; i < deadEndCount; i++) {
            if (countVias(occupancy) >= maxVias) break;
            const point = pickAttachmentPoint(segments);
            const branch = growRandomWalk(occupancy, point, rng, columns, maxRow, 3, 6, point.dirIdx);
            if (branch) segments.push({ corners: reduceToCorners(branch), traveled: true, kind: 'deadend' });
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
    // Independent random-walk branches don't coordinate with each other —
    // pushed high enough in COUNT, that just produces a dense, incoherent
    // crosshatch (many short, unrelated segments crossing everywhere) not
    // the reference's look (a handful of long, mostly-straight runs reading
    // as real bus lines). Fewer, much longer branches instead.
    const untraveled = [];
    const untraveledCount = randInt(rng, projectCount * 5, projectCount * 8);
    for (let i = 0; i < untraveledCount; i++) {
        if (countVias(occupancy) >= maxVias) break;
        const pool = segments.concat(untraveled);
        const point = pickAttachmentPoint(pool);
        const branch = growRandomWalk(occupancy, point, rng, columns, maxRow, 8, 22, point.dirIdx);
        // A branch that got blocked almost immediately is just a short stub —
        // adds visual noise, not a real trace. Skip it rather than keep it.
        if (!branch || branch.length < 5) continue;
        untraveled.push({ corners: reduceToCorners(branch), traveled: false });
        // Real PCB backgrounds read as bundles of parallel traces running
        // together, not independent unrelated lines — spawn up to 2 siblings
        // that replay this branch's exact turn sequence, so they trace the
        // same shape as the original. Each sibling starts at the same
        // already-connected point and walks one step perpendicular first (a
        // short rung) before replaying the sequence — starting from an
        // arbitrary offset point instead would leave it floating,
        // disconnected from the rest of the board. Siblings go on opposite
        // sides (not stacked deeper on the same side) so a second sibling's
        // own rung never collides with the first's.
        if (rng() < 0.55) {
            const dirSeq = directionSequenceFromPath(branch);
            const sides = rng() < 0.5
                ? [(dirSeq[0] + 2) % 8, (dirSeq[0] + 6) % 8]
                : [(dirSeq[0] + 6) % 8, (dirSeq[0] + 2) % 8];
            const siblingCount = randInt(rng, 1, 2);
            for (let s = 0; s < siblingCount; s++) {
                if (countVias(occupancy) >= maxVias) break;
                const sibling = growParallelWalk(occupancy, point, [sides[s]].concat(dirSeq), columns, maxRow);
                if (sibling && sibling.length >= 5) untraveled.push({ corners: reduceToCorners(sibling), traveled: false });
            }
        }
    }

    const vias = [];
    const viaKeys = new Set();
    occupancy.forEach(function (entry, key) {
        if (entry.via) {
            const parts = key.split(',');
            vias.push({ row: Number(parts[0]), col: Number(parts[1]) });
            viaKeys.add(key);
        }
    });

    // Components sit in-line on an existing trace's own course — the real
    // PCB motif of current running straight through a resistor/capacitor —
    // rotated to the trace's local direction there, rather than dangling
    // off a dead-end tip. Drawn from every segment's *interior* cells only
    // (excludes both endpoints, so it's genuinely mid-run, never a corner
    // or a via/junction where a 2-lead part wouldn't make sense).
    const interiorPool = [];
    segments.concat(untraveled).forEach(function (seg) {
        const cells = segmentCells(seg.corners);
        for (let i = 1; i < cells.length - 1; i++) {
            if (!viaKeys.has(cells[i].row + ',' + cells[i].col)) interiorPool.push(cells[i]);
        }
    });
    const decorativeSpots = [];
    const componentCount = Math.min(interiorPool.length, randInt(rng, projectCount, projectCount * 2));
    for (let i = 0; i < componentCount; i++) {
        const idx = randInt(rng, 0, interiorPool.length - 1);
        const point = interiorPool[idx];
        decorativeSpots.push({ row: point.row, col: point.col, angle: (point.dirIdx - 2) * 45 });
        interiorPool.splice(idx, 1);
    }

    return { columns, rows: maxRow + 1, rowsPerProject, nodes, segments, untraveled, decorativeSpots, vias };
}

function euclideanDist(a, b) { return Math.hypot(a.row - b.row, a.col - b.col); }

// Every leg (a real PCB trace's own straight run) gets 0-2 candidate
// component spots, at random points along its middle 60% — never right at
// a corner or a via, where a 2-lead part wouldn't sit naturally in-line.
function sampleStaticDecorativeSpots(segments, untraveled, vias, rng, count) {
    const pool = [];
    segments.concat(untraveled).forEach(function (seg) {
        const corners = seg.corners;
        for (let i = 1; i < corners.length; i++) {
            const a = corners[i - 1], b = corners[i];
            const legLen = euclideanDist(a, b);
            if (legLen < 40) continue; // too short for a spot to read as "mid-run"
            const t = 0.3 + rng() * 0.4;
            const row = a.row + (b.row - a.row) * t;
            const col = a.col + (b.col - a.col) * t;
            const angle = Math.atan2(b.row - a.row, b.col - a.col) * 180 / Math.PI;
            pool.push({ row: row, col: col, angle: angle });
        }
    });
    const clean = pool.filter(function (p) {
        return !vias.some(function (v) { return euclideanDist(v, p) < 20; });
    });
    const chosen = [];
    for (let i = 0; i < count && clean.length; i++) {
        const idx = randInt(rng, 0, clean.length - 1);
        chosen.push(clean[idx]);
        clean.splice(idx, 1);
    }
    return chosen;
}

// Renders a hand-authored board (fixed nodes/segments/untraveled/vias — see
// projects/circuit-board-data.js) through the same pipeline as the
// procedural one: only decorativeSpots and each node's distanceFromRoot
// (for charge/pulse timing) are computed fresh per call, so the geometry
// stays exactly as drawn while the board still feels alive each load.
function generateFromStatic(staticBoard, opts) {
    opts = opts || {};
    const rng = makeRng(opts.seed != null ? opts.seed : Math.floor(Math.random() * 2147483647));

    const nodes = staticBoard.nodes.map(function (n) { return { row: n.row, col: n.col }; });
    const segments = staticBoard.segments.map(function (s) { return { corners: s.corners, traveled: true, kind: s.kind || 'main' }; });
    const untraveled = staticBoard.untraveled;
    const vias = staticBoard.vias;

    const root = nodes[0];
    const distances = computeDistances(segments, root, euclideanDist);
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

    const decorativeSpots = sampleStaticDecorativeSpots(segments, untraveled, vias, rng, opts.componentCount || 7);

    return {
        columns: staticBoard.columns, rows: staticBoard.rows, rowsPerProject: 0,
        nodes: nodes, segments: segments, untraveled: untraveled, decorativeSpots: decorativeSpots, vias: vias,
        // Hand-drawn corners already have the exact angles the artist
        // wants — chamferCorners' cut is a grid-quantized-board concern.
        chamferAmount: 0,
    };
}

return {
    makeRng, randInt, placeNodes,
    routeOrthogonal, reduceToCorners, chamferCorners, pointsToPathD, cellKey, canStep, markStep,
    growRandomWalk, generateUntraveledNetwork, computeDistances, generate, generateFromStatic,
};
});
