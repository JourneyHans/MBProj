# Release Notes

## [v0.1.0-alpha] - 2026-03-13

### 🎮 Features
- **Core Gameplay**: Complete minesweeper implementation
  - Left-click to reveal cells
  - Right-click to flag mines
  - First-click safety (mines generated after first click)
  - Auto-reveal empty cells (flood fill)
  - Win/lose conditions

- **Rendering**: Canvas-based grid rendering
  - Color-coded numbers (1-8)
  - Visual feedback for different cell states
  - Smooth 60 FPS rendering

- **UI/UX**:
  - Main menu
  - HUD (mine counter, timer)
  - Victory/Game over dialogs
  - Clean, dark theme interface

### 🏗️ Technical
- ES6 modules with modern JavaScript
- Event-driven architecture (EventBus)
- State management system
- Game loop with requestAnimationFrame
- Modular, maintainable code structure

### 🐛 Known Issues
- No card system yet (planned for v0.2.0)
- No roguelike elements (planned for v0.3.0)
- Basic visuals without assets
- No sound effects
- No mobile touch optimization

### 🔧 Browser Support
- Chrome/Edge: ✅ Fully tested
- Firefox: ✅ Fully tested
- Safari: ⚠️ Basic testing
- Mobile browsers: ⚠️ Limited support

### 📊 Performance
- First Load: ~1.5s
- Runtime FPS: 60
- Bundle Size: ~15KB (uncompressed)

### 🎯 Next Release (v0.2.0-alpha)
- Card system implementation
- Deck building mechanics
- Basic card effects
- Energy system

---

## Version History

### Upcoming
- v0.2.0-alpha - Card System Foundation
- v0.3.0-alpha - Roguelike Core
- v0.4.0-beta - Content Polish
- v1.0.0 - Official Release
