import { useLayoutEffect, useRef, type Ref } from 'react'
import { useFrame } from '@react-three/fiber'
import { GradientTexture, RoundedBox, Sparkles } from '@react-three/drei'
import { BackSide, Color, Group, MeshPhysicalMaterial } from 'three'
import { audioEngine } from '../audio/AudioEngine'
import { STAGE_BOUNDS } from '../state/sceneBridge'
import { beatToTile, FLOOR_COLS, FLOOR_ROWS, tileIndex } from '../theme/floorGrid'
import { STAGE_LOOK } from '../theme/stageLook'
import { getFloorMaps, useTexPilot, type PilotMaps } from '../theme/texPilot'
import { TOY, ToyMaterial, liftPastel, mixHex, tileColor, tileSurface } from '../theme/toy'
import type { SongTheme } from '../types'
import { BackdropUnlocks } from './BackdropUnlocks'

/** Background-only meshes (sky dome, sparkles) stay off the shadow cameras. */
function RenderLayer({ layer, children }: { layer: number; children: React.ReactNode }) {
  const group = useRef<Group>(null)
  useLayoutEffect(() => {
    const apply = () => {
      group.current?.traverse((obj) => {
        obj.layers.set(layer)
      })
    }
    apply()
    const id = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(id)
  }, [layer])
  return <group ref={group}>{children}</group>
}

const COLS = FLOOR_COLS
const ROWS = FLOOR_ROWS
const SIZE_X = STAGE_BOUNDS.x * 2
const SIZE_Z = STAGE_BOUNDS.zFront - STAGE_BOUNDS.zBack
const STEP_X = SIZE_X / COLS
const STEP_Z = SIZE_Z / ROWS
const TILE_Y = 0.2
const TILE_COUNT = COLS * ROWS
const BEAT_EMIT = 0.4
const BEAT_TINT = 0.26
const BEAT_TRAIL = 0.18
const BEAT_ATTACK = 28
const BEAT_DECAY = 12
const BEAT_HIGHLIGHT = new Color('#fff6d8')
const BEAT_EMISSIVE = new Color('#fff3c4')

function tilePos(ix: number, iz: number): [number, number, number] {
  const x = -STAGE_BOUNDS.x + STEP_X * (ix + 0.5)
  const z = STAGE_BOUNDS.zBack + STEP_Z * (iz + 0.5)
  return [x, -TILE_Y / 2, z]
}

function Block({
  args,
  radius,
  position,
  rotation,
  color,
  silicone = true,
  glow = false,
  emissive,
  emissiveIntensity,
  roughness,
  clearcoat,
  castShadow = false,
  receiveShadow = true,
  materialRef,
  maps,
}: {
  args: [number, number, number]
  radius?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  color: string
  silicone?: boolean
  glow?: boolean
  emissive?: string
  emissiveIntensity?: number
  roughness?: number
  clearcoat?: number
  castShadow?: boolean
  receiveShadow?: boolean
  materialRef?: Ref<MeshPhysicalMaterial>
  maps?: PilotMaps | null
}) {
  const maxR = Math.min(...args) * 0.42
  return (
    <RoundedBox
      args={args}
      radius={Math.min(radius ?? maxR * 0.55, maxR)}
      smoothness={STAGE_LOOK.boxSmoothness}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <ToyMaterial
        color={color}
        silicone={silicone}
        glow={glow}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={roughness}
        clearcoat={clearcoat}
        map={maps?.map}
        normalMap={maps?.normalMap}
        materialRef={materialRef}
      />
    </RoundedBox>
  )
}

function Face({ color = TOY.ink, scale = 1 }: { color?: string; scale?: number }) {
  return (
    <group scale={scale} position={[0, 0.02, 0.36]}>
      <mesh position={[-0.1, 0.06, 0]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <ToyMaterial color={color} />
      </mesh>
      <mesh position={[0.1, 0.06, 0]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <ToyMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.016, 6, 12, Math.PI]} />
        <ToyMaterial color={color} />
      </mesh>
    </group>
  )
}

