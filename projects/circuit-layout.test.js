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

console.log(process.exitCode ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED');
