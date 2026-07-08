import { useEffect, useState } from 'react'

interface Props {
  onClose: () => void
}

const PAGE_COUNT = 4

export default function Tutorial({ onClose }: Props) {
  const [page, setPage] = useState(0)
  const isLast = page === PAGE_COUNT - 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, PAGE_COUNT - 1))
      else if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0))
      else if (e.key === 'Enter') {
        if (page === PAGE_COUNT - 1) onClose()
        else setPage((p) => p + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, onClose])

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <button className="tutorial-close" onClick={onClose} aria-label="Close tutorial">
          ✕
        </button>

        {page === 0 && (
          <div className="tutorial-page">
            <h2>Escape the maze — together</h2>
            <div className="demo-row demo-center">
              <span className="shape-square" />
              <span className="shape-circle" />
              <span className="demo-arrow">→</span>
              <span className="demo-exit demo-exit-square" />
              <span className="demo-exit demo-exit-circle" />
            </div>
            <ul>
              <li>
                Two shapes, one keyboard: grab a friend (or control both yourself).
              </li>
              <li>
                Clear a level by standing on your matching <b>exit pads at the same time</b>.
              </li>
              <li>
                Neither shape can make it alone — every level is built for <b>teamwork</b>.
              </li>
            </ul>
          </div>
        )}

        {page === 1 && (
          <div className="tutorial-page">
            <h2>Meet the shapes</h2>
            <div className="demo-row">
              <span className="shape-square" />
              <div className="demo-text">
                <b className="p1-color">Player 1 — Square</b>
                <span>
                  Moves with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
                </span>
                <span>
                  <b>Heavy</b>: the only shape that can press orange heavy plates{' '}
                  <span className="demo-plate demo-plate-heavy demo-inline" />
                </span>
              </div>
            </div>
            <div className="demo-row">
              <span className="shape-circle" />
              <div className="demo-text">
                <b className="p2-color">Player 2 — Circle</b>
                <span>
                  Moves with <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd>
                </span>
                <span>
                  <b>Nimble</b> and a bit faster: the only shape that fits through narrow gaps{' '}
                  <span className="demo-gap demo-inline" />
                </span>
              </div>
            </div>
            <p className="tutorial-note">
              🎮 <b>Controllers work too</b> — pair one or two Bluetooth/USB controllers and press
              any button so the browser detects them. Left stick or D-pad moves, <kbd>Start</kbd>{' '}
              restarts, <kbd>Select</kbd> swaps which shape you drive.
            </p>
          </div>
        )}

        {page === 2 && (
          <div className="tutorial-page">
            <h2>Plates hold doors open</h2>
            <div className="demo-row demo-center">
              <span className="demo-plate" />
              <span className="demo-arrow">opens</span>
              <span className="demo-door">A</span>
              <span className="demo-arrow">→</span>
              <span className="demo-door demo-door-open">A</span>
            </div>
            <ul>
              <li>
                Stand on a plate to hold the <b>matching-color door</b> open. Step off and it
                slams shut.
              </li>
              <li>
                So <b>take turns</b>: one of you holds the plate, the other walks through — then
                find the next plate and hold the door for your partner.
              </li>
              <li>
                Orange <b>square-shaped plates</b> are heavy-duty: only the Square can press them.
              </li>
            </ul>
          </div>
        )}

        {page === 3 && (
          <div className="tutorial-page">
            <h2>Dangers &amp; winning</h2>
            <div className="demo-row demo-center">
              <span className="demo-spikes">
                <i />
                <i />
                <i />
              </span>
              <span className="demo-arrow">avoid!</span>
              <span className="demo-exit demo-exit-square" />
              <span className="demo-exit demo-exit-circle" />
              <span className="demo-arrow">win!</span>
            </div>
            <ul>
              <li>
                <b>Spikes wipe out both of you</b> — back to the start of the level. Shared risk,
                shared glory.
              </li>
              <li>
                Stand on your exit pads <b>at the same time</b> to clear the level.
              </li>
              <li>
                Stuck? Press <kbd>R</kbd> to restart the level. Talk it out — every maze has an
                order that works.
              </li>
            </ul>
          </div>
        )}

        <div className="tutorial-footer">
          <button className="btn" onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>
            ← Back
          </button>
          <div className="tutorial-dots">
            {Array.from({ length: PAGE_COUNT }, (_, i) => (
              <button
                key={i}
                className={`dot${i === page ? ' active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => (isLast ? onClose() : setPage((p) => p + 1))}>
            {isLast ? "Let's play!" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
