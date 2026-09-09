import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { COMBO_SHAPES, getCombos } from '../config/loadConfig'
import { useGame } from '../state/gameStore'
import { STAGE_LOOK } from '../theme/stageLook'
import { mixHex, TOY, ToyMaterial } from '../theme/toy'
import type { ComboShape } from '../types'

/**
 * Local mounts on the Backdrop group (`z = STAGE_BOUNDS.zBack - 0.55`).
 * World Z of the props is about -4.59, on the inner anteparo panel.
 */
export const UNLOCK_MOUNTS: Record<ComboShape, [number, number, number]> = {
  circle: [-2.85, 1.72, 0.68],
  square: [0, 1.72, 0.68],
  triangle: [2.85, 1.72, 0.68],
}

const FATIA_COLORS = ['#FF8DC7', '#5EE0C4', '#FFE56A', '#7C4DFF'] as const
const POLISH = STAGE_LOOK.quality === 'desktop'
const SLICE_DEPTH = POLISH ? 0.52 : 0.4

const noRaycast = () => null

function sliceProps(color: string, on: boolean, complete: boolean) {
  return {
    color: on ? color : mixHex(TOY.cream, TOY.ink, 0.14),
    silicone: true,
    glow: on,
    emissive: on ? color : TOY.ink,
    emissiveIntensity: complete ? (POLISH ? 0.46 : 0.34) : on ? (POLISH ? 0.26 : 0.2) : 0.012,
    roughness: on ? undefined : 0.74,
    clearcoat: complete && POLISH ? 0.82 : undefined,
  }
}

function extrudeSettings(depth = SLICE_DEPTH): THREE.ExtrudeGeometryOptions {
  return {
    depth,
    bevelEnabled: true,
    bevelThickness: POLISH ? 0.055 : 0.036,
    bevelSize: POLISH ? 0.048 : 0.03,
    bevelSegments: POLISH ? 3 : 1,
    curveSegments: POLISH ? 8 : 5,
  }
}

function pieGeometry(index: number) {
  const start = (index * Math.PI) / 2 - Math.PI / 2
  const end = start + Math.PI / 2
  const radius = 0.98
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  const steps = POLISH ? 10 : 6
  for (let i = 0; i <= steps; i += 1) {
    const t = start + ((end - start) * i) / steps
    shape.lineTo(Math.cos(t) * radius, Math.sin(t) * radius)
  }
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings())
  geometry.computeVertexNormals()
  return geometry
}

function triangleBandGeometry(index: number) {
  const height = 1.92
  const width = 2.05
  const topY = 0.98
  const splits = [0, 0.3, 0.52, 0.75, 1]
  const gap = 0.04
  const yTop = topY - splits[index] * height - (index === 0 ? 0 : gap * 0.45)
  const yBot = topY - splits[index + 1] * height + gap * 0.45
  const widthAt = (y: number) => {
    const t = THREE.MathUtils.clamp((topY - y) / height, 0.08, 1)
    return Math.max(0.28, width * t)
  }
  const wTop = widthAt(yTop)
  const wBot = widthAt(yBot)
  const shape = new THREE.Shape()
  if (wTop < 0.16) {
    shape.moveTo(0, yTop)
    shape.lineTo(wBot / 2, yBot)
    shape.lineTo(-wBot / 2, yBot)
  } else {
    shape.moveTo(-wTop / 2, yTop)
    shape.lineTo(wTop / 2, yTop)
    shape.lineTo(wBot / 2, yBot)
    shape.lineTo(-wBot / 2, yBot)
  }
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings(0.34))
  geometry.computeVertexNormals()
  return geometry
}

function Plaque() {
  return (
    <RoundedBox
      args={[2.35, 2.35, 0.22]}
      radius={0.18}
      smoothness={STAGE_LOOK.boxSmoothness}
      position={[0, 0, -0.12]}
      receiveShadow
      raycast={noRaycast}
    >
      <ToyMaterial color={mixHex(TOY.lilac, TOY.wall, 0.4)} silicone roughness={0.64} />
    </RoundedBox>
  )
}

function Peg() {
  return (
    <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} raycast={noRaycast}>
      <cylinderGeometry args={[0.09, 0.09, 0.26, 8]} />
      <ToyMaterial color={TOY.lilac} silicone />
    </mesh>
  )
}

function CompleteSpark() {
  return (
    <mesh position={[0, 1.14, 0.28]} rotation={[0, 0, Math.PI / 4]} raycast={noRaycast}>
      <octahedronGeometry args={[0.17, 0]} />
      <ToyMaterial color={TOY.lemon} glow emissiveIntensity={STAGE_LOOK.glowStar} />
    </mesh>
  )
}

