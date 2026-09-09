import type { MeshPhysicalMaterialProps } from '@react-three/fiber'
import { STAGE_LOOK } from './stageLook'

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

/** Cheap deterministic roughness/clearcoat/tint so the grid is not one identical shader. */
export function tileSurface(ix: number, iz: number): { roughness: number; clearcoat: number; tint: number } {
  const n = (ix * 19 + iz * 37) % 16
  return {
    roughness: 0.64 + (n / 15) * 0.18,
    clearcoat: 0.16 + ((n * 3) % 8) * 0.016,
    tint: (n % 7) / 110,
  }
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
  roughness?: number
  clearcoat?: number
}

export function ToyMaterial({
  color,
  opacity = 1,
  emissive = '#000000',
  emissiveIntensity = 0,
  silicone = true,
  glow = false,
  roughness,
  clearcoat,
}: ToyMatProps) {
  const rough = roughness ?? (glow ? STAGE_LOOK.roughnessGlow : STAGE_LOOK.roughness)
  const coat = clearcoat ?? (glow ? STAGE_LOOK.clearcoatGlow : STAGE_LOOK.clearcoat)
  const emitColor = glow && emissive === '#000000' ? color : emissive
  const emit = glow ? (emissiveIntensity > 0 ? emissiveIntensity : STAGE_LOOK.glowDefault) : emissiveIntensity

  const props = {
    color,
    roughness: rough,
    metalness: 0,
    clearcoat: coat,
    clearcoatRoughness: 0.48,
    sheen: silicone ? STAGE_LOOK.sheen : 0.06,
    sheenRoughness: 0.8,
    sheenColor: color,
    ior: 1.4,
    specularIntensity: 0.32,
    envMapIntensity: glow ? 0.12 : STAGE_LOOK.envMapIntensity,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    emissive: emitColor,
    emissiveIntensity: emit,
    toneMapped: !glow,
  } satisfies MeshPhysicalMaterialProps

  return <meshPhysicalMaterial {...props} />
}
