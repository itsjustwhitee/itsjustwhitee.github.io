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

function schedule(nodes, speedPxPerS, periodMs, onExcite, setTimer) {
    setTimer = setTimer || function (fn, ms) { return setTimeout(fn, ms); };
    const timers = [];
    let stopped = false;

    nodes.forEach(function (node) {
        const offset = computeNodeOffset(node.distance, speedPxPerS, periodMs);
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

return { computeNodeOffset, schedule };
});