function CircleSymbol({ filled, complete }: { filled: boolean[]; complete: boolean }) {
  const geos = useMemo(() => [0, 1, 2, 3].map(pieGeometry), [])
  useEffect(() => () => geos.forEach((geo) => geo.dispose()), [geos])

  return (
    <group>
      <Plaque />
      <Peg />
      <mesh raycast={noRaycast}>
        <torusGeometry args={[1.0, 0.14, POLISH ? 12 : 6, POLISH ? 32 : 16]} />
        <ToyMaterial
          color={complete ? mixHex(TOY.pink, TOY.lemon, 0.25) : mixHex(TOY.lilac, TOY.cream, 0.45)}
          silicone
          glow={complete}
          emissiveIntensity={complete ? STAGE_LOOK.glowIcon : 0.02}
        />
      </mesh>
      {geos.map((geometry, index) => {
        const mid = (index * Math.PI) / 2 - Math.PI / 2 + Math.PI / 4
        return (
          <mesh
            key={index}
            geometry={geometry}
            position={[Math.cos(mid) * 0.028, Math.sin(mid) * 0.028, 0]}
            castShadow
            receiveShadow
            raycast={noRaycast}
          >
            <ToyMaterial {...sliceProps(FATIA_COLORS[index], Boolean(filled[index]), complete)} />
          </mesh>
        )
      })}
      {complete ? <CompleteSpark /> : null}
    </group>
  )
}

function SquareSymbol({ filled, complete }: { filled: boolean[]; complete: boolean }) {
  const cells: Array<[number, number]> = [
    [-0.46, 0.46],
    [0.46, 0.46],
    [-0.46, -0.46],
    [0.46, -0.46],
  ]

  return (
    <group>
      <Plaque />
      <Peg />
      {cells.map(([x, y], index) => (
        <RoundedBox
          key={index}
          args={[0.82, 0.82, 0.55]}
          radius={0.18}
          smoothness={STAGE_LOOK.boxSmoothness}
          position={[x, y, 0.22]}
          castShadow
          receiveShadow
          raycast={noRaycast}
        >
          <ToyMaterial {...sliceProps(FATIA_COLORS[index], Boolean(filled[index]), complete)} />
        </RoundedBox>
      ))}
      {complete ? <CompleteSpark /> : null}
    </group>
  )
}

function TriangleSymbol({ filled, complete }: { filled: boolean[]; complete: boolean }) {
  const geos = useMemo(() => [0, 1, 2, 3].map(triangleBandGeometry), [])
  useEffect(() => () => geos.forEach((geo) => geo.dispose()), [geos])

  return (
    <group>
      <Plaque />
      <Peg />
      {geos.map((geometry, index) => (
        <mesh key={index} geometry={geometry} castShadow receiveShadow raycast={noRaycast}>
          <ToyMaterial {...sliceProps(FATIA_COLORS[index], Boolean(filled[index]), complete)} />
        </mesh>
      ))}
      {complete ? <CompleteSpark /> : null}
    </group>
  )
}

function UnlockSymbol({
  shape,
  filled,
  lit,
  position,
}: {
  shape: ComboShape
  filled: boolean[]
  lit: boolean
  position: [number, number, number]
}) {
  const group = useRef<THREE.Group>(null)
  const accent = shape === 'circle' ? FATIA_COLORS[0] : shape === 'square' ? FATIA_COLORS[1] : FATIA_COLORS[2]

  useFrame(({ clock }) => {
    if (!group.current) return
    const pulse = lit ? 1.16 + Math.sin(clock.elapsedTime * 3.2) * 0.03 : 1.16
    group.current.scale.setScalar(pulse)
  })

  return (
    <group ref={group} position={position} rotation={[-0.14, 0, 0]}>
      {shape === 'circle' ? <CircleSymbol filled={filled} complete={lit} /> : null}
      {shape === 'square' ? <SquareSymbol filled={filled} complete={lit} /> : null}
      {shape === 'triangle' ? <TriangleSymbol filled={filled} complete={lit} /> : null}
      {lit && POLISH ? (
        <pointLight color={accent} intensity={0.26} distance={2.15} decay={2} position={[0, 0, 0.4]} />
      ) : null}
    </group>
  )
}

export function BackdropUnlocks() {
  const songId = useGame((s) => s.songId)
  const instances = useGame((s) => s.instances)
  if (!songId) return null

  const onStage = new Set(instances.map((item) => item.instrument))
  const combos = getCombos(songId)

  return (
    <group>
      {COMBO_SHAPES.map((shape) => {
        const needed = combos[shape] ?? []
        const filled = needed.map((instrument) => onStage.has(instrument))
        const lit = needed.length === 4 && filled.every(Boolean)
        return (
          <UnlockSymbol
            key={shape}
            shape={shape}
            filled={filled}
            lit={lit}
            position={UNLOCK_MOUNTS[shape]}
          />
        )
      })}
    </group>
  )
}
