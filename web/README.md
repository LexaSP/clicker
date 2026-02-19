# History Clicker (Web Version)

[Play Live on GitHub Pages](https://<username>.github.io/<repo>/)

This is a web-based procedural clicker game inspired by Civilization, Cookie Clicker, and Cells to Singularity.

## Features

### Core Mechanics
- **Procedural Content**: 200+ Relics, 100+ Research nodes, 300+ Ideas.
- **Era System**: Advance through Stone Age, Bronze Age, etc., with dynamic visual themes.
- **Interactive Tech Tree**: Visualize and unlock technologies with dependencies (SVG graph).
- **Dual Currency**: Unlock technologies using **Knowledge** (Science) or **Culture** (Arts).
- **Daily Quests**: Randomly generated tasks (Clicks, Purchases, Era) for rewards.
- **Prestige System (Ascension)**: Reset progress to gain Symbols of Era (SE) based on lifetime clicks. Purchase permanent upgrades like "Golden Relic Frequency".
- **Golden Relics**: Random "Golden Cookie" style events granting production frenzies or resource windfalls.

### Resource & Economy
- **Complex Resources**: Gather **Wood**, **Stone**, and **Food** via Expeditions.
- **Loot System**: Different expeditions yield different resources (Forest -> Wood, Mountain -> Stone).
- **Exponential Upgrades**: Building costs scale exponentially (Base * 1.25^Level).
- **Offline Progress**: Gain 50% of your production efficiency while away.

### Crafting & Inventory
- **Crafting System**: Use gathered resources (Wood, Stone) to craft items.
- **Recipes**: Procedurally generated recipes (e.g., Stone Tool, Health Potion).
- **Inventory**: Store Relics and Crafted Items. Relics have rarity (Common to Legendary) and unique effects (Cost Reduction, Crit Chance).

### Expedition System
- **Risk & Reward**: Choose from varying difficulties. High risk (up to 90%) means high rewards but a chance to lose everything.
- **Durations**: Short (30m), Medium (4h), Long (12h), Epic (24h) missions.
- **Reroll**: 2 Free rerolls per day to find better missions, then costs Knowledge.
- **Active Limit**: Only 1 active expedition at a time to focus gameplay.

## How to Run

1. Open a terminal in the `web/` directory.
2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

## File Structure

- `index.html`: Main UI layout with tabs for Resources, Tech, Expeditions, and Crafting.
- `style.css`: Styles, era-themes, and animations.
- `script.js`: Core game loop, state management, and logic for all systems.
- `content-gen.js`: Procedural generation algorithms for Relics, Techs, and Expeditions.
- `devpanel.js`: Debug helpers (`dev_addClicks()`).
- `firebase-stub.js`: Mock cloud save integration.
