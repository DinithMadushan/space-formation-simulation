/**
 * simulation.js
 * Core engine — canvas management, star field, particle pool,
 * link rendering, grid overlay, and the main RAF loop.
 */

class Simulation {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx    = canvasEl.getContext('2d');

    // Config (mirrors UI sliders / toggles)
    this.config = {
      count:       120,
      speed:       5,
      spread:      5,
      trail:       6,
      showGrid:    false,
      showLinks:   false,
      glowEnabled: true,
      formation:   'swarm',
      paused:      false,
    };

    this.particles  = [];
    this.stars      = [];
    this._rafId     = null;
    this._time      = 0;

    this._resize();
    this._buildStars();
    this._buildParticles();
    this._applyFormation();

    window.addEventListener('resize', () => {
      this._resize();
      this._applyFormation();
    });
  }

  // ── Setup ──────────────────────────────────────────────

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width  = rect.width  * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.W = rect.width;
    this.H = rect.height;
    this.cx = this.W / 2 - (240 / 2); // offset for panel
    this.cy = this.H / 2;
    this._buildStars();
  }

  _buildStars() {
    this.stars = [];
    const n = Math.floor((this.W * this.H) / 3000);
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x:    Math.random() * this.W,
        y:    Math.random() * this.H,
        r:    Math.random() * 1.2 + 0.2,
        a:    Math.random() * 0.6 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        speed:   0.01 + Math.random() * 0.02,
      });
    }
  }

  _buildParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      const x = this.cx + (Math.random() - 0.5) * 200;
      const y = this.cy + (Math.random() - 0.5) * 200;
      this.particles.push(new Particle(x, y, i));
    }
  }

  _ensureCount() {
    const target = this.config.count;
    while (this.particles.length < target) {
      const i = this.particles.length;
      const x = this.cx + (Math.random() - 0.5) * 100;
      const y = this.cy + (Math.random() - 0.5) * 100;
      this.particles.push(new Particle(x, y, i));
    }
    if (this.particles.length > target) {
      this.particles.length = target;
    }
  }

  // ── Formation ──────────────────────────────────────────

  setFormation(name) {
    this.config.formation = name;
    this._applyFormation();
  }

  _applyFormation() {
    this._ensureCount();
    const positions = Formations.getPositions(
      this.config.formation,
      this.config.count,
      this.cx,
      this.cy,
      this.config.spread,
    );
    this.particles.forEach((p, i) => {
      p.setTarget(positions[i].x, positions[i].y);
    });
  }

  scatter() {
    this.particles.forEach(p => p.scatter(this.cx, this.cy, 14));
  }

  // ── Render ─────────────────────────────────────────────

  _drawBackground() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // Deep space gradient
    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, Math.max(this.W, this.H) * 0.7);
    grad.addColorStop(0,   'rgba(4, 16, 36, 1)');
    grad.addColorStop(0.6, 'rgba(2, 6, 16, 1)');
    grad.addColorStop(1,   'rgba(1, 2, 8, 1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  _drawStars() {
    const ctx = this.ctx;
    this._time += 0.016;
    for (const s of this.stars) {
      const flicker = Math.sin(this._time * s.speed * 60 + s.twinkle) * 0.25;
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.a + flicker);
      ctx.fillStyle   = '#c8e8ff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur  = s.r > 0.9 ? 3 : 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawGrid() {
    if (!this.config.showGrid) return;
    const ctx  = this.ctx;
    const step = 60;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,229,255,0.07)';
    ctx.lineWidth   = 0.5;
    for (let x = 0; x < this.W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.H); ctx.stroke();
    }
    for (let y = 0; y < this.H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke();
    }
    ctx.restore();
  }

  _drawLinks() {
    if (!this.config.showLinks) return;
    const ctx   = this.ctx;
    const maxD  = 90;
    const maxD2 = maxD * maxD;
    const ps    = this.particles;
    ctx.save();
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x;
        const dy = ps[i].y - ps[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < maxD2) {
          const alpha = (1 - d2 / maxD2) * 0.18;
          ctx.beginPath();
          ctx.moveTo(ps[i].x, ps[i].y);
          ctx.lineTo(ps[j].x, ps[j].y);
          ctx.strokeStyle = `rgba(0,229,255,${alpha.toFixed(3)})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  _drawCenterReticle() {
    const ctx = this.ctx;
    const cx  = this.cx;
    const cy  = this.cy;
    const r   = 20;
    const t   = this._time * 0.4;

    ctx.save();
    ctx.globalAlpha  = 0.25;
    ctx.strokeStyle  = '#00e5ff';
    ctx.lineWidth    = 0.8;
    ctx.shadowColor  = '#00e5ff';
    ctx.shadowBlur   = 6;

    ctx.beginPath();
    ctx.arc(cx, cy, r + Math.sin(t) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Cross hairs
    ctx.beginPath();
    ctx.moveTo(cx - r - 12, cy); ctx.lineTo(cx + r + 12, cy);
    ctx.moveTo(cx, cy - r - 12); ctx.lineTo(cx, cy + r + 12);
    ctx.stroke();
    ctx.restore();
  }

  // ── Loop ────────────────────────────────────────────────

  start() {
    const loop = () => {
      this._rafId = requestAnimationFrame(loop);
      if (!this.config.paused) this._tick();
    };
    loop();
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _tick() {
    this._drawBackground();
    this._drawStars();
    this._drawGrid();
    this._drawLinks();
    this._drawCenterReticle();

    for (const p of this.particles) {
      p.update(this.config.speed, this.W, this.H, this.config.trail);
      p.draw(this.ctx, this.config.glowEnabled);
    }
  }

  // ── Stats helper ────────────────────────────────────────

  getStats() {
    return {
      count:     this.particles.length,
      formation: this.config.formation.toUpperCase(),
      paused:    this.config.paused,
    };
  }
}
