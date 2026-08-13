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

// computeNodeOffset alone assumes the flow is already steady-state, so a far
// node could fire before its own wire clears its one-time warm-up delay.
// Returns the smallest delay that both matches the periodic cycle and isn't
// earlier than warmupMs.
function firstFireDelay(distancePx, speedPxPerS, periodMs, warmupMs) {
    const offset = computeNodeOffset(distancePx, speedPxPerS, periodMs);
    if (!warmupMs || offset >= warmupMs) return offset;
    const cycles = Math.ceil((warmupMs - offset) / periodMs);
    return offset + cycles * periodMs;
}

function schedule(nodes, speedPxPerS, periodMs, onExcite, setTimer) {
    setTimer = setTimer || function (fn, ms) { return setTimeout(fn, ms); };
    // One slot per node, overwritten each cycle — not an ever-growing array;
    // a node only ever has one pulse pending at a time.
    const timerIds = new Array(nodes.length);
    let stopped = false;

    nodes.forEach(function (node, i) {
        const offset = firstFireDelay(node.distance, speedPxPerS, periodMs, node.warmupMs);
        function tick() {
            if (stopped) return;
            onExcite(node);
            timerIds[i] = setTimer(tick, periodMs);
        }
        timerIds[i] = setTimer(tick, offset);
    });

    return function stop() {
        stopped = true;
        timerIds.forEach(function (id) { clearTimeout(id); });
    };
}

return { computeNodeOffset, firstFireDelay, schedule };
});