function StarIcon({ color, scale = 1 }: { color: string; scale?: number }) {
  return (
    <mesh scale={scale} rotation={[0, 0, Math.PI / 4]}>
      <octahedronGeometry args={[0.16, 0]} />
      <ToyMaterial color={color} glow emissiveIntensity={STAGE_LOOK.glowStar} />
    </mesh>
  )
}

function HeartIcon({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[-0.055, 0.02, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <ToyMaterial color={color} />
      </mesh>
      <mesh position={[0.055, 0.02, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <ToyMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.11, 0.11, 0.1]} />
        <ToyMaterial color={color} />
      </mesh>
    </group>
  )
}

function NoteIcon({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0.02, -0.04, 0]} rotation={[0.2, 0, 0.15]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <ToyMaterial color={color} />
      </mesh>
      <mesh position={[0.08, 0.06, 0]}>
        <capsuleGeometry args={[0.016, 0.16, 4, 8]} />
        <ToyMaterial color={color} />
      </mesh>
      <mesh position={[0.05, 0.14, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.09, 0.05, 0.04]} />
        <ToyMaterial color={color} />
      </mesh>
    </group>
  )
}

function TriangleIcon({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.15, 0.15, 0.07, 3]} />
      <ToyMaterial color={color} />
    </mesh>
  )
}

