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
    this._lastTs = 0;
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
      'position:absolute;top:0;left:0;pointer-events:none;z-index:30;';
    container.style.position = 'relative';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this._running = true;
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  /** Sync overlay size with the game canvas underneath. */
  syncSize(gameCanvas) {
    if (!this.canvas || !gameCanvas) return;

    const container = gameCanvas.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const canvasRect = gameCanvas.getBoundingClientRect();

    this.canvas.style.left = `${canvasRect.left - containerRect.left}px`;
    this.canvas.style.top = `${canvasRect.top - containerRect.top}px`;
    this.canvas.style.width = `${canvasRect.width}px`;
    this.canvas.style.height = `${canvasRect.height}px`;

    this.canvas.width = gameCanvas.width;
    this.canvas.height = gameCanvas.height;
  }

  /** Update the CSS transform scale so hit-positions remain consistent. */
  setScale(scale) {
    this._canvasScale = scale;
  }

  // ── Effect Spawners ───────────────────────────────────────────────────

  /** Click pulse ring at a cell center. */
  spawnCellPulse(x, y, opts = {}) {
    const maxRadius = opts.maxRadius ?? 22;
    const maxAge = opts.maxAge ?? 200;
    const baseAlpha = opts.alpha ?? 0.55;
    const lineWidth = opts.lineWidth ?? 2.5;
    const color = opts.color ?? '90, 200, 255';

    this.spawnEffect({
      type: 'cellPulse', x, y, maxAge,
      draw(ctx, age, life, e) {
        const t = age / life;
        const eased = 1 - (1 - t) * (1 - t);
        const radius = 4 + maxRadius * eased;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${baseAlpha * (1 - t)})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    });
  }

  /** Monster spawn pop: expanding red ring + brief radial glow. */
  spawnMonsterPop(x, y, cellSize, opts = {}) {
    const maxAge = opts.maxAge ?? 420;
    const color = opts.color ?? '255, 60, 60';
    const maxR = (opts.maxRadius ?? cellSize) * 0.7;

    this.spawnEffect({
      type: 'monsterPop', x, y, maxAge,
      draw(ctx, age, life, e) {
        const t = age / life;
        const easeOut = 1 - (1 - t) * (1 - t);

        const glowR = maxR * 1.2 * easeOut;
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glowR);
        grad.addColorStop(0, `rgba(${color}, ${0.35 * (1 - t)})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(e.x - glowR, e.y - glowR, glowR * 2, glowR * 2);

        const ringR = 4 + maxR * easeOut;
        ctx.beginPath();
        ctx.arc(e.x, e.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${0.7 * (1 - t)})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  }

  /** Flash a cell white (hit feedback on monster). */
  spawnDamageFlash(x, y, size, opts = {}) {
    const maxAge = opts.maxAge ?? 180;
    this.spawnEffect({
      type: 'damageFlash', x, y, maxAge, _size: size,
      draw(ctx, age, life, e) {
        const alpha = 0.65 * (1 - age / life);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(e.x, e.y, e._size, e._size);
      }
    });
  }

  /** Floating damage number that drifts upward and fades. */
  spawnFloatingText(x, y, text, opts = {}) {
    const maxAge = opts.maxAge ?? 700;
    const color = opts.color ?? '#ffe066';
    const fontSize = opts.fontSize ?? 18;
    const drift = opts.drift ?? 30;

    this.spawnEffect({
      type: 'floatingText', x, y, maxAge, _text: String(text),
      draw(ctx, age, life, e) {
        const t = age / life;
        const offsetY = -drift * t;
        const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillText(e._text, e.x, e.y + offsetY);
      }
    });
  }

  /** Full-canvas red vignette flash when the player takes damage. */
  spawnPlayerDamageFlash(opts = {}) {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const maxAge = opts.maxAge ?? 300;

    this.spawnEffect({
      type: 'playerDamageFlash', x: 0, y: 0, maxAge, _w: w, _h: h,
      draw(ctx, age, life, e) {
        const alpha = 0.3 * (1 - age / life);
        const cx = e._w / 2, cy = e._h / 2;
        const r = Math.max(cx, cy);
        const grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
        grad.addColorStop(0, 'rgba(180, 0, 0, 0)');
        grad.addColorStop(1, `rgba(180, 0, 0, ${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, e._w, e._h);
      }
    });
  }

  /**
   * Set / replace a persistent pulsing border highlight for blocking cells.
   * @param {Array<{x,y,size}>} cells - canvas-space rects
   */
  setBlockingHighlight(cells) {
    this.clearPersistent('blockingHighlight');
    if (!cells || cells.length === 0) return;

    this.addPersistent({
      type: 'blockingHighlight',
      _cells: cells,
      draw(ctx, ts, e) {
        const pulse = 0.5 + 0.5 * Math.sin(ts / 400);
        const alpha = 0.35 + 0.35 * pulse;
        ctx.strokeStyle = `rgba(255, 70, 70, ${alpha})`;
        ctx.lineWidth = 2.5;
        for (const c of e._cells) {
          ctx.strokeRect(c.x + 1, c.y + 1, c.size - 2, c.size - 2);
        }
      }
    });
  }

  // ── Generic helpers ─────────────────────────────────────────────────

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

  clearPersistent(type) {
    this._persistent = this._persistent.filter(e => e.type !== type);
  }

  addPersistent(descriptor) {
    if (descriptor) this._persistent.push(descriptor);
  }

  clearAll() {
    this._effects.length = 0;
    this._persistent.length = 0;
  }

  // ── Internal render loop ─────────────────────────────────────────────

  _tick(ts) {
    if (!this._running) return;

    const dt = this._lastTs ? Math.min(ts - this._lastTs, 50) : 16;
    this._lastTs = ts;
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
