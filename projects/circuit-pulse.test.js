const assert = require('assert');
const CircuitPulse = require('./circuit-pulse.js');

function test(name, fn) {
    try { fn(); console.log('PASS ' + name); }
    catch (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; }
}

test('computeNodeOffset derives a periodic offset within [0, periodMs)', () => {
    const offset = CircuitPulse.computeNodeOffset(300, 60, 1400);
    assert.ok(offset >= 0 && offset < 1400, 'offset ' + offset + ' out of period range');
});

test('computeNodeOffset is proportional to distance for distances under one period', () => {
    const o1 = CircuitPulse.computeNodeOffset(60, 60, 1400);   // 1s of travel
    const o2 = CircuitPulse.computeNodeOffset(120, 60, 1400);  // 2s of travel
    assert.strictEqual(o1, 1000);
    assert.strictEqual(o2, 2000 % 1400);
});

test('firstFireDelay never fires before warmupMs, even though computeNodeOffset alone would', () => {
    // distance/speed*1000 = 100ms travel, mod a 1400ms period = 100ms — but
    // a 3000ms warm-up (e.g. a far node's one-time proportional ramp-in)
    // must push the first fire out to the next 100ms-aligned cycle at or
    // after 3000ms, not fire at the raw 100ms offset.
    const bare = CircuitPulse.computeNodeOffset(6, 60, 1400);
    assert.strictEqual(bare, 100, 'sanity: bare offset should be 100ms');
    const delay = CircuitPulse.firstFireDelay(6, 60, 1400, 3000);
    assert.ok(delay >= 3000, 'delay ' + delay + ' fires before warmupMs');
    assert.strictEqual((delay - bare) % 1400, 0, 'delay must still land on the same periodic cycle as the bare offset');
});

test('firstFireDelay falls back to the bare offset when it already clears warmupMs', () => {
    const delay = CircuitPulse.firstFireDelay(300, 60, 1400, 200);
    assert.strictEqual(delay, CircuitPulse.computeNodeOffset(300, 60, 1400));
});

test('schedule calls onExcite once per period per node, and stop() halts future excites', () => {
    // Deterministic fake clock instead of real setTimeout, so the test is
    // synchronous and exact — no timing flakiness, no async test-runner needed.
    // `now` advances to each fired timer's own dueAt (not straight to the
    // advance() target) so chained/recursive setTimer calls see the right
    // "current time", matching real setTimeout semantics.
    let now = 0;
    const queue = [];
    function fakeSetTimer(fn, delay) {
        const entry = { fn: fn, dueAt: now + delay, done: false };
        queue.push(entry);
        return entry;
    }
    function advance(ms) {
        const target = now + ms;
        while (true) {
            let next = null;
            for (let i = 0; i < queue.length; i++) {
                const e = queue[i];
                if (!e.done && e.dueAt <= target && (next === null || e.dueAt < next.dueAt)) next = e;
            }
            if (!next) break;
            now = next.dueAt;
            next.done = true;
            next.fn();
        }
        now = target;
    }

    let calls = 0;
    const stop = CircuitPulse.schedule([{ distance: 0 }], 60, 50, () => { calls++; }, fakeSetTimer);
    advance(170); // offset 0ms, so fires at 0/50/100/150 => 4 excites
    assert.strictEqual(calls, 4);
    stop();
    advance(200); // schedule() already queued another tick before stop() ran; it must no-op now
    assert.strictEqual(calls, 4, 'stop() must prevent further excites');
});

console.log(process.exitCode ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED');
