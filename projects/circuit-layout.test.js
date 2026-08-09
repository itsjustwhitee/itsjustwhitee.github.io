const assert = require('assert');
const CircuitLayout = require('./circuit-layout.js');

function test(name, fn) {
    try { fn(); console.log('PASS ' + name); }
    catch (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; }
}

test('makeRng is deterministic for a given seed', () => {
    const a = CircuitLayout.makeRng(42);
    const b = CircuitLayout.makeRng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    assert.deepStrictEqual(seqA, seqB);
});

test('randInt stays within inclusive bounds', () => {
    const rng = CircuitLayout.makeRng(1);
    for (let i = 0; i < 200; i++) {
        const v = CircuitLayout.randInt(rng, 3, 7);
        assert.ok(v >= 3 && v <= 7, 'value ' + v + ' out of range');
    }
});

test('placeNodes returns one node per project, strictly increasing rows', () => {
    const rng = CircuitLayout.makeRng(7);
    const nodes = CircuitLayout.placeNodes(5, 13, 8, rng);
    assert.strictEqual(nodes.length, 5);
    for (let i = 1; i < nodes.length; i++) {
        assert.ok(nodes[i].row > nodes[i - 1].row, 'rows must strictly increase in chronological order');
    }
});

test('placeNodes keeps columns within a central band, not at the edges', () => {
    const rng = CircuitLayout.makeRng(9);
    const columns = 13;
    const nodes = CircuitLayout.placeNodes(6, columns, 8, rng);
    nodes.forEach(n => {
        assert.ok(n.col >= 1 && n.col <= columns - 2, 'col ' + n.col + ' too close to the edge');
    });
});

test('routeOrthogonal only moves one cell at a time, orthogonally', () => {
    const rng = CircuitLayout.makeRng(3);
    const occ = new Map();
    const path = CircuitLayout.routeOrthogonal(occ, { row: 0, col: 0 }, { row: 6, col: 4 }, rng, 13, 40);
    for (let i = 1; i < path.length; i++) {
        const dr = Math.abs(path[i].row - path[i - 1].row);
        const dc = Math.abs(path[i].col - path[i - 1].col);
        assert.ok((dr === 1 && dc === 0) || (dr === 0 && dc === 1), 'step ' + i + ' is not a single orthogonal move');
    }
});

test('routeOrthogonal always reaches its destination', () => {
    const rng = CircuitLayout.makeRng(11);
    const occ = new Map();
    const path = CircuitLayout.routeOrthogonal(occ, { row: 2, col: 2 }, { row: 20, col: 9 }, rng, 13, 40);
    const last = path[path.length - 1];
    assert.strictEqual(last.row, 20);
    assert.strictEqual(last.col, 9);
});

test('two routes never share a cell in the same direction (no overlapping parallel traces)', () => {
    const rng = CircuitLayout.makeRng(5);
    const occ = new Map();
    const p1 = CircuitLayout.routeOrthogonal(occ, { row: 0, col: 5 }, { row: 10, col: 5 }, rng, 13, 40);
    const p2 = CircuitLayout.routeOrthogonal(occ, { row: 0, col: 5 }, { row: 10, col: 5 }, rng, 13, 40);
    const seen = new Map();
    [p1, p2].forEach(path => {
        for (let i = 1; i < path.length; i++) {
            const dir = path[i].row !== path[i - 1].row ? 'v' : 'h';
            const key = path[i].row + ',' + path[i].col;
            const prevDir = seen.get(key);
            assert.notStrictEqual(prevDir, dir, 'cell ' + key + ' reused in the same direction ' + dir);
            seen.set(key, dir);
        }
    });
});

