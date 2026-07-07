// Tile legend:
//   #        wall
//   .        floor
//   S        Square spawn      C  Circle spawn
//   1        Square exit pad   2  Circle exit pad
//   ^        spikes — touch them and both players respawn
//   a b d    pressure plates (either shape can hold them down)
//   A B D    doors — open while any matching plate is held
//   h / H    heavy plate / heavy door — only the Square is heavy enough
//   ~        narrow gap — only the Circle fits through

export interface Level {
  name: string
  hint: string
  map: string[]
}

export const LEVELS: Level[] = [
  {
    name: 'First Steps',
    hint:
      'Plates (glowing pads) hold matching doors open only while someone stands on them — take turns holding the door for each other. The Circle can slip through the narrow gap to reach the far plate. Both shapes must stand on their exit pads together.',
    map: [
      '####################',
      '#S.....#....#......#',
      '#C.....#....#..1...#',
      '#..##..A....~..2...#',
      '#..#...#....#......#',
      '#..#.a.#....#......#',
      '#..#...#....#......#',
      '#..#...#.a..#..b...#',
      '#..#...#....B......#',
      '#......#....#......#',
      '#......#....#......#',
      '####################',
    ],
  },
  {
    name: 'Spike Garden',
    hint:
      'Spikes reset you both — weave carefully. The orange heavy plate only responds to the Square: park it there to hold the heavy door open so the Circle can reach its exit.',
    map: [
      '####################',
      '#S...#........#....#',
      '#C...#.^....^.B.1..#',
      '#....#........#....#',
      '#.##.#..^..^..#..###',
      '#..#.#........#..H2#',
      '#..#.A....##..#..###',
      '#.a#.#....#a..#.b..#',
      '#..#.#.^..#...#.h..#',
      '#..#.#....#.^.~....#',
      '#....#........#....#',
      '####################',
    ],
  },
  {
    name: 'The Gauntlet',
    hint:
      'Everything at once: the Square anchors the heavy plate so the Circle can cross, then the Circle works the plates on the far side to ferry the Square through. Talk it out!',
    map: [
      '####################',
      '#S...#.......#.....#',
      '#C...~...#...#..d..#',
      '#....#...#...H.....#',
      '#.##.#.^.#.^.#..##.#',
      '#.h..#...#...#..#..#',
      '#....#..##...#..#1.#',
      '#....#.b.#...#..#2.#',
      '#....B...#...D..#..#',
      '#....#..^...^#.....#',
      '#....#.......#.b...#',
      '####################',
    ],
  },
]
