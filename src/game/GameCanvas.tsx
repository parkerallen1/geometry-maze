import { useEffect, useRef } from 'react'
import { LEVELS } from './levels'
import type { HudState } from '../App'

const T = 48 // tile size in px

type Kind = 'square' | 'circle'

interface Player {
  kind: Kind
  x: number // center, px
  y: number
  half: number // half-size for collision
  speed: number // px per second
  color: string
  glow: string
  dist: number // distance travelled, drives spin animation
  trail: { x: number; y: number; age: number }[]
}

interface Cell {
  r: number
  c: number
}

interface ParsedLevel {
  rows: number
  cols: number
  grid: string[][]
  squareSpawn: Cell
  circleSpawn: Cell
  doors: Map<string, Cell[]> // 'A' -> door tiles
  plates: Map<string, Cell[]> // 'a' -> plate tiles
  spikes: Cell[]
}

type Status = 'playing' | 'dead' | 'levelComplete' | 'won'

const DOOR_COLORS: Record<string, string> = {
  A: '#f5d90a',
  B: '#b26bff',
  D: '#3ddc84',
  H: '#ff8c3a',
}

function doorColor(letter: string): string {
  return DOOR_COLORS[letter.toUpperCase()] ?? '#f5d90a'
}

function parseLevel(map: string[]): ParsedLevel {
  const rows = map.length
  const cols = map[0].length
  const grid: string[][] = map.map((line) => line.split(''))
  const doors = new Map<string, Cell[]>()
  const plates = new Map<string, Cell[]>()
  const spikes: Cell[] = []
  let squareSpawn: Cell = { r: 1, c: 1 }
  let circleSpawn: Cell = { r: 2, c: 1 }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c]
      if (ch === 'S') squareSpawn = { r, c }
      else if (ch === 'C') circleSpawn = { r, c }
      else if (ch === '^') spikes.push({ r, c })
      else if (/[abdh]/.test(ch)) {
        if (!plates.has(ch)) plates.set(ch, [])
        plates.get(ch)!.push({ r, c })
      } else if (/[ABDH]/.test(ch)) {
        if (!doors.has(ch)) doors.set(ch, [])
        doors.get(ch)!.push({ r, c })
      }
    }
  }
  return { rows, cols, grid, squareSpawn, circleSpawn, doors, plates, spikes }
}

function centerOf(cell: Cell): { x: number; y: number } {
  return { x: cell.c * T + T / 2, y: cell.r * T + T / 2 }
}

interface Props {
  onHudChange: (hud: HudState) => void
  paused?: boolean
}

