/**
 * formations.js
 * Pure functions that return arrays of {x, y} target positions.
 * Each function receives (count, cx, cy, spread) where:
 *   count  = number of units
 *   cx, cy = canvas center
 *   spread = 1–10 scale multiplier
 */

const Formations = (() => {

  // ── Helpers ──────────────────────────────────────────────

  function lerp(a, b, t) { return a + (b - a) * t; }

  function baseSpacing(spread) {
    return 28 + spread * 6;
  }

  // ── Formation Algorithms ─────────────────────────────────

  /**
   * SWARM — random cloud orbiting center
   */
  function swarm(count, cx, cy, spread) {
    const positions = [];
    const radius = 80 + spread * 28;
    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const r      = radius * (0.2 + Math.random() * 0.8);
      positions.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    }
    return positions;
  }

  /**
   * GRID — rectangular grid
   */
  function grid(count, cx, cy, spread) {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(count * 1.4));
    const rows = Math.ceil(count / cols);
    const sp   = baseSpacing(spread);
    const offX = ((cols - 1) * sp) / 2;
    const offY = ((rows - 1) * sp) / 2;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: cx + col * sp - offX,
        y: cy + row * sp - offY,
      });
    }
    return positions;
  }

  /**
   * CIRCLE / ORBIT — concentric rings
   */
  function circle(count, cx, cy, spread) {
    const positions = [];
    const rings = [
      { r: 50 + spread * 6,  n: Math.min(8,  Math.floor(count * 0.12)) },
      { r: 110 + spread * 12, n: Math.min(16, Math.floor(count * 0.25)) },
      { r: 180 + spread * 18, n: Math.min(26, Math.floor(count * 0.38)) },
      { r: 260 + spread * 24, n: count }, // overflow ring
    ];

    let placed = 0;
    for (const ring of rings) {
      const n = Math.min(ring.n, count - placed);
      if (n <= 0) break;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        positions.push({
          x: cx + Math.cos(a) * ring.r,
          y: cy + Math.sin(a) * ring.r,
        });
      }
      placed += n;
      if (placed >= count) break;
    }
    return positions;
  }

  /**
   * SPIRAL — Archimedean spiral
   */
  function spiral(count, cx, cy, spread) {
    const positions = [];
    const turns     = 3 + spread * 0.3;
    const maxR      = 220 + spread * 22;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const a = t * turns * Math.PI * 2;
      const r = t * maxR;
      positions.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
      });
    }
    return positions;
  }

  /**
   * V-WING — classic V/wedge flight formation
   */
  function vshape(count, cx, cy, spread) {
    const positions = [];
    const sp  = baseSpacing(spread) * 0.85;
    const mid = Math.floor(count / 2);

    // Leader at front
    positions.push({ x: cx, y: cy - mid * sp * 0.5 });

    for (let i = 1; i < count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const rank = Math.ceil(i / 2);
      positions.push({
        x: cx + side * rank * sp,
        y: cy - mid * sp * 0.5 + rank * sp * 0.9,
      });
    }
    return positions;
  }

  /**
   * DIAMOND — rhombus / diamond shape
   */
  function diamond(count, cx, cy, spread) {
    const positions = [];
    const sp     = baseSpacing(spread);
    const layers = Math.ceil(Math.sqrt(count));
    let placed   = 0;

    for (let ring = 0; ring <= layers && placed < count; ring++) {
      if (ring === 0) {
        positions.push({ x: cx, y: cy });
        placed++;
      } else {
        const pts = ring * 4;
        for (let i = 0; i < pts && placed < count; i++) {
          const side = Math.floor(i / ring);
          const pos  = i % ring;
          let x, y;
          switch (side) {
            case 0: x = cx + (ring - pos) * sp; y = cy - pos * sp; break;
            case 1: x = cx + pos * sp;           y = cy + (ring - pos) * sp; break;
            case 2: x = cx - (ring - pos) * sp;  y = cy + pos * sp; break;
            case 3: x = cx - pos * sp;            y = cy - (ring - pos) * sp; break;
            default: x = cx; y = cy;
          }
          positions.push({ x, y });
          placed++;
        }
      }
    }
    return positions;
  }

  /**
   * ARROW — filled arrowhead pointing up
   */
  function arrow(count, cx, cy, spread) {
    const positions = [];
    const sp   = baseSpacing(spread) * 0.9;
    const half = Math.ceil(count / 2);

    // Build a triangle grid
    let placed = 0;
    let row    = 0;
    while (placed < count) {
      const wide = row + 1;
      for (let col = 0; col < wide && placed < count; col++) {
        positions.push({
          x: cx + (col - (wide - 1) / 2) * sp,
          y: cy + row * sp * 0.85,
        });
        placed++;
      }
      row++;
    }

    // Shift up so apex is at center top
    const totalH = (row - 1) * sp * 0.85;
    return positions.map(p => ({ x: p.x, y: p.y - totalH / 2 }));
  }

  /**
   * HELIX — double helix (two interleaved spirals)
   */
  function helix(count, cx, cy, spread) {
    const positions = [];
    const halfH  = 200 + spread * 20;
    const radius = 60 + spread * 8;
    const turns  = 2.5;

    for (let i = 0; i < count; i++) {
      const strand = i % 2;           // 0 or 1
      const t      = Math.floor(i / 2) / Math.ceil(count / 2);
      const y      = lerp(-halfH, halfH, t);
      const angle  = t * turns * Math.PI * 2 + strand * Math.PI;
      positions.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + y,
      });
    }
    return positions;
  }

  // ── Public API ────────────────────────────────────────────

  const map = { swarm, grid, circle, spiral, vshape, diamond, arrow, helix };

  /**
   * Get target positions for a named formation.
   * @param {string} name
   * @param {number} count
   * @param {number} cx
   * @param {number} cy
   * @param {number} spread  1–10
   * @returns {{ x: number, y: number }[]}
   */
  function getPositions(name, count, cx, cy, spread) {
    const fn = map[name] || map.swarm;
    const positions = fn(count, cx, cy, spread);
    // Ensure we always have exactly `count` entries
    while (positions.length < count) {
      positions.push({ x: cx, y: cy });
    }
    return positions.slice(0, count);
  }

  return { getPositions, names: Object.keys(map) };

})();
