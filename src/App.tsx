import { useState } from 'react'
import GameCanvas from './game/GameCanvas'
import { LEVELS } from './game/levels'

export interface HudState {
  levelIndex: number
  deaths: number
  won: boolean
}

export default function App() {
  const [hud, setHud] = useState<HudState>({ levelIndex: 0, deaths: 0, won: false })
  const level = LEVELS[Math.min(hud.levelIndex, LEVELS.length - 1)]

  return (
    <>
      <h1 className="title">Geometry Maze</h1>
      <div className="subtitle">A co-op puzzle maze — two shapes, one keyboard</div>
      <div className="hud">
        <span className="level-name">
          {hud.won ? 'Maze conquered!' : `Level ${hud.levelIndex + 1}/${LEVELS.length} — ${level.name}`}
        </span>
        <span className="deaths">Wipeouts: {hud.deaths}</span>
      </div>
      <GameCanvas onHudChange={setHud} />
      <div className="hint">{hud.won ? 'Press Enter to play again from Level 1.' : level.hint}</div>
      <div className="controls">
        <span className="p1">
          <b>■ Square</b> — <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · heavy: only it can press orange plates
        </span>
        <span className="p2">
          <b>● Circle</b> — <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> · nimble: slips through narrow gaps
        </span>
        <span>
          <kbd>R</kbd> restart level
        </span>
      </div>
    </>
  )
}
