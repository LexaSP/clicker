# History Clicker (Web Version)

This is a web-based procedural clicker game inspired by Civilization and Cookie Clicker.

## Features

- **Procedural Content**: 200+ Relics, 100+ Research nodes, 300+ Ideas.
- **Era System**: Advance through Stone Age, Bronze Age, etc., with dynamic visual themes.
- **Interactive Tech Tree**: Visualize and unlock technologies with dependencies (SVG graph).
- **Daily Quests**: Randomly generated tasks (Clicks, Purchases, etc.) for rewards.
- **Prestige System**: Reset progress to gain Symbols of Era (SE) based on lifetime clicks.
- **Exponential Upgrades**: Building costs scale exponentially (Base * 1.25^Level).

## How to Run

1. Open a terminal in the `web/` directory.
2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

## File Structure

- `index.html`: Main UI layout.
- `style.css`: Styles, themes, and animations.
- `script.js`: Core game loop, state management, and logic.
- `content-gen.js`: Procedural generation algorithms.
- `devpanel.js`: Debug helpers (`dev_addClicks()`).
- `firebase-stub.js`: Mock cloud save integration.