function Starburst() {
  return (
    <group position={[0, 0.12, 0]}>
      {[0, 45, 90, 135].map((deg) => (
        <mesh key={deg} rotation={[-Math.PI / 2, 0, (deg * Math.PI) / 180]}>
          <boxGeometry args={[0.11, 0.7, 0.045]} />
          <ToyMaterial color={TOY.lemon} roughness={0.62} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <boxGeometry args={[0.4, 0.4, 0.06]} />
        <ToyMaterial color="#fff3a8" glow emissiveIntensity={STAGE_LOOK.glowStar} />
      </mesh>
    </group>
  )
}

function iconFor(ix: number, iz: number) {
  const key = (ix * 13 + iz * 7) % 17
  if (key === 2) return 'heart'
  if (key === 5) return 'star'
  if (key === 8) return 'note'
  if (key === 11) return 'triangle'
  return null
}

function FloorTiles({ theme }: { theme: SongTheme }) {
  const texPilot = useTexPilot()
  const floorMaps = texPilot ? getFloorMaps() : null
  const mats = useRef<(MeshPhysicalMaterial | null)[]>(Array.from({ length: TILE_COUNT }, () => null))
  const bases = useRef<(Color | null)[]>(Array.from({ length: TILE_COUNT }, () => null))
  const glow = useRef(new Float32Array(TILE_COUNT))
  const midCol = 5
  const midRow = 3
  const listenRow = ROWS - 1
  const tiles = []

  useFrame((_, dt) => {
    const playing = audioEngine.isAudible()
    const beat = playing ? audioEngine.getVisualBeatIndex() : 0
    const current = beatToTile(beat)
    const previous = beatToTile(beat - 1)
    const active = playing ? tileIndex(current.ix, current.iz) : -1
    const trail = playing ? tileIndex(previous.ix, previous.iz) : -1
    for (let i = 0; i < TILE_COUNT; i += 1) {
      const target = i === active ? 1 : i === trail ? BEAT_TRAIL : 0
      const rising = target > glow.current[i]
      const ease = 1 - Math.exp(-dt * (rising ? BEAT_ATTACK : BEAT_DECAY))
      const next = glow.current[i] + (target - glow.current[i]) * ease
      glow.current[i] = next
      const mat = mats.current[i]
      if (!mat) continue
      if (next < 0.002 && mat.emissiveIntensity < 0.002) {
        if (mat.emissiveIntensity !== 0) {
          mat.emissiveIntensity = 0
          const base = bases.current[i]
          if (base) mat.color.copy(base)
        }
        continue
      }
      mat.emissive.copy(BEAT_EMISSIVE)
      mat.emissiveIntensity = next * BEAT_EMIT
      const base = bases.current[i]
      if (base) mat.color.copy(base).lerp(BEAT_HIGHLIGHT, next * BEAT_TINT)
    }
  })

  for (let ix = 0; ix < COLS; ix += 1) {
    for (let iz = 0; iz < ROWS; iz += 1) {
      const isCenter = ix === midCol && iz === midRow
      const isListener = ix === midCol && iz === listenRow
      const pos = tilePos(ix, iz)
      const icon = !isCenter && !isListener ? iconFor(ix, iz) : null
      const surface = tileSurface(ix, iz)
      const color = mixHex(
        isCenter || isListener
          ? mixHex(TOY.lemon, theme.accent, 0.14)
          : tileColor(ix, iz, theme.accent, theme.floor),
        TOY.cream,
        surface.tint * 0.45,
      )
      const index = tileIndex(ix, iz)
      tiles.push(
        <group key={`${ix}-${iz}`} position={pos}>
          <Block
            args={[STEP_X * 0.9, TILE_Y, STEP_Z * 0.9]}
            radius={0.08}
            color={color}
            silicone
            roughness={surface.roughness}
            clearcoat={surface.clearcoat}
            receiveShadow
            emissive="#fff3c4"
            emissiveIntensity={0}
            maps={floorMaps}
            materialRef={(mat) => {
              mats.current[index] = mat
              if (!mat) return
              const stored = bases.current[index] ?? new Color()
              stored.set(color)
              bases.current[index] = stored
            }}
          />
          {isCenter && (
            <>
              <mesh position={[0, 0.108, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.34, 22]} />
                <ToyMaterial color={TOY.lemon} glow emissiveIntensity={STAGE_LOOK.glowLamp} />
              </mesh>
              <Starburst />
            </>
          )}
          {isListener && (
            <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
              <circleGeometry args={[0.22, 20]} />
              <ToyMaterial color={theme.accent} glow emissiveIntensity={STAGE_LOOK.glowIcon} />
            </mesh>
          )}
          {icon === 'heart' && (
            <group position={[0, 0.12, 0]}>
              <HeartIcon color={TOY.coral} />
            </group>
          )}
          {icon === 'star' && (
            <group position={[0, 0.14, 0]}>
              <StarIcon color={TOY.lemon} scale={0.7} />
            </group>
          )}
          {icon === 'note' && (
            <group position={[0, 0.14, 0]}>
              <NoteIcon color={mixHex(TOY.lilac, theme.accent, 0.35)} />
            </group>
          )}
          {icon === 'triangle' && (
            <group position={[0, 0.12, 0]}>
              <TriangleIcon color={TOY.mint} />
            </group>
          )}
        </group>,
      )
    }
  }

  return (
    <group>
      <Block
        args={[SIZE_X + 0.55, 0.28, SIZE_Z + 0.55]}
        radius={0.14}
        position={[0, -0.22, (STAGE_BOUNDS.zBack + STAGE_BOUNDS.zFront) / 2]}
        color={STAGE_LOOK.floor}
        silicone
        maps={floorMaps}
      />
      {tiles}
    </group>
  )
}

function SmilingCloud({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[-0.32, 0, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <ToyMaterial color={TOY.cloud} silicone />
      </mesh>
      <mesh position={[0.3, 0.02, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <ToyMaterial color={TOY.cloud} silicone />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.34, 16, 16]} />
        <ToyMaterial color={TOY.cloud} silicone />
      </mesh>
      <Face scale={0.95} />
    </group>
  )
}

function Pennant({
  x,
  color,
  motif,
}: {
  x: number
  color: string
  motif: 'star' | 'note' | 'diamond'
}) {
  return (
    <group position={[x, 0, 0.08]} rotation={[0.12, 0, x * 0.04]}>
      <mesh rotation={[0, 0, Math.PI]} position={[0, -0.38, 0]}>
        <coneGeometry args={[0.2, 0.72, 3]} />
        <ToyMaterial color={color} silicone />
      </mesh>
      <group position={[0, -0.28, 0.05]} scale={0.7}>
        {motif === 'star' && <StarIcon color={TOY.lemon} scale={0.55} />}
        {motif === 'note' && <NoteIcon color={TOY.cream} />}
        {motif === 'diamond' && (
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.12, 0.05]} />
            <ToyMaterial color={TOY.cream} />
          </mesh>
        )}
      </group>
    </group>
  )
}

function Backdrop({ accent }: { accent: string }) {
  const flags: Array<{ x: number; color: string; motif: 'star' | 'note' | 'diamond' }> = [
    { x: -2.4, color: TOY.pink, motif: 'star' },
    { x: -1.2, color: TOY.lavender, motif: 'note' },
    { x: 0, color: mixHex(TOY.lemon, accent, 0.4), motif: 'diamond' },
    { x: 1.2, color: TOY.babyBlue, motif: 'star' },
    { x: 2.4, color: TOY.coral, motif: 'note' },
  ]

  return (
    <group position={[0, 0, STAGE_BOUNDS.zBack - 0.55]}>
      <Block
        args={[13.2, 4.2, 0.55]}
        radius={0.22}
        position={[0, 2.05, 0]}
        color={TOY.wall}
        silicone
      />
      <Block
        args={[12.2, 3.4, 0.28]}
        radius={0.16}
        position={[0, 2.05, 0.18]}
        color={mixHex(TOY.sky, accent, 0.08)}
        silicone
      />
      <Block args={[13.6, 0.28, 0.4]} radius={0.12} position={[0, 4.2, 0.1]} color={TOY.lilac} />
      <group position={[0, 4.05, 0.28]}>
        {flags.map((flag) => (
          <Pennant key={flag.x} {...flag} />
        ))}
      </group>
      <SmilingCloud position={[-3.4, 3.15, 0.45]} scale={0.72} />
      <SmilingCloud position={[3.6, 3.35, 0.4]} scale={0.58} />
      <BackdropUnlocks />
    </group>
  )
}

function Seating() {
  const stacks: Array<{
    x: number
    z: number
    color: string
    h: number
  }> = [
    { x: -6.15, z: -3.4, color: TOY.peach, h: 0.7 },
    { x: -6.15, z: -2.2, color: TOY.lavender, h: 0.95 },
    { x: -6.15, z: -1.0, color: TOY.babyBlue, h: 1.15 },
    { x: -6.15, z: 0.3, color: TOY.mint, h: 0.85 },
    { x: 6.15, z: -3.2, color: TOY.mint, h: 0.75 },
    { x: 6.15, z: -1.9, color: TOY.pink, h: 1.05 },
    { x: 6.15, z: -0.6, color: TOY.lavender, h: 1.2 },
    { x: 6.15, z: 0.7, color: TOY.peach, h: 0.8 },
  ]

  return (
    <group>
      {stacks.map((block) => (
        <Block
          key={`${block.x}-${block.z}`}
          args={[0.95, block.h, 1.05]}
          radius={0.16}
          position={[block.x, block.h / 2 - 0.02, block.z]}
          color={block.color}
          silicone
          castShadow
        />
      ))}
    </group>
  )
}

function ToyTree({ position }: { position: [number, number, number] }) {
  const canopy: Array<[number, number, number, number]> = [
    [0, 1.35, 0, 0.95],
    [-0.42, 1.15, 0.15, 0.7],
    [0.4, 1.2, -0.12, 0.72],
    [0.08, 1.62, 0.18, 0.62],
    [-0.18, 1.55, -0.28, 0.58],
  ]
  const fruit: Array<[number, number, number]> = [
    [0.38, 1.05, 0.28],
    [-0.4, 1.28, -0.1],
    [0.12, 1.72, -0.08],
  ]

  return (
    <group position={position}>
      <Block
        args={[0.52, 1.05, 0.52]}
        radius={0.16}
        position={[0, 0.52, 0]}
        color={TOY.trunk}
        silicone
        castShadow
      />
      {canopy.map(([x, y, z, s], i) => (
        <Block
          key={i}
          args={[s, s, s]}
          radius={s * 0.28}
          position={[x, y, z]}
          color={i % 2 === 0 ? TOY.mint : TOY.sage}
          silicone
          castShadow
        />
      ))}
      {fruit.map(([x, y, z], i) => (
        <Block
          key={`f${i}`}
          args={[0.2, 0.2, 0.2]}
          radius={0.07}
          position={[x, y, z]}
          color={TOY.fruit}
          silicone
        />
      ))}
    </group>
  )
}

function ToyFlower({
  position,
  petal,
  scale = 1,
}: {
  position: [number, number, number]
  petal: string
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.72, 4, 10]} />
        <ToyMaterial color={TOY.sage} silicone />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.28, 0.92, Math.sin(a) * 0.28]}
            rotation={[0.35, 0, a + Math.PI / 2]}
            castShadow
          >
            <capsuleGeometry args={[0.1, 0.28, 4, 10]} />
            <ToyMaterial color={petal} silicone />
          </mesh>
        )
      })}
      <Block
        args={[0.28, 0.16, 0.28]}
        radius={0.07}
        position={[0, 0.94, 0]}
        color={TOY.lemon}
        glow
        emissiveIntensity={STAGE_LOOK.glowFlower}
      />
    </group>
  )
}

