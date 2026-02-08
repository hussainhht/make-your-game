# REBOOT - Fighting Game

A browser-based 2D fighting game with advanced defense mechanics, multiple game modes, and character progression.

## Live Demo

Once GitHub Pages is enabled, your game will be available at:

https://<username>.github.io/<repo>/

### Enable GitHub Pages

1. Go to **Settings → Pages** in your repository.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Set **Branch** to **main** and **Folder** to **/docs**.
4. Click **Save** and wait for the deployment to finish.

## Features

- **Multiple Game Modes**
  - Story Mode: Narrative-driven progression
  - Arcade Mode: Classic versus battles
  - Tower Mode: 7-floor challenge gauntlet
  - Training Mode: Practice with DPS tracking

- **Advanced Combat System**
  - Perfect blocking and parrying
  - Guard meter and guard breaks
  - Multiple attack types (light, medium, heavy)
  - Stamina-based escape options (backdash, roll, dodge)
  - Defense system with blockstun and chip damage

- **Character Roster**
  - 10 playable characters with unique sprites
  - Sprite-based animation system
  - Character-specific stats (strength, speed, defense)

## Quick Start

1. **Run Local Server**

   ```bash
   cd docs
   python3 -m http.server 8000
   ```

2. **Open in Browser**

   ```
   http://localhost:8000/index.html
   ```

3. **Select Character & Mode**
   - Choose from 10 unlocked fighters
   - Pick your game mode
   - Configure difficulty and rounds

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md) - Complete technical documentation
- [Combat System](docs/COMBAT_SYSTEM.md) - Advanced combat mechanics guide
- [Brainstorming](docs/brainstorming.md) - Design notes and resources

## Project Structure

```
├── docs/                  # Documentation
├── game/
│   ├── arcade.html       # Arcade mode
│   ├── index.html        # Character selection
│   ├── story.html        # Story mode
│   ├── tower.html        # Tower mode
│   ├── assets/           # Game assets
│   │   ├── sprites2/     # Fighter sprites
│   │   ├── sprites3/     # Advanced fighter sprites
│   │   ├── characters/   # Character portraits
│   │   ├── maps/         # Background maps
│   │   └── ui/           # UI elements
│   ├── css/              # Stylesheets
│   └── js/               # Game logic
│       ├── core/         # Engine, physics, input
│       ├── entities/     # Fighters, enemies, player
│       ├── ui/           # HUD, menus, styles
│       └── story/        # Story mode logic
```

## Controls

- **A/D** - Move Left/Right
- **W** - Jump
- **S** - Crouch
- **Space** - Attack
- **U** - Heavy Attack
- **Shift** - Block
- **L** - Parry
- **Q** - Backdash
- **E** - Roll
- **R** - Dodge
- **ESC** - Pause

## Technical Details

- Pure JavaScript (ES6 modules)
- DOM-based rendering
- No build step required
- Modern browser required (ES6 support)

## Credits

- Sprite assets from various public sources
- Built with vanilla JavaScript
- Character designs inspired by classic fighting games
