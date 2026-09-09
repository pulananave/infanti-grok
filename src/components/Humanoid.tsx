import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { CHARACTERS } from '../config/characters'
import { instrumentKind } from '../config/instruments'
import { ToyMaterial } from '../theme/toy'
import type { Accessory, CharacterId, HeadShape } from '../types'

interface Props {
  characterId: CharacterId
  instrument?: string
  muted?: boolean
  playing?: boolean
  bpm?: number
  ghost?: boolean
}

function Mat({
  color,
  opacity = 1,
  emissive,
  emissiveIntensity,
}: {
  color: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <ToyMaterial
      color={color}
      opacity={opacity}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  )
}

function Head({ shape, color, opacity }: { shape: HeadShape; color: string; opacity: number }) {
  if (shape === 'box') {
    return (
      <RoundedBox args={[0.42, 0.38, 0.38]} radius={0.1} smoothness={3} position={[0, 0.42, 0]} castShadow>
        <Mat color={color} opacity={opacity} />
      </RoundedBox>
    )
  }
  if (shape === 'tall') {
    return (
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.28, 6, 12]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
    )
  }
  if (shape === 'wide') {
    return (
      <mesh position={[0, 0.38, 0]} scale={[1.25, 0.85, 1]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
    )
  }
  if (shape === 'diamond') {
    return (
      <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <octahedronGeometry args={[0.26]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
    )
  }
  if (shape === 'oval') {
    return (
      <mesh position={[0, 0.46, 0]} scale={[0.85, 1.15, 0.9]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
    )
  }
  return (
    <mesh position={[0, 0.4, 0]} castShadow>
      <sphereGeometry args={[0.24, 16, 16]} />
      <Mat color={color} opacity={opacity} />
    </mesh>
  )
}

function Extra({
  accessory,
  accent,
  skin,
  opacity,
}: {
  accessory: Accessory
  accent: string
  skin: string
  opacity: number
}) {
  switch (accessory) {
    case 'antenna':
      return (
        <group position={[0, 0.66, 0]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.22]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
        </group>
      )
    case 'sprout':
      return (
        <group position={[0.02, 0.78, 0]}>
          <mesh rotation={[0, 0, 0.4]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <Mat color="#3D8B40" opacity={opacity} />
          </mesh>
          <mesh position={[-0.08, 0.02, 0]} rotation={[0, 0, -0.5]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <Mat color="#67C23A" opacity={opacity} />
          </mesh>
        </group>
      )
    case 'cap':
      return (
        <group position={[0, 0.56, 0]}>
          <mesh>
            <cylinderGeometry args={[0.26, 0.28, 0.12, 16]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
          <mesh position={[0, -0.02, 0.16]}>
            <boxGeometry args={[0.22, 0.04, 0.16]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
        </group>
      )
    case 'star':
      return (
        <mesh position={[0, 0.72, 0]}>
          <octahedronGeometry args={[0.1]} />
          <Mat color={accent} opacity={opacity} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      )
    case 'horns':
      return (
        <group>
          <mesh position={[-0.16, 0.58, 0]} rotation={[0, 0, 0.6]}>
            <coneGeometry args={[0.06, 0.18, 8]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
          <mesh position={[0.16, 0.58, 0]} rotation={[0, 0, -0.6]}>
            <coneGeometry args={[0.06, 0.18, 8]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
        </group>
      )
    case 'unibrow':
      return (
        <mesh position={[0, 0.46, 0.2]}>
          <boxGeometry args={[0.22, 0.04, 0.04]} />
          <Mat color="#2b1654" opacity={opacity} />
        </mesh>
      )
    case 'bow':
      return (
        <group position={[0.18, 0.58, 0.05]}>
          <mesh rotation={[0, 0, 0.4]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, -0.4]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
        </group>
      )
    case 'mohawk':
      return (
        <RoundedBox args={[0.08, 0.22, 0.28]} radius={0.03} smoothness={2} position={[0, 0.62, 0]}>
          <Mat color={accent} opacity={opacity} />
        </RoundedBox>
      )
    case 'glasses':
      return (
        <group position={[0, 0.42, 0.2]}>
          <mesh position={[-0.09, 0, 0]}>
            <torusGeometry args={[0.07, 0.015, 8, 16]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
          <mesh position={[0.09, 0, 0]}>
            <torusGeometry args={[0.07, 0.015, 8, 16]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
        </group>
      )
    case 'headphones':
      return (
        <group position={[0, 0.44, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.26, 0.03, 8, 18, Math.PI]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
          <RoundedBox args={[0.08, 0.14, 0.1]} radius={0.03} smoothness={2} position={[-0.24, 0, 0]}>
            <Mat color={accent} opacity={opacity} />
          </RoundedBox>
          <RoundedBox args={[0.08, 0.14, 0.1]} radius={0.03} smoothness={2} position={[0.24, 0, 0]}>
            <Mat color={accent} opacity={opacity} />
          </RoundedBox>
        </group>
      )
    case 'bun':
      return (
        <group>
          <mesh position={[-0.12, 0.6, -0.02]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <Mat color={skin} opacity={opacity} />
          </mesh>
          <mesh position={[0.12, 0.6, -0.02]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <Mat color={skin} opacity={opacity} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

function HeldInstrument({ instrument }: { instrument?: string }) {
  if (!instrument) return null
  const kind = instrumentKind(instrument) ?? instrument
  if (kind === 'drums' || kind === 'dj' || kind === 'bombo' || kind === 'caixa' || kind === 'conga' || kind === 'bongo') {
    return (
      <mesh position={[0.28, 0.18, 0.16]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
        <Mat color="#E74C3C" />
      </mesh>
    )
  }
  if (kind === 'guitar' || kind === 'ukulele' || kind === 'electric_guitar' || kind === 'violin') {
    return (
      <group position={[0.26, 0.16, 0.14]} rotation={[0.2, 0.4, 0.5]}>
        <mesh>
          <boxGeometry args={[0.08, 0.14, 0.05]} />
          <Mat color="#CA6F1E" />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.03, 0.16, 0.03]} />
          <Mat color="#2b1654" />
        </mesh>
      </group>
    )
  }
  if (
    kind === 'trumpet' ||
    kind === 'trombone' ||
    kind === 'flute' ||
    kind === 'clarinet' ||
    kind === 'harmonica'
  ) {
    return (
      <mesh position={[0.28, 0.22, 0.16]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 8]} />
        <Mat color="#F4D03F" />
      </mesh>
    )
  }
  if (kind === 'piano' || kind === 'xylophone' || kind === 'synth' || kind === 'accordion' || kind === 'organ') {
    return (
      <mesh position={[0.26, 0.16, 0.16]}>
        <boxGeometry args={[0.18, 0.08, 0.1]} />
        <Mat color="#2b1654" />
      </mesh>
    )
  }
  return (
    <mesh position={[0.26, 0.18, 0.16]}>
      <sphereGeometry args={[0.07, 10, 10]} />
      <Mat color="#5EE0C4" />
    </mesh>
  )
}

export function Humanoid({
  characterId,
  instrument,
  muted = false,
  playing = false,
  bpm = 120,
  ghost = false,
}: Props) {
  const group = useRef<Group>(null)
  const look = CHARACTERS[characterId]
  const opacity = ghost ? 0.42 : muted ? 0.55 : 1
  const color = muted ? '#8a8496' : look.bodyColor

  useFrame(({ clock }) => {
    if (!group.current) return
    const bounce =
      playing && !muted && !ghost
        ? Math.abs(Math.sin(clock.elapsedTime * Math.PI * (bpm / 60))) * 0.07
        : 0
    group.current.position.y = bounce
  })

  return (
    <group ref={group} scale={look.height}>
      <mesh position={[-0.1, 0.08, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.18, 4, 8]} />
        <Mat color={look.skinColor} opacity={opacity} />
      </mesh>
      <mesh position={[0.1, 0.08, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.18, 4, 8]} />
        <Mat color={look.skinColor} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <sphereGeometry args={[0.2 * look.belly, 16, 16]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
      <mesh position={[-0.22, 0.32, 0.04]} rotation={[0, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        <Mat color={look.skinColor} opacity={opacity} />
      </mesh>
      <mesh position={[0.22, 0.32, 0.04]} rotation={[0, 0, -0.5]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        <Mat color={look.skinColor} opacity={opacity} />
      </mesh>
      <Head shape={look.headShape} color={look.skinColor} opacity={opacity} />
      <mesh position={[-0.08, 0.42, 0.18]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <Mat color="#2b1654" opacity={opacity} />
      </mesh>
      <mesh position={[0.08, 0.42, 0.18]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <Mat color="#2b1654" opacity={opacity} />
      </mesh>
      <Extra accessory={look.accessory} accent={look.accentColor} skin={look.skinColor} opacity={opacity} />
      <HeldInstrument instrument={instrument} />
    </group>
  )
}
