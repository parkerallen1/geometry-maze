import { useState } from 'react'
import GameCanvas from './game/GameCanvas'
import Tutorial from './Tutorial'
import { LEVELS } from './game/levels'

export interface HudState {
  levelIndex: number
  deaths: number
  won: boolean
}

const TUTORIAL_SEEN_KEY = 'geo-maze-tutorial-seen'

export default function App() {
  const [hud, setHud] = useState<HudState>({ levelIndex: 0, deaths: 0, won: false })
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem(TUTORIAL_SEEN_KEY))
  const level = LEVELS[Math.min(hud.levelIndex, LEVELS.length - 1)]

  const closeTutorial = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1')
    setShowTutorial(false)
  }

  return (
    <>
      <h1 className="title">Geometry Maze</h1>
      <div className="subtitle">A co-op puzzle maze — two shapes, one keyboard</div>
      <div className="hud">
        <span className="level-name">
          {hud.won ? 'Maze conquered!' : `Level ${hud.levelIndex + 1}/${LEVELS.length} — ${level.name}`}
        </span>
        <span className="deaths">Wipeouts: {hud.deaths}</span>
        <button className="btn btn-howto" onClick={() => setShowTutorial(true)}>
          ❓ How to Play
        </button>
      </div>
      <GameCanvas onHudChange={setHud} paused={showTutorial} />
      <div className="hint">{hud.won ? 'Press Enter to play again from Level 1.' : level.hint}</div>
      <div className="controls">
        <span className="p1">
          <b>■ Square</b> — <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
        </span>
        <span className="p2">
          <b>● Circle</b> — <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd>
        </span>
        <span>
          <kbd>R</kbd> restart level
        </span>
      </div>
      {showTutorial && <Tutorial onClose={closeTutorial} />}
    </>
  )
}
