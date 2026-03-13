/**
 * GameLoop - Main game loop using requestAnimationFrame
 */

class GameLoop {
  constructor(game) {
    this.game = game;
    this.lastTime = 0;
    this.running = false;
    this.fps = 60;
    this.frameTime = 1000 / this.fps;
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Pause the game loop
   */
  pause() {
    this.running = false;
  }

  /**
   * Resume the game loop
   */
  resume() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.tick(this.lastTime);
    }
  }

  /**
   * Main loop tick
   * @param {number} currentTime - Current timestamp
   */
  tick(currentTime) {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;

    // Update game logic
    if (deltaTime >= this.frameTime) {
      this.game.update(deltaTime);
      this.lastTime = currentTime;
    }

    // Render game
    this.game.render(currentTime);

    // Schedule next frame
    requestAnimationFrame((t) => this.tick(t));
  }

  /**
   * Check if loop is running
   * @returns {boolean} True if running
   */
  isRunning() {
    return this.running;
  }

  /**
   * Set target FPS
   * @param {number} fps - Target frames per second
   */
  setFPS(fps) {
    this.fps = fps;
    this.frameTime = 1000 / this.fps;
  }
}

// Export for ES6 modules
export default GameLoop;
