/**
 * AudioManager - Centralised sound effect playback via Howler.js.
 *
 * Howler exposes `Howl` on `window` via a classic <script> tag (no ESM build).
 * This module wraps it so the rest of the codebase stays decoupled from the
 * concrete audio library.
 *
 * Usage:
 *   import AudioManager from '../audio/AudioManager.js';
 *   AudioManager.play('reveal');
 */

const SFX_DEFINITIONS = {
  reveal:       { src: ['assets/sfx/reveal.mp3'],        volume: 0.5 },
  monsterSpawn: { src: ['assets/sfx/monster_spawn.mp3'],  volume: 0.7 },
  hit:          { src: ['assets/sfx/hit.mp3'],            volume: 0.6 },
  kill:         { src: ['assets/sfx/kill.mp3'],           volume: 0.7 },
  cardPlay:     { src: ['assets/sfx/card_play.mp3'],      volume: 0.5 },
  blocked:      { src: ['assets/sfx/blocked.mp3'],        volume: 0.4 },
  gameOver:     { src: ['assets/sfx/game_over.mp3'],      volume: 0.6 },
  victory:      { src: ['assets/sfx/victory.mp3'],        volume: 0.7 },
};

class _AudioManager {
  constructor() {
    this._howls = {};
    this._muted = false;
    this._masterVolume = 1.0;
    this._ready = false;
  }

  init() {
    if (typeof window.Howl !== 'function') {
      console.warn('[AudioManager] Howler not loaded – SFX disabled.');
      return;
    }

    for (const [key, def] of Object.entries(SFX_DEFINITIONS)) {
      try {
        this._howls[key] = new window.Howl({
          src: def.src,
          volume: (def.volume ?? 0.5) * this._masterVolume,
          preload: true,
        });
      } catch (_) {
        // Gracefully skip missing files; dev may not have all assets yet.
      }
    }
    this._ready = true;
  }

  play(name) {
    if (!this._ready || this._muted) return;
    const howl = this._howls[name];
    if (howl) {
      howl.play();
    }
  }

  setMasterVolume(v) {
    this._masterVolume = Math.max(0, Math.min(1, v));
    for (const [key, howl] of Object.entries(this._howls)) {
      const base = SFX_DEFINITIONS[key]?.volume ?? 0.5;
      howl.volume(base * this._masterVolume);
    }
  }

  mute()   { this._muted = true; }
  unmute() { this._muted = false; }
  toggleMute() { this._muted = !this._muted; }
  isMuted() { return this._muted; }
}

const AudioManager = new _AudioManager();
export default AudioManager;
