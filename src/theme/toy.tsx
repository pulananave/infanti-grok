import type { MeshPhysicalMaterialProps, MeshStandardMaterialProps } from '@react-three/fiber'

export const TOY = {
  mint: '#8ee0c4',
  sage: '#b7e3c0',
  babyBlue: '#9fd6f2',
  sky: '#c8e8f8',
  peach: '#ffc9a8',
  coral: '#ff8fa3',
  pink: '#ffb3d1',
  lemon: '#ffe56a',
  cream: '#fff4d6',
  lavender: '#d4b8f0',
  lilac: '#c9b6ff',
  trunk: '#c48a5a',
  fruit: '#ff6b7a',
  cloud: '#fff8f0',
  spotlight: '#ffb070',
  ink: '#4a3270',
  wall: '#b7ddf4',
} as const

const TILE_CYCLE = [TOY.peach, TOY.mint, TOY.babyBlue, TOY.lavender, TOY.sage, TOY.cream, TOY.pink] as const

export function tileColor(ix: number, iz: number, accent: string, floor: string): string {
  if ((ix + iz) % 7 === 0) return mixHex(floor, accent, 0.28)
  return TILE_CYCLE[(ix * 3 + iz * 5) % TILE_CYCLE.length]
}

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a)
  const [br, bg, bb] = parseHex(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bch = Math.round(ab + (bb - ab) * t)
  return `#${[r, g, bch].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

type ToyMatProps = {
  color: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  silicone?: boolean
  glow?: boolean
}

export function ToyMaterial({
  color,
  opacity = 1,
  emissive = '#000000',
  emissiveIntensity = 0,
  silicone = false,
  glow = false,
}: ToyMatProps) {
  const shared = {
    color,
    roughness: glow ? 0.42 : 0.98,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    emissive: glow ? (emissive === '#000000' ? color : emissive) : emissive,
    emissiveIntensity: glow ? Math.max(emissiveIntensity, 0.9) : emissiveIntensity,
    toneMapped: !glow,
    envMapIntensity: 0,
  } satisfies MeshStandardMaterialProps

  if (silicone) {
    return (
      <meshPhysicalMaterial
        {...(shared as MeshPhysicalMaterialProps)}
        sheen={0.42}
        sheenRoughness={0.92}
        sheenColor={color}
        transmission={glow ? 0 : 0.045}
        thickness={0.55}
        attenuationColor={color}
        attenuationDistance={1.35}
        clearcoat={0}
      />
    )
  }

  return <meshStandardMaterial {...shared} />
}
