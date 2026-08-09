/* ═══════════════════════════════════════════════════════════════════════
   projects/circuit-symbols.js — justwhitee · Matteo Fontolan
   Flat line-art decorative PCB component symbols, purely visual (no text),
   drawn on a 24x24 local coordinate box so any instance can be placed via
   <use> and scaled uniformly. Matches the site's existing flat icon
   language (see assets/projects/*.svg) — thin strokes, no fill except vias.
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {

const STROKE = 'stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';

const CIRCUIT_SYMBOLS = {
    resistor:
        '<symbol id="circuit-sym-resistor" viewBox="0 0 24 24">' +
        '<path d="M2 12 L7 12 L9 6 L12 18 L15 6 L17 12 L22 12" ' + STROKE + '/>' +
        '</symbol>',
    capacitor:
        '<symbol id="circuit-sym-capacitor" viewBox="0 0 24 24">' +
        '<path d="M2 12 L10 12 M14 12 L22 12" ' + STROKE + '/>' +
        '<path d="M10 5 L10 19 M14 5 L14 19" ' + STROKE + '/>' +
        '</symbol>',
    ic:
        '<symbol id="circuit-sym-ic" viewBox="0 0 24 24">' +
        '<rect x="5" y="5" width="14" height="14" rx="1.5" ' + STROKE + '/>' +
        '<path d="M2 8 L5 8 M2 16 L5 16 M19 8 L22 8 M19 16 L22 16" ' + STROKE + '/>' +
        '</symbol>',
    diode:
        '<symbol id="circuit-sym-diode" viewBox="0 0 24 24">' +
        '<path d="M2 12 L9 12 M15 12 L22 12" ' + STROKE + '/>' +
        '<path d="M9 6 L9 18 L15 12 Z" ' + STROKE + '/>' +
        '<path d="M15 6 L15 18" ' + STROKE + '/>' +
        '</symbol>',
    via:
        '<symbol id="circuit-sym-via" viewBox="0 0 24 24">' +
        '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>' +
        '<circle cx="12" cy="12" r="7" ' + STROKE + '/>' +
        '</symbol>',
};

const CIRCUIT_SYMBOL_NAMES = ['resistor', 'capacitor', 'ic', 'diode'];

if (typeof module === 'object' && module.exports) {
    module.exports = { CIRCUIT_SYMBOLS, CIRCUIT_SYMBOL_NAMES };
} else {
    root.CIRCUIT_SYMBOLS = CIRCUIT_SYMBOLS;
    root.CIRCUIT_SYMBOL_NAMES = CIRCUIT_SYMBOL_NAMES;
}

})(typeof self !== 'undefined' ? self : this);
