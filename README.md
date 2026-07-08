# Geometry Maze — Co-op

A Geometry Dash–styled cooperative maze puzzler. Two shapes share one keyboard and have to
work together to escape each level — neither can make it alone.

![Two shapes, one keyboard](https://img.shields.io/badge/players-2%20(local%20co--op)-blueviolet)

## How to play

| Player | Shape | Controls | Special ability |
| --- | --- | --- | --- |
| 1 | 🟧 Square | `W` `A` `S` `D` or controller 1 | Heavy — the only shape that can press orange **heavy plates** |
| 2 | 🔵 Circle | `↑` `←` `↓` `→` or controller 2 | Nimble — the only shape that fits through **narrow gaps** |

**🎮 Controller support:** pair one or two Bluetooth (or USB) controllers and press any button so
the browser detects them. The first controller drives the Square, the second the Circle — the
keyboard always stays live, so keyboard + one controller is a great two-player setup. Left stick
or D-pad moves, **Start** restarts the level, **Select/Back** swaps which shape a controller
drives. Works with any standard-mapping gamepad (Xbox, PlayStation, Switch Pro, most Bluetooth
pads).

- **Plates** (glowing rings) hold their matching **door** open only while someone stands on them —
  you'll constantly take turns holding doors for each other.
- **Spikes** reset both players to the start of the level. Teamwork means shared consequences.
- A level is cleared when **both** shapes stand on their matching exit pads at the same time.
- `R` restarts the current level.

Three levels ship in this first version: *First Steps*, *Spike Garden*, and *The Gauntlet*.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static production build in `dist/`.

## Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- All game logic and rendering in a single `<canvas>` game loop (`src/game/GameCanvas.tsx`)
- Levels are plain ASCII maps in `src/game/levels.ts` — adding a level is just adding strings:

```
#  wall        .  floor       S / C  square & circle spawns
1 / 2  exit pads               ^  spikes
a b d  plates   A B D  doors   h / H  heavy plate & door (square only)
~  narrow gap (circle only)
```

## Roadmap ideas

- Online co-op (two browsers) via Firebase or WebSockets
- More shapes (triangle that can break cracked walls?)
- Timers, toggle switches, moving hazards, pushable blocks
- Level editor + shareable level codes
