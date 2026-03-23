/**
 * particles.js
 * Individual unit (ship) behaviour — position, velocity, trail, rendering.
 */

class Particle {
  /**
   * @param {number} x  - initial x
   * @param {number} y  - initial y
   * @param {number} id - unique index
   */
  constructor(x, y, id) {
    this.id = id;

    // Current position
    this.x = x;
    this.y = y;

    // Velocity
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;

    // Target position (set by formation)
    this.tx = x;
    this.ty = y;

    // Trail history
    this.trail = [];
    this.maxTrail = 8;

    // Visual
    this.size   = 2.5 + Math.random() * 1.5;
    this.angle  = Math.random() * Math.PI * 2;
    this.color  = Particle.pickColor(id);
    this.alpha  = 0.85 + Math.random() * 0.15;

    // State
    this.scattered = false;
    this.scatterVx = 0;
    this.scatterVy = 0;
  }

  /** Assign a color based on id — gives squad groupings */
  static pickColor(id) {
    const palette = [
      '#00e5ff', // cyan
      '#40c4ff', // light blue
      '#00b0ff', // blue
      '#69f0ae', // green
      '#b2ff59', // lime
    ];
    return palette[id % palette.length];
  }

  /**
   * Scatter — explode outward from center
   * @param {number} cx - canvas center x
   * @param {number} cy - canvas center y
   * @param {number} force
   */
  scatter(cx, cy, force = 12) {
    this.scattered = true;
    const dx = this.x - cx;
    const dy = this.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.scatterVx = (dx / dist) * force * (0.6 + Math.random() * 0.8);
    this.scatterVy = (dy / dist) * force * (0.6 + Math.random() * 0.8);
  }

  /** Set the formation target for this particle */
  setTarget(tx, ty) {
    this.tx = tx;
    this.ty = ty;
    this.scattered = false;
  }

  /**
   * Update position each frame.
   * @param {number} speed  - 1–10 slider value
   * @param {number} W      - canvas width (for bounce)
   * @param {number} H      - canvas height
   * @param {number} trailLen
   */
  update(speed, W, H, trailLen) {
    // Save trail
    this.trail.push({ x: this.x, y: this.y });
    this.maxTrail = Math.max(1, trailLen);
    if (this.trail.length > this.maxTrail) this.trail.shift();

    if (this.scattered) {
      // Scatter physics — drift and dampen
      this.vx = this.vx * 0.92 + this.scatterVx * 0.08;
      this.vy = this.vy * 0.92 + this.scatterVy * 0.08;
      this.scatterVx *= 0.95;
      this.scatterVy *= 0.95;
    } else {
      // Seek target with spring force
      const ease = 0.04 + speed * 0.008;
      const dx   = this.tx - this.x;
      const dy   = this.ty - this.y;
      this.vx += dx * ease;
      this.vy += dy * ease;

      // Damping
      const damping = 0.82;
      this.vx *= damping;
      this.vy *= damping;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Bounce off walls (only during scatter or swarm)
    if (this.scattered) {
      if (this.x < 0)  { this.x = 0;  this.vx =  Math.abs(this.vx) * 0.7; }
      if (this.x > W)  { this.x = W;  this.vx = -Math.abs(this.vx) * 0.7; }
      if (this.y < 0)  { this.y = 0;  this.vy =  Math.abs(this.vy) * 0.7; }
      if (this.y > H)  { this.y = H;  this.vy = -Math.abs(this.vy) * 0.7; }
    }

    // Rotate ship icon
    const speed2 = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed2 > 0.01) {
      this.angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    }
  }

  /**
   * Draw this particle on the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} glowEnabled
   */
  draw(ctx, glowEnabled) {
    if (this.trail.length > 1) {
      this._drawTrail(ctx);
    }
    this._drawShip(ctx, glowEnabled);
  }

  _drawTrail(ctx) {
    const len = this.trail.length;
    ctx.save();
    for (let i = 1; i < len; i++) {
      const t0 = this.trail[i - 1];
      const t1 = this.trail[i];
      const frac = i / len;
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = frac * 0.35;
      ctx.lineWidth   = frac * this.size * 0.8;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawShip(ctx, glowEnabled) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (glowEnabled) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 8;
    }

    // Ship silhouette — tiny fighter shape
    const s = this.size;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;

    ctx.beginPath();
    ctx.moveTo(0,    -s * 2.2);   // nose
    ctx.lineTo( s,    s * 0.8);   // right wing
    ctx.lineTo( s * 0.4, s * 0.4);
    ctx.lineTo(0,    s * 1.2);    // engine
    ctx.lineTo(-s * 0.4, s * 0.4);
    ctx.lineTo(-s,   s * 0.8);    // left wing
    ctx.closePath();
    ctx.fill();

    // Engine glow dot
    if (glowEnabled) {
      ctx.shadowBlur = 14;
      ctx.fillStyle  = '#ffffff';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, s * 1.2, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
