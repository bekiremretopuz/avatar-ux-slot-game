# Avatar UX Slot Game

**Playable demo:** [https://bekiremretopuz.github.io/avatar-ux-slot-game/](https://bekiremretopuz.github.io/avatar-ux-slot-game/)

## Project Overview

Key flow:

- The game starts with a preload screen & splash screen and asset loading sequence
- The main scene displays animated backgrounds, a character, and the slot machine grid
- The player taps the spin button to start a new spin
- Winning combinations are highlighted and displayed with visual win effects
- The balance is updated dynamically through the UI overlay

## Technology Stack

- `TypeScript` — type-safe development
- `Vite` — fast dev server and production build tool
- `Pixi.js` — 2D rendering and scene management
- `GSAP` — animation timelines and delayed actions
- `React` — overlay UI rendered on top of Pixi canvas
- `@esotericsoftware/spine-pixi-v8` — Spine animation support
- `vite-plugin-static-copy` — copies static assets into `dist/`
- Implements Dependency Injection `(DI)` via a custom @Inject decorator to manage singletons and decouple game components.

## Project Structure

```
./
├── assets/                   # Game graphics and Spine assets
├── src/
│   ├── core/                 # Engine bootstrap and shared systems
│   │   ├── CoreBoot.tsx      # Pixi initialization, UI boot, asset loading
│   │   ├── managers/         # Asset, display, and event managers
│   │   ├── dom-components/   # React-based overlay UI
│   ├── game/                 # Game features and components
│   │   ├── components/       # Slot machine, character, background
│   │   ├── misc/             # Constants and spin math
│   │   ├── scenes/           # Splash and main game scenes
│   │   └── utils/            # Asset manifest
│   ├── Game.ts               # Main game class
│   ├── main.ts               # Application entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
```

## How It Works

### Startup Flow

1. `main.ts` creates the `Game` instance
2. `Game` initializes `CoreBoot` and starts `SplashScreen`
3. `CoreBoot` prepares Pixi, React UI, and the event system
4. `AssetLoader` loads `splash` assets first, then full `game` assets
5. When loading is complete, the main game scene is displayed

### Gameplay Flow

- The player clicks the spin button
- `SlotMechanism` generates a mock spin result
- `Machine` spins the reels
- After 3.5 seconds, the spin either stops automatically or can be triggered with quick stop
- When the spin finishes, winning symbols are highlighted and `FloatingWinText` animates the payout
- The balance is updated through the React `GameUI`
- This slot machine uses a 243 Ways to Win payout system, calculated by multiplying the frequency of matching symbols across consecutive reels from left to right, starting from the first reel.

## Core Components

### `src/core/CoreBoot.tsx`

- Initializes the Pixi application
- Attaches the Pixi canvas to the DOM
- Mounts the React overlay UI
- Loads asset bundles using `AssetLoader`
- Creates a shared `EventContext`

### `src/core/managers/AssetLoader.ts`

- Registers the asset manifest with Pixi
- Loads named bundles from the manifest
- Prevents bundles from loading multiple times

### `src/core/managers/EventManager.ts`

- Provides typed event dispatching for game systems
- Supports `on`, `off`, `once`, `emit`, and `wait`
- Enables decoupled communication between components

### `src/core/dom-components/GameUI.tsx`

- Displays balance, win amount, and bet information
- Hosts the `SpinButton` overlay
- Accepts external updates via `updateUIBalance`, `updateUIWin`, and `updateUIBet`

### `src/game/scenes/MainScene.ts`

- Composes `BackgroundAnimations`, `CharacterAnimations`, and `SlotMechanism`
- Builds the game’s primary visual stage

### `src/game/components/slot/SlotMechanism.ts`

- Renders the slot machine frame and reel container
- Manages spin lifecycle and stop logic
- Triggers win celebration effects

### `src/game/components/slot/Machine.ts`

- Controls the 5-column, 3-row slot mechanism
- Tracks reel states and stop progression
- Emits animation status events for the game loop

### `src/game/misc/const.ts`

- Defines default game settings and UI constants
- Stores `GAME_CONFIG` values such as initial credits and bet amount
- Defines `REEL_CONFIGS` for symbol sizing, reel layout, and spin physics

## Visual and Animation Features

- `BackgroundAnimations` animates moving clouds, HUD elements, and decorative visuals
- `CharacterAnimations` plays Spine-based character motions such as idle and win states
- `FloatingWinText` presents payout animation on the screen
- A masked reel window keeps spinning symbols contained within the machine frame

## Asset Manifest

The asset manifest declares two bundles in `src/game/utils/assetsManifest.ts`:

- `splash` bundle: splash screen assets and background atlas
- `game` bundle: slot frame, background atlas, HUD atlas, symbol atlas, Spine character assets

## Setup

### Requirements

- Node.js v18+
- npm

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

> The `vite.config.ts` plugin copies `assets/` into `dist/assets/`, so the built output preserves the asset folder structure.

## Extension Ideas

- Extend slot logic to support bonus features
