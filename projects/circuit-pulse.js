/* ═══════════════════════════════════════════════════════════════════════
   projects/circuit-pulse.js — justwhitee · Matteo Fontolan
   Pure timing math for "when does a flowing light pulse pass this node",
   plus a small scheduler built on top. No DOM — dual Node/browser like
   circuit-layout.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.CircuitPulse = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {

function computeNodeOffset(distancePx, speedPxPerS, periodMs) {
    const travelMs = (distancePx / speedPxPerS) * 1000;
    return travelMs % periodMs;
}

// computeNodeOffset alone assumes the flow is already in steady state
// (an infinite repeating stream) — fine once it's actually flowing, but a
// far node can compute a small offset (mod periodMs is always < periodMs)
// while its own connecting wire is still under a much longer one-time
// warm-up delay (e.g. the proportional-to-distance ramp used to bring the
// board up to full flow), firing the node's excite well before its wire
// even looks lit. Returns the smallest delay that both matches the node's
// place in the periodic cycle AND is not earlier than warmupMs.
function firstFireDelay(distancePx, speedPxPerS, periodMs, warmupMs) {
    const offset = computeNodeOffset(distancePx, speedPxPerS, periodMs);
    if (!warmupMs || offset >= warmupMs) return offset;
    const cycles = Math.ceil((warmupMs - offset) / periodMs);
    return offset + cycles * periodMs;
}

function schedule(nodes, speedPxPerS, periodMs, onExcite, setTimer) {
    setTimer = setTimer || function (fn, ms) { return setTimeout(fn, ms); };
    const timers = [];
    let stopped = false;

    nodes.forEach(function (node) {
        const offset = firstFireDelay(node.distance, speedPxPerS, periodMs, node.warmupMs);
        function tick() {
            if (stopped) return;
            onExcite(node);
            timers.push(setTimer(tick, periodMs));
        }
        timers.push(setTimer(tick, offset));
    });

    return function stop() {
        stopped = true;
        timers.forEach(function (id) { clearTimeout(id); });
    };
}

return { computeNodeOffset, firstFireDelay, schedule };
});
