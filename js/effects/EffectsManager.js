/**
 * EffectsManager - Lightweight overlay-canvas particle / animation system.
 *
 * Creates a transparent <canvas> layered on top of the game canvas inside
 * #canvas-container. All visual juice (click pulse, damage numbers, spawn pop,
 * blocking aura) is rendered here so the grid renderer stays untouched.
 *
 * Usage:
 *   import EffectsManager from '../effects/EffectsManager.js';
 *   const fx = new EffectsManager();
 *   fx.attach(document.getElementById('canvas-container'));
 *   fx.spawnEffect('cellPulse', { x: 120, y: 80 });
 */

class EffectsManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._effects = [];       // active short-lifecycle effects
    this._persistent = [];    // long-lived highlights (e.g. blocking border)
    this._raf = null;
    this._running = false;
    this._canvasScale = 1;
  }

  /**
   * Create the overlay canvas and start the render loop.
   * @param {HTMLElement} container - typically #canvas-container
   */
  attach(container) {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'effects-canvas';
    this.canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this._running = true;
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  /** Sync overlay size with the game canvas underneath. */
  syncSize(gameCanvas) {
    if (!this.canvas || !gameCanvas) return;
    this.canvas.width = gameCanvas.width;
    this.canvas.height = gameCanvas.height;
    this.canvas.style.width = gameCanvas.style.width || '';
    this.canvas.style.height = gameCanvas.style.height || '';
  }

  /** Update the CSS transform scale so hit-positions remain consistent. */
  setScale(scale) {
    this._canvasScale = scale;
  }

  // ── Effect Spawners ───────────────────────────────────────────────────

  /**
   * Click pulse ring at a cell center.
   * @param {number} x - Canvas-space x
   * @param {number} y - Canvas-space y
   * @param {object} opts - Optional tuning values
   */
  spawnCellPulse(x, y, opts = {}) {
    const maxRadius = opts.maxRadius ?? 22;
    const maxAge = opts.maxAge ?? 200;
    const baseAlpha = opts.alpha ?? 0.55;
    const lineWidth = opts.lineWidth ?? 2.5;
    const color = opts.color ?? '90, 200, 255';

    this.spawnEffect({
      type: 'cellPulse',
      x,
      y,
      maxAge,
      draw(ctx, age, life, e) {
        const t = Math.max(0, Math.min(1, age / life));
        const eased = 1 - Math.pow(1 - t, 2); // ease-out
        const radius = 4 + maxRadius * eased;
        const alpha = baseAlpha * (1 - t);

        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    });
  }

  /**
   * Generic spawner – pushes an effect descriptor into the queue.
   * Each descriptor must have { type, x, y, age: 0, maxAge, draw(ctx, age, maxAge) }
   */
  spawnEffect(descriptor) {
    if (descriptor) {
      descriptor.age = 0;
      this._effects.push(descriptor);
    }
  }

  /** Remove all persistent effects of a given type. */
  clearPersistent(type) {
    this._persistent = this._persistent.filter(e => e.type !== type);
  }

  /** Add a persistent effect (rendered every frame until removed). */
  addPersistent(descriptor) {
    if (descriptor) this._persistent.push(descriptor);
  }

  /** Convenience: remove everything. */
  clearAll() {
    this._effects.length = 0;
    this._persistent.length = 0;
  }

  // ── Internal render loop ─────────────────────────────────────────────

  _tick(ts) {
    if (!this._running) return;

    const dt = 16; // ~60 fps nominal, actual delta not critical for juice
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Advance & draw transient effects
    for (let i = this._effects.length - 1; i >= 0; i--) {
      const e = this._effects[i];
      e.age += dt;
      if (e.age >= e.maxAge) {
        this._effects.splice(i, 1);
        continue;
      }
      if (typeof e.draw === 'function') {
        this.ctx.save();
        e.draw(this.ctx, e.age, e.maxAge, e);
        this.ctx.restore();
      }
    }

    // Draw persistent effects
    for (const e of this._persistent) {
      if (typeof e.draw === 'function') {
        this.ctx.save();
        e.draw(this.ctx, ts, e);
        this.ctx.restore();
      }
    }

    this._raf = requestAnimationFrame(this._tick);
  }

  destroy() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this._effects.length = 0;
    this._persistent.length = 0;
  }
}

export default EffectsManager;
