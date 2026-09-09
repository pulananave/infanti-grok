import type { MeshPhysicalMaterialProps } from '@react-three/fiber'
import { STAGE_LOOK } from './stageLook'
import { getToyNormalMap, normalScale } from './toyNormals'

/**
 * Kawaii toy-stage palette (official set reference).
 * Sky blue walls/blocks, mint foliage, candy pink, lemon glow,
 * peach accents, cream clouds. No brown wood, tan, or muddy grey.
 */
export const TOY = {
  mint: '#7ee8c4',
  sage: '#9ee8b0',
  babyBlue: '#7ed4f8',
  sky: '#8fd6fa',
  peach: '#ffb892',
  coral: '#ff7a96',
  pink: '#ff8dc7',
  lemon: '#ffe56a',
  cream: '#fff8ee',
  lavender: '#d2b4f8',
  lilac: '#c4b0ff',
  trunk: '#ffc08a',
  fruit: '#ff7a6a',
  cloud: '#fffcf6',
  spotlight: '#ffc078',
  ink: '#4a3a78',
  wall: '#8fd4f6',
} as const

const TILE_CYCLE = [TOY.babyBlue, TOY.mint, TOY.peach, TOY.pink, TOY.sky, TOY.sage, TOY.lavender] as const

/** Bias a song-theme hex toward the kawaii set so earthy themes cannot muddy the stage. */
export function kawaiiTint(hex: string, toward: string = TOY.sky, amount = 0.55): string {
  return mixHex(hex, toward, amount)
}

export function tileColor(ix: number, iz: number, accent: string, floor: string): string {
  const base = TILE_CYCLE[(ix * 3 + iz * 5) % TILE_CYCLE.length]
  // Theme only tints — never replaces the pastel checkerboard.
  if ((ix + iz) % 7 === 0) return mixHex(base, mixHex(kawaiiTint(floor, TOY.sky, 0.45), accent, 0.35), 0.2)
  return mixHex(base, kawaiiTint(floor, TOY.sky, 0.65), 0.08)
}

/** Cheap deterministic roughness/clearcoat/tint so the grid is not one identical shader. */
export function tileSurface(ix: number, iz: number): { roughness: number; clearcoat: number; tint: number } {
  const n = (ix * 19 + iz * 37) % 16
  return {
    roughness: 0.52 + (n / 15) * 0.2,
    clearcoat: STAGE_LOOK.clearcoat * 0.45 + ((n * 3) % 8) * 0.02,
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
  /** 0 skips the shared clay/plush normal. */
  normalStrength?: number
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
  normalStrength,
}: ToyMatProps) {
  const rough = roughness ?? (glow ? STAGE_LOOK.roughnessGlow : STAGE_LOOK.roughness)
  const coat = clearcoat ?? (glow ? STAGE_LOOK.clearcoatGlow : STAGE_LOOK.clearcoat)
  const emitColor = glow && emissive === '#000000' ? color : emissive
  const emit = glow ? (emissiveIntensity > 0 ? emissiveIntensity : STAGE_LOOK.glowDefault) : emissiveIntensity
  const nStrength = normalStrength ?? (glow ? 0 : STAGE_LOOK.normalStrength)
  const normalMap = nStrength > 0 ? getToyNormalMap() : null

  const props = {
    color,
    roughness: rough,
    metalness: 0,
    clearcoat: coat,
    clearcoatRoughness: STAGE_LOOK.clearcoatRoughness,
    sheen: silicone ? STAGE_LOOK.sheen : 0.06,
    sheenRoughness: STAGE_LOOK.sheenRoughness,
    sheenColor: color,
    ior: 1.46,
    specularIntensity: STAGE_LOOK.specularIntensity,
    envMapIntensity: glow ? 0.1 : STAGE_LOOK.envMapIntensity,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    emissive: emitColor,
    emissiveIntensity: emit,
    toneMapped: !glow,
    ...(normalMap
      ? {
          normalMap,
          normalScale: normalScale(nStrength),
        }
      : {}),
  } satisfies MeshPhysicalMaterialProps

  return <meshPhysicalMaterial {...props} />
}