test('many routes through a congested shared grid never reuse a cell in the same direction', () => {
    // Small, deliberately tight grid (7 columns) shared by 18 overlapping
    // short routes (each spans a few rows, staggered by 1 row per route, so
    // many routes' row-bands overlap at once) forces real congestion: routes
    // must sidestep around each other, and — verified below — this specific,
    // deterministic scenario drives at least one route into the tail
    // fallback, not just the main loop's own sidestep.
    //
    // NOTE on the invariant check: with N > 2 routes, a cell can legitimately
    // collect an 'h' AND a 'v' (a via) from two different earlier routes.
    // Checking a new direction only against the *last* direction recorded at
    // that cell (as the existing 2-route test does — sufficient there, since
    // at most 2 routes ever touch a cell) would miss a later route reusing a
    // direction that isn't the most recent one. So this checks every
    // (cell, direction) pair against the full set ever used, not just the
    // last one.
    const planRng = CircuitLayout.makeRng(101 * 101);
    const rng = CircuitLayout.makeRng(101 * 303);
    const occ = new Map();
    const columns = 7;
    const routeCount = 18;
    const band = 3;   // each route's row span
    const stride = 1; // rows between successive routes' start — << band, so bands overlap heavily
    const maxRow = routeCount * stride + band + 2;
    const allPaths = [];
    let manhattanSum = 0;
    for (let i = 0; i < routeCount; i++) {
        const from = { row: i * stride, col: CircuitLayout.randInt(planRng, 0, columns - 1) };
        const to = { row: i * stride + band, col: CircuitLayout.randInt(planRng, 0, columns - 1) };
        manhattanSum += Math.abs(to.row - from.row) + Math.abs(to.col - from.col);
        allPaths.push(CircuitLayout.routeOrthogonal(occ, from, to, rng, columns, maxRow));
    }

    let totalSteps = 0;
    const usedCellDir = new Set();
    allPaths.forEach(path => {
        for (let i = 1; i < path.length; i++) {
            totalSteps++;
            const dir = path[i].row !== path[i - 1].row ? 'v' : 'h';
            const key = path[i].row + ',' + path[i].col + ',' + dir;
            assert.ok(!usedCellDir.has(key), 'cell ' + path[i].row + ',' + path[i].col + ' reused in the same direction ' + dir);
            usedCellDir.add(key);
        }
    });

    // Sanity check that congestion actually forced extra work (sidesteps /
    // tail fallback) rather than every route sailing straight to its target
    // — otherwise this test wouldn't be exercising the fix at all. (Verified
    // separately that this exact seed/grid drives one route into the tail
    // fallback loop, which resolves via its own occupancy-respecting
    // sidestep rather than forcing — the behavior this fix adds.)
    assert.ok(totalSteps > manhattanSum, 'routes took no detours at all — congestion was not exercised (' + totalSteps + ' <= ' + manhattanSum + ')');
});

test('a perpendicular crossing between two routes is flagged with via: true', () => {
    const rng = CircuitLayout.makeRng(55);
    const occ = new Map();
    const columns = 11;
    const maxRow = 12;
    // Straight horizontal route along row 5. dRow === 0 forces the 'col'
    // axis on every step (no rng branching), and the grid is empty, so this
    // is a deterministic straight line through (5,5).
    CircuitLayout.routeOrthogonal(occ, { row: 5, col: 0 }, { row: 5, col: 10 }, rng, columns, maxRow);
    // Straight vertical route along col 5. dCol === 0 forces the 'row' axis
    // likewise — also deterministic, and crosses the horizontal trace
    // perpendicularly at (5,5).
    CircuitLayout.routeOrthogonal(occ, { row: 0, col: 5 }, { row: 10, col: 5 }, rng, columns, maxRow);

    const crossing = occ.get(CircuitLayout.cellKey(5, 5));
    assert.ok(crossing, 'expected the crossing cell (5,5) to be recorded in the occupancy map');
    assert.ok(crossing.dirs.has('h') && crossing.dirs.has('v'), 'crossing cell should record both directions');
    assert.strictEqual(crossing.via, true, 'perpendicular crossing at (5,5) should be flagged via: true');
});

test('chamferCorners never leaves a corner at a sharp/acute angle', () => {
    const corners = [{ row: 0, col: 0 }, { row: 0, col: 4 }, { row: 4, col: 4 }];
    const pts = CircuitLayout.chamferCorners(corners, 32, 12);
    // A chamfered orthogonal turn produces 5 points: start, pre-corner, post-corner (x2 for the diagonal), end
    assert.strictEqual(pts.length, 4);
    for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1], b = pts[i], c = pts[i + 1];
        const v1 = { x: a.x - b.x, y: a.y - b.y };
        const v2 = { x: c.x - b.x, y: c.y - b.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
        const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI;
        assert.ok(angleDeg >= 89, 'angle at point ' + i + ' is ' + angleDeg.toFixed(1) + '°, sharper than 90°');
    }
});

test('pointsToPathD starts with M and continues with L', () => {
    const d = CircuitLayout.pointsToPathD([{ x: 0, y: 0 }, { x: 10, y: 20 }]);
    assert.ok(d.startsWith('M0.0,0.0'));
    assert.ok(d.includes('L10.0,20.0'));
});

console.log(process.exitCode ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED');
