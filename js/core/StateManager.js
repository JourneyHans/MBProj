/**
 * StateManager - Game State Management
 * Manages game state transitions and state stack
 */

import CONFIG from '../config.js';
import EventBus from './EventBus.js';

class StateManager {
  constructor() {
    this.currentState = CONFIG.gameState.MENU;
    this.stateStack = [];
    this.stateData = {};
  }

  /**
   * Transition to a new state
   * @param {string} newState - New state to transition to
   * @param {Object} data - Optional data to pass to the new state
   */
  transition(newState, data = {}) {
    const oldState = this.currentState;

    // Emit state change event
    EventBus.emit('stateChanging', { oldState, newState, data });

    this.currentState = newState;
    this.stateData = data;

    // Emit state changed event
    EventBus.emit('stateChanged', { oldState, newState, data });
  }

  /**
   * Push a new state onto the stack (for temporary states like dialogs)
   * @param {string} newState - New state to push
   * @param {Object} data - Optional data to pass to the new state
   */
  pushState(newState, data = {}) {
    this.stateStack.push(this.currentState);
    this.transition(newState, data);
  }

  /**
   * Pop the current state and return to the previous state
   */
  popState() {
    const previousState = this.stateStack.pop();
    if (previousState) {
      this.transition(previousState);
    } else {
      console.warn('No previous state to pop to');
    }
  }

  /**
   * Check if player can interact with the game
   * @returns {boolean} True if interaction is allowed
   */
  canInteract() {
    return this.currentState === CONFIG.gameState.PLAYING;
  }

  /**
   * Get the current state
   * @returns {string} Current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get data for the current state
   * @returns {Object} Current state data
   */
  getStateData() {
    return this.stateData;
  }

  /**
   * Check if currently in a specific state
   * @param {string} state - State to check
   * @returns {boolean} True if currently in the given state
   */
  isState(state) {
    return this.currentState === state;
  }

  /**
   * Reset to menu state
   */
  resetToMenu() {
    this.stateStack = [];
    this.transition(CONFIG.gameState.MENU);
  }
}

// Export for ES6 modules
export default StateManager;