function SmileyBlock({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  return (
    <group position={position}>
      <Block args={[0.72, 0.72, 0.72]} radius={0.16} color={color} silicone castShadow />
      <Face scale={0.85} />
    </group>
  )
}

function Flora() {
  return (
    <group>
      <ToyTree position={[-5.35, 0, -3.55]} />
      <ToyTree position={[5.45, 0, -3.85]} />
      <ToyFlower position={[-5.15, 0, 1.35]} petal={TOY.pink} />
      <ToyFlower position={[5.25, 0, 1.55]} petal={TOY.babyBlue} scale={0.9} />
      <ToyFlower position={[-4.35, 0, -4.35]} petal={TOY.coral} scale={0.75} />
      <SmileyBlock position={[-5.85, 0.95, -2.15]} color={TOY.peach} />
      <SmileyBlock position={[5.9, 1.15, -1.85]} color={TOY.lavender} />
    </group>
  )
}

function FairyLights() {
  const left = -STAGE_BOUNDS.x - 0.08
  const right = STAGE_BOUNDS.x + 0.08
  const back = STAGE_BOUNDS.zBack - 0.08
  const front = STAGE_BOUNDS.zFront + 0.08
  const path: Array<[number, number]> = []
  const edges = [
    ...Array.from({ length: 10 }, (_, i) => [left + ((right - left) * i) / 9, back] as [number, number]),
    ...Array.from({ length: 7 }, (_, i) => [right, back + ((front - back) * (i + 1)) / 7] as [number, number]),
    ...Array.from({ length: 9 }, (_, i) => [right - ((right - left) * (i + 1)) / 9, front] as [number, number]),
    ...Array.from({ length: 6 }, (_, i) => [left, front - ((front - back) * (i + 1)) / 7] as [number, number]),
  ]
  path.push(...edges)

  return (
    <group>
      {path.map(([x, z], i) => (
        <mesh key={`${x}-${z}-${i}`} position={[x, 0.22, z]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <ToyMaterial color="#ffe7a8" glow emissiveIntensity={STAGE_LOOK.glowOrb} />
        </mesh>
      ))}
    </group>
  )
}

function HangingStars() {
  const stars: Array<[number, number, number, number, string]> = [
    [-2.2, 3.6, -4.8, 0.85, TOY.lemon],
    [1.8, 3.85, -4.6, 0.7, '#fff4c4'],
    [0.2, 4.15, -5.1, 1, TOY.lemon],
    [-4.4, 3.3, -3.8, 0.55, TOY.cream],
    [4.6, 3.45, -3.6, 0.6, TOY.pink],
    [-1.1, 2.8, 2.8, 0.35, TOY.lemon],
    [2.4, 2.6, 2.4, 0.3, TOY.cream],
  ]
  return (
    <group>
      {stars.map(([x, y, z, s, color], i) => (
        <group key={i} position={[x, y, z]} scale={s}>
          <StarIcon color={color} />
        </group>
      ))}
    </group>
  )
}

function SkyWash({ theme }: { theme: SongTheme }) {
  const orbs: Array<[number, number, number, number, string]> = [
    [-7.2, 3.4, -9.5, 1.6, mixHex(TOY.pink, liftPastel(theme.horizon, TOY.cream, 0.4), 0.28)],
    [6.4, 4.2, -10.2, 1.9, mixHex(TOY.lavender, liftPastel(theme.sky, TOY.sky, 0.45), 0.28)],
    [0.4, 5.6, -11, 1.3, mixHex(TOY.peach, liftPastel(theme.horizon, TOY.lemon, 0.35), 0.25)],
    [-3.5, 5.1, -10.6, 1.1, mixHex(TOY.pink, TOY.cream, 0.2)],
    [3.8, 2.6, -9.8, 1.4, mixHex(TOY.lavender, TOY.sky, 0.25)],
  ]

  return (
    <group>
      <mesh>
        <sphereGeometry args={[24, 28, 20]} />
        <meshBasicMaterial side={BackSide} depthWrite={false}>
          <GradientTexture
            stops={[0, 0.4, 0.72, 1]}
            colors={[
              liftPastel(theme.horizon, TOY.cream, 0.55),
              liftPastel(theme.sky, TOY.sky, 0.58),
              liftPastel(theme.fog, TOY.sky, 0.5),
              '#f8eef8',
            ]}
            size={64}
          />
        </meshBasicMaterial>
      </mesh>
      <mesh position={[0, 3.4, -11]}>
        <planeGeometry args={[30, 16]} />
        <meshBasicMaterial depthWrite={false}>
          <GradientTexture
            stops={[0, 0.45, 1]}
            colors={[
              mixHex(TOY.pink, liftPastel(theme.horizon, TOY.cream, 0.35), 0.35),
              liftPastel(theme.sky, TOY.sky, 0.4),
              mixHex(TOY.sky, liftPastel(theme.fog, TOY.lavender, 0.3), 0.3),
            ]}
            size={48}
          />
        </meshBasicMaterial>
      </mesh>
      {orbs.map(([x, y, z, s, color], i) => (
        <mesh key={i} position={[x, y, z]} scale={s}>
          <sphereGeometry args={[1, 16, 16]} />
          <ToyMaterial color={color} silicone />
        </mesh>
      ))}
    </group>
  )
}

export function StageEnvironment({ theme }: { theme: SongTheme }) {
  return (
    <group>
      <RenderLayer layer={2}>
        <SkyWash theme={theme} />
        <HangingStars />
        <Sparkles
          count={STAGE_LOOK.quality === 'desktop' ? 48 : 28}
          scale={[12, 3.6, 9]}
          size={2.4}
          speed={0.18}
          opacity={0.22}
          color="#fff3c4"
          position={[0, 1.6, -0.4]}
        />
      </RenderLayer>
      <FloorTiles theme={theme} />
      <Seating />
      <Backdrop accent={theme.accent} />
      <Flora />
      <FairyLights />
    </group>
  )
}