export default function GameCanvas({ onHudChange, paused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hudRef = useRef(onHudChange)
  hudRef.current = onHudChange
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    // ---- mutable game state ----
    let levelIndex = 0
    let level = parseLevel(LEVELS[0].map)
    let deaths = 0
    let status: Status = 'playing'
    let statusTimer = 0 // seconds left in dead / levelComplete states
    let time = 0

    const square: Player = {
      kind: 'square', x: 0, y: 0, half: 16, speed: 200,
      color: '#ffb020', glow: 'rgba(255,176,32,0.9)', dist: 0, trail: [],
    }
    const circle: Player = {
      kind: 'circle', x: 0, y: 0, half: 15, speed: 235,
      color: '#39d8ff', glow: 'rgba(57,216,255,0.9)', dist: 0, trail: [],
    }
    const players = [square, circle]

    function pushHud() {
      hudRef.current({ levelIndex, deaths, won: status === 'won' })
    }

    function loadLevel(index: number) {
      levelIndex = index
      level = parseLevel(LEVELS[index].map)
      respawn()
      status = 'playing'
      canvas.width = level.cols * T
      canvas.height = level.rows * T
      pushHud()
    }

    function respawn() {
      const s = centerOf(level.squareSpawn)
      const c = centerOf(level.circleSpawn)
      square.x = s.x
      square.y = s.y
      circle.x = c.x
      circle.y = c.y
      for (const p of players) p.trail = []
    }

    // ---- input ----
    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current) return // tutorial owns the keyboard while open
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
      keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key)
      if ((e.key === 'r' || e.key === 'R') && status !== 'won') loadLevel(levelIndex)
      if (e.key === 'Enter' && status === 'won') {
        deaths = 0
        loadLevel(0)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // ---- doors & plates ----
    function platePressed(cell: Cell, letter: string): boolean {
      const heavy = letter === 'h'
      const { x, y } = centerOf(cell)
      return players.some((p) => {
        if (heavy && p.kind !== 'square') return false
        return Math.abs(p.x - x) < T / 2 && Math.abs(p.y - y) < T / 2
      })
    }

    function openDoorLetters(): Set<string> {
      const open = new Set<string>()
      for (const [letter, cells] of level.plates) {
        if (cells.some((cell) => platePressed(cell, letter))) open.add(letter.toUpperCase())
      }
      // a door never slams shut on a player standing inside it
      for (const [letter, cells] of level.doors) {
        if (open.has(letter)) continue
        for (const cell of cells) {
          const { x, y } = centerOf(cell)
          if (players.some((p) => Math.abs(p.x - x) < T / 2 + p.half && Math.abs(p.y - y) < T / 2 + p.half)) {
            open.add(letter)
          }
        }
      }
      return open
    }

    function isSolidFor(p: Player, r: number, c: number, openDoors: Set<string>): boolean {
      if (r < 0 || c < 0 || r >= level.rows || c >= level.cols) return true
      const ch = level.grid[r][c]
      if (ch === '#') return true
      if (ch === '~') return p.kind === 'square'
      if (/[ABDH]/.test(ch)) return !openDoors.has(ch)
      return false
    }

    // ---- movement & collision (axis-separated AABB vs tiles) ----
    function moveAxis(p: Player, dx: number, dy: number, openDoors: Set<string>) {
      if (dx !== 0) {
        p.x += dx
        const top = Math.floor((p.y - p.half) / T)
        const bottom = Math.floor((p.y + p.half - 1) / T)
        const edge = dx > 0 ? p.x + p.half : p.x - p.half
        const col = Math.floor(edge / T)
        for (let r = top; r <= bottom; r++) {
          if (isSolidFor(p, r, col, openDoors)) {
            p.x = dx > 0 ? col * T - p.half : (col + 1) * T + p.half
            break
          }
        }
      }
      if (dy !== 0) {
        p.y += dy
        const left = Math.floor((p.x - p.half) / T)
        const right = Math.floor((p.x + p.half - 1) / T)
        const edge = dy > 0 ? p.y + p.half : p.y - p.half
        const row = Math.floor(edge / T)
        for (let c = left; c <= right; c++) {
          if (isSolidFor(p, row, c, openDoors)) {
            p.y = dy > 0 ? row * T - p.half : (row + 1) * T + p.half
            break
          }
        }
      }
    }

    function update(dt: number) {
      if (status === 'dead' || status === 'levelComplete') {
        statusTimer -= dt
        if (statusTimer <= 0) {
          if (status === 'dead') {
            respawn()
            status = 'playing'
          } else if (levelIndex + 1 < LEVELS.length) {
            loadLevel(levelIndex + 1)
          } else {
            status = 'won'
            pushHud()
          }
        }
        return
      }
      if (status !== 'playing') return

      const openDoors = openDoorLetters()
      const inputs: [Player, number, number][] = [
        [square, (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0), (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0)],
        [circle, (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0), (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0)],
      ]
      for (const [p, ix, iy] of inputs) {
        let vx = ix
        let vy = iy
        if (vx !== 0 && vy !== 0) {
          const inv = 1 / Math.SQRT2
          vx *= inv
          vy *= inv
        }
        const dx = vx * p.speed * dt
        const dy = vy * p.speed * dt
        moveAxis(p, dx, dy, openDoors)
        p.dist += Math.hypot(dx, dy)
        if (ix !== 0 || iy !== 0) {
          p.trail.push({ x: p.x, y: p.y, age: 0 })
        }
        for (const t of p.trail) t.age += dt
        p.trail = p.trail.filter((t) => t.age < 0.25)
      }

      // spikes
      for (const spike of level.spikes) {
        const { x, y } = centerOf(spike)
        for (const p of players) {
          if (Math.hypot(p.x - x, p.y - y) < 21) {
            deaths++
            status = 'dead'
            statusTimer = 0.7
            pushHud()
            return
          }
        }
      }

      // exits: both shapes on their own pad at the same time
      const onPad = (p: Player, pad: string) => {
        const r = Math.floor(p.y / T)
        const c = Math.floor(p.x / T)
        return level.grid[r]?.[c] === pad
      }
      if (onPad(square, '1') && onPad(circle, '2')) {
        status = 'levelComplete'
        statusTimer = 1.2
      }
    }

    // ---- rendering ----
    function draw() {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b0e1a'
      ctx.fillRect(0, 0, w, h)

      // subtle grid
      ctx.strokeStyle = 'rgba(80,100,180,0.08)'
      ctx.lineWidth = 1
      for (let c = 0; c <= level.cols; c++) {
        ctx.beginPath()
        ctx.moveTo(c * T, 0)
        ctx.lineTo(c * T, h)
        ctx.stroke()
      }
      for (let r = 0; r <= level.rows; r++) {
        ctx.beginPath()
        ctx.moveTo(0, r * T)
        ctx.lineTo(w, r * T)
        ctx.stroke()
      }

      const openDoors = openDoorLetters()

      for (let r = 0; r < level.rows; r++) {
        for (let c = 0; c < level.cols; c++) {
          const ch = level.grid[r][c]
          const x = c * T
          const y = r * T
          if (ch === '#') {
            ctx.fillStyle = '#1a2142'
            ctx.fillRect(x, y, T, T)
            ctx.strokeStyle = '#31407f'
            ctx.lineWidth = 2
            ctx.strokeRect(x + 1, y + 1, T - 2, T - 2)
          } else if (ch === '~') {
            // narrow gap: wall with a slim glowing slit only the circle fits through
            ctx.fillStyle = '#1a2142'
            ctx.fillRect(x, y, T, T)
            ctx.strokeStyle = '#31407f'
            ctx.lineWidth = 2
            ctx.strokeRect(x + 1, y + 1, T - 2, T - 2)
            ctx.fillStyle = '#0b0e1a'
            ctx.fillRect(x + T / 2 - 9, y, 18, T)
            ctx.fillRect(x, y + T / 2 - 9, T, 18)
            ctx.save()
            ctx.shadowColor = '#39d8ff'
            ctx.shadowBlur = 8
            ctx.strokeStyle = 'rgba(57,216,255,0.7)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.arc(x + T / 2, y + T / 2, 8, 0, Math.PI * 2)
            ctx.stroke()
            ctx.restore()
          } else if (ch === '^') {
            const pulse = 0.75 + 0.25 * Math.sin(time * 5 + (r + c))
            ctx.save()
            ctx.shadowColor = '#ff3355'
            ctx.shadowBlur = 10 * pulse
            ctx.fillStyle = `rgba(255,51,85,${0.85 * pulse})`
            for (let i = 0; i < 3; i++) {
              const sx = x + 6 + i * 13
              ctx.beginPath()
              ctx.moveTo(sx, y + T - 8)
              ctx.lineTo(sx + 5.5, y + 10)
              ctx.lineTo(sx + 11, y + T - 8)
              ctx.closePath()
              ctx.fill()
            }
            ctx.restore()
          } else if (/[abdh]/.test(ch)) {
            const pressed = platePressed({ r, c }, ch)
            const color = doorColor(ch)
            const heavy = ch === 'h'
            ctx.save()
            ctx.shadowColor = color
            ctx.shadowBlur = pressed ? 18 : 6
            ctx.strokeStyle = color
            ctx.fillStyle = pressed ? color : 'rgba(0,0,0,0)'
            ctx.lineWidth = 3
            if (heavy) {
              // heavy plates are square-shaped: only the Square can press them
              ctx.strokeRect(x + 12, y + 12, T - 24, T - 24)
              if (pressed) ctx.fillRect(x + 12, y + 12, T - 24, T - 24)
            } else {
              ctx.beginPath()
              ctx.arc(x + T / 2, y + T / 2, 12, 0, Math.PI * 2)
              if (pressed) ctx.fill()
              ctx.stroke()
            }
            ctx.restore()
          } else if (/[ABDH]/.test(ch)) {
            const color = doorColor(ch)
            const open = openDoors.has(ch)
            ctx.save()
            if (open) {
              ctx.strokeStyle = color
              ctx.globalAlpha = 0.45
              ctx.lineWidth = 2
              ctx.setLineDash([5, 6])
              ctx.strokeRect(x + 6, y + 6, T - 12, T - 12)
            } else {
              ctx.shadowColor = color
              ctx.shadowBlur = 12
              ctx.fillStyle = color
              ctx.globalAlpha = 0.9
              ctx.fillRect(x + 4, y + 4, T - 8, T - 8)
              ctx.globalAlpha = 1
              ctx.fillStyle = '#0b0e1a'
              ctx.font = `bold 20px 'Segoe UI', sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(ch, x + T / 2, y + T / 2 + 1)
            }
            ctx.restore()
          } else if (ch === '1' || ch === '2') {
            const p = ch === '1' ? square : circle
            const pulse = 0.6 + 0.4 * Math.sin(time * 3)
            ctx.save()
            ctx.shadowColor = p.color
            ctx.shadowBlur = 12 * pulse
            ctx.strokeStyle = p.color
            ctx.globalAlpha = 0.9
            ctx.lineWidth = 3
            if (ch === '1') {
              ctx.strokeRect(x + 10, y + 10, T - 20, T - 20)
              ctx.globalAlpha = 0.18 * pulse
              ctx.fillStyle = p.color
              ctx.fillRect(x + 10, y + 10, T - 20, T - 20)
            } else {
              ctx.beginPath()
              ctx.arc(x + T / 2, y + T / 2, 14, 0, Math.PI * 2)
              ctx.stroke()
              ctx.globalAlpha = 0.18 * pulse
              ctx.fillStyle = p.color
              ctx.fill()
            }
            ctx.restore()
          }
        }
      }

      // trails
      for (const p of players) {
        for (const t of p.trail) {
          const a = 0.25 * (1 - t.age / 0.25)
          ctx.fillStyle = p.kind === 'square' ? `rgba(255,176,32,${a})` : `rgba(57,216,255,${a})`
          ctx.beginPath()
          ctx.arc(t.x, t.y, p.half * 0.6 * (1 - t.age / 0.25), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // players
      for (const p of players) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.shadowColor = p.glow
        ctx.shadowBlur = 16
        ctx.fillStyle = p.color
        if (p.kind === 'square') {
          // gentle GD-style tilt while rolling along
          ctx.rotate(Math.sin(p.dist / 40) * 0.14)
          ctx.fillRect(-p.half, -p.half, p.half * 2, p.half * 2)
          ctx.shadowBlur = 0
          ctx.fillStyle = '#0b0e1a'
          ctx.fillRect(-9, -6, 5, 9)
          ctx.fillRect(4, -6, 5, 9)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.half, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.rotate(p.dist / 20)
          ctx.fillStyle = '#0b0e1a'
          ctx.beginPath()
          ctx.arc(0, -6, 3.5, 0, Math.PI * 2)
          ctx.arc(0, 6, 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // status overlays
      if (status === 'dead') {
        ctx.fillStyle = `rgba(255,51,85,${0.3 * (statusTimer / 0.7)})`
        ctx.fillRect(0, 0, w, h)
      } else if (status === 'levelComplete') {
        ctx.fillStyle = 'rgba(11,14,26,0.55)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#e8ecff'
        ctx.font = `bold 34px 'Segoe UI', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Level complete!', w / 2, h / 2)
      } else if (status === 'won') {
        ctx.fillStyle = 'rgba(11,14,26,0.75)'
        ctx.fillRect(0, 0, w, h)
        ctx.save()
        ctx.shadowColor = '#39d8ff'
        ctx.shadowBlur = 24
        ctx.fillStyle = '#e8ecff'
        ctx.font = `bold 40px 'Segoe UI', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('You conquered the maze!', w / 2, h / 2 - 24)
        ctx.shadowBlur = 0
        ctx.font = `18px 'Segoe UI', sans-serif`
        ctx.fillStyle = '#9aa3c7'
        ctx.fillText(`Teamwork wins. Wipeouts: ${deaths} — press Enter to play again`, w / 2, h / 2 + 24)
        ctx.restore()
      }
    }

    // ---- main loop ----
    let raf = 0
    let last = performance.now()
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      time += dt
      if (pausedRef.current) {
        keys.clear() // drop any held keys so nothing "sticks" after unpausing
      } else {
        update(dt)
      }
      draw()
      // debug hook for automated playtests
      ;(window as any).__GEO_DEBUG = {
        levelIndex,
        status,
        deaths,
        square: { x: square.x, y: square.y },
        circle: { x: circle.x, y: circle.y },
      }
      raf = requestAnimationFrame(frame)
    }

    loadLevel(0)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return <canvas ref={canvasRef} width={960} height={576} />
}
