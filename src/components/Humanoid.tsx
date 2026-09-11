import { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { audioEngine } from '../audio/AudioEngine'
import { CHARACTERS } from '../config/characters'
import { instrumentKind } from '../config/instruments'
import {
  AtlasCapsule,
  AtlasCone,
  AtlasSphere,
  BoogarPartContext,
  BoogarPartProvider,
} from '../theme/boogarAtlas'
import { STAGE_LOOK } from '../theme/stageLook'
import { getBoogarMaps, useTexPilot } from '../theme/texPilot'
import { ToyMaterial } from '../theme/toy'
import type { CharacterId, CharacterLook, LookFeature } from '../types'

const BoogarPlush = createContext(false)

function PSphere({ args }: { args: [radius: number, width?: number, height?: number] }) {
  const plush = useContext(BoogarPlush)
  if (!plush) return <PSphere args={args} />
  return <AtlasSphere args={args} />
}

function PCapsule({
  args,
}: {
  args: [radius: number, length: number, cap?: number, radial?: number]
}) {
  const plush = useContext(BoogarPlush)
  if (!plush) return <PCapsule args={args} />
  return <AtlasCapsule args={args} />
}

function PCone({ args }: { args: [radius: number, height: number, radial?: number] }) {
  const plush = useContext(BoogarPlush)
  if (!plush) return <PCone args={args} />
  return <AtlasCone args={args} />
}

interface Props {
  characterId: CharacterId
  instrument?: string
  muted?: boolean
  playing?: boolean
  ghost?: boolean
}

function Mat({
  color,
  opacity = 1,
  emissive,
  emissiveIntensity,
  roughness,
  smooth = false,
}: {
  color: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  roughness?: number
  smooth?: boolean
}) {
  const mapped = useContext(BoogarPlush)
  const part = useContext(BoogarPartContext)
  const maps = mapped && !smooth && part ? getBoogarMaps() : null
  const muted = color.replace('#', '').toLowerCase() === '8a8496'
  return (
    <ToyMaterial
      color={maps ? (muted ? color : '#ffffff') : color}
      sheenColor={muted ? color : maps ? '#FF8C73' : color}
      map={maps?.map}
      normalMap={maps?.normalMap}
      opacity={opacity}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      roughness={roughness}
      silicone
      normalStrength={smooth ? 0 : undefined}
    />
  )
}

function hasFeature(look: CharacterLook, feature: LookFeature) {
  return look.features.includes(feature)
}

function bodyRadius(look: CharacterLook) {
  return 0.24 * look.belly
}

function bodyCenterY(look: CharacterLook) {
  const r = bodyRadius(look)
  const legs = look.legLength ?? 0.16
  return legs + r * 0.72
}

function faceZ(look: CharacterLook) {
  const r = bodyRadius(look)
  if (look.bodyForm === 'wide') return r * 0.95
  if (look.bodyForm === 'onion' || look.bodyForm === 'sphere') return r * 0.92
  return r * 0.88
}

function BodyMesh({ look, color, opacity }: { look: CharacterLook; color: string; opacity: number }) {
  const r = bodyRadius(look)
  const y = bodyCenterY(look)
  const form = look.bodyForm

  if (form === 'pear') {
    return (
      <group>
        <mesh position={[0, y - r * 0.12, 0]} scale={[1.22, 0.95, 1.08]} castShadow receiveShadow>
          <PSphere args={[r, STAGE_LOOK.bodySegments, STAGE_LOOK.bodySegments]} />
          <Mat color={color} opacity={opacity} roughness={0.78} />
        </mesh>
        <mesh position={[0, y + r * 0.48, 0]} scale={[0.82, 0.82, 0.82]} castShadow receiveShadow>
          <PSphere args={[r * 0.74, STAGE_LOOK.bodySegments - 4, STAGE_LOOK.bodySegments - 4]} />
          <Mat color={color} opacity={opacity} roughness={0.78} />
        </mesh>
      </group>
    )
  }

  if (form === 'scurve') {
    return (
      <group>
        <mesh position={[0, y + 0.05, 0.03]} scale={[1.02, 1.08, 1]} castShadow receiveShadow>
          <PSphere args={[r * 0.98, STAGE_LOOK.bodySegments, STAGE_LOOK.bodySegments]} />
          <Mat color={color} opacity={opacity} />
        </mesh>
        <mesh position={[0, y - r * 0.62, -0.05]} scale={[0.82, 0.88, 0.86]} castShadow receiveShadow>
          <PSphere args={[r * 0.68, STAGE_LOOK.bodySegments - 6, STAGE_LOOK.bodySegments - 6]} />
          <Mat color={color} opacity={opacity} />
        </mesh>
      </group>
    )
  }

  const scale: [number, number, number] =
    form === 'wide'
      ? [1.38, 0.96, 1.12]
      : form === 'egg'
        ? [1.12, 1.22, 1.04]
        : form === 'onion'
          ? [1.06, 1.18, 1.06]
          : form === 'bean'
            ? [1.16, 1.32, 1.04]
            : [1.08, 1.02, 1.04]

  return (
    <mesh position={[0, y, 0]} scale={scale} castShadow receiveShadow>
      <PSphere args={[r, STAGE_LOOK.bodySegments, STAGE_LOOK.bodySegments]} />
      <Mat color={color} opacity={opacity} roughness={form === 'onion' ? 0.62 : 0.74} />
    </mesh>
  )
}

function Limb({
  look,
  opacity,
  side,
  kind,
  index = 0,
}: {
  look: CharacterLook
  opacity: number
  side: -1 | 1
  kind: 'arm' | 'leg'
  index?: number
}) {
  const r = bodyRadius(look)
  const bodyY = bodyCenterY(look)
  const color = look.limbColor
  const style = look.limbStyle
  const thick =
    style === 'thick' ? 0.11 : style === 'longThin' || style === 'spindly' || style === 'wavy' ? 0.032 : 0.058
  const len = kind === 'arm' ? (look.armLength ?? 0.2) : (look.legLength ?? 0.16)

  if (kind === 'leg') {
    const x = style === 'longThin' ? 0.08 * side : 0.1 * side
    const y = len * 0.45
    return (
      <group>
        <mesh position={[x, y, 0]} castShadow receiveShadow>
          <PCapsule args={[thick, Math.max(0.04, len * 0.7), 4, 8]} />
          <Mat color={color} opacity={opacity} />
        </mesh>
        <mesh position={[x + (style === 'spindly' ? 0.03 * side : 0), 0.03, 0.02]} scale={[1.35, 0.55, 1.6]} castShadow>
          <PSphere args={[thick * 1.5, 10, 10]} />
          <Mat color={hasFeature(look, 'redTips') ? (look.clawColor ?? color) : color} opacity={opacity} />
        </mesh>
        {hasFeature(look, 'pawPads') && (
          <mesh position={[x, 0.012, 0.04]}>
            <PSphere args={[thick * 0.7, 8, 8]} />
            <Mat color={look.clawColor ?? look.accentColor} opacity={opacity} />
          </mesh>
        )}
      </group>
    )
  }

  const shoulderY = bodyY + (look.armCount === 4 ? (index === 0 ? 0.06 : -0.08) : 0.02)
  const shoulderX = r * (look.bodyForm === 'wide' ? 1.05 : 0.92) * side
  const hang = style === 'thick' ? 0.55 : style === 'longThin' ? 0.25 : 0.45

  if (style === 'wavy') {
    const segs = 4
    return (
      <group position={[shoulderX, shoulderY, index === 1 ? 0.06 : 0]}>
        {Array.from({ length: segs }, (_, i) => {
          const t = (i + 0.5) / segs
          return (
            <mesh
              key={i}
              position={[side * Math.sin(t * 3.2) * 0.05, -t * len, Math.sin(t * 4 + index) * 0.04]}
              rotation={[0.15, 0, side * (0.4 + Math.sin(t * 5) * 0.35)]}
              castShadow
            >
              <PCapsule args={[thick, len / segs, 3, 6]} />
              <Mat color={color} opacity={opacity} />
            </mesh>
          )
        })}
      </group>
    )
  }

  return (
    <group position={[shoulderX, shoulderY, 0]}>
      <mesh rotation={[0.15, 0, side * hang]} position={[side * len * 0.22, -len * 0.28, 0.03]} castShadow receiveShadow>
        <PCapsule args={[style === 'thick' ? thick : thick, len * 0.85, 4, 8]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
      <Hand look={look} opacity={opacity} side={side} x={side * (len * 0.55)} y={-len * 0.62} />
    </group>
  )
}

function Hand({
  look,
  opacity,
  side,
  x,
  y,
}: {
  look: CharacterLook
  opacity: number
  side: -1 | 1
  x: number
  y: number
}) {
  const claw = look.clawColor ?? look.accentColor
  const count = hasFeature(look, 'claws4') ? 4 : hasFeature(look, 'claws3') || hasFeature(look, 'redTips') ? 3 : 0
  if (!count) {
    return (
      <BoogarPartProvider part="hand">
        <mesh position={[x, y, 0.04]}>
          <PSphere args={[0.035, 8, 8]} />
          <Mat color={look.limbColor} opacity={opacity} />
        </mesh>
      </BoogarPartProvider>
    )
  }
  return (
    <group position={[x, y, 0.05]}>
      <BoogarPartProvider part="hand">
        <mesh>
          <PSphere args={[0.032, 8, 8]} />
          <Mat color={look.limbColor} opacity={opacity} />
        </mesh>
      </BoogarPartProvider>
      <BoogarPartProvider part="claw">
        {Array.from({ length: count }, (_, i) => (
          <mesh
            key={i}
            position={[(i - (count - 1) / 2) * 0.022 * side, -0.028, 0.01]}
            rotation={[0.6, 0, 0]}
          >
            <PCone args={[0.01, 0.03, 6]} />
            <Mat color={claw} opacity={opacity} />
          </mesh>
        ))}
      </BoogarPartProvider>
    </group>
  )
}

function Eyes({ look, opacity }: { look: CharacterLook; opacity: number }) {
  const y = bodyCenterY(look) + look.eyeY
  const z = faceZ(look)
  const s = look.eyeSpacing
  const size = look.eyeSize
  const dark = look.eyeColor

  if (look.eyeStyle === 'cyclops') {
    return (
      <group position={[0, y, z]}>
        <mesh castShadow>
          <PSphere args={[size, 16, 16]} />
          <Mat color={look.scleraColor ?? '#fff8f0'} opacity={opacity} roughness={0.28} smooth />
        </mesh>
        <mesh position={[0, 0, size * 0.55]}>
          <PSphere args={[size * 0.55, 12, 12]} />
          <Mat color={look.irisColor ?? look.accentColor} opacity={opacity} smooth />
        </mesh>
        <mesh position={[0, 0, size * 0.85]}>
          <PSphere args={[size * 0.22, 10, 10]} />
          <Mat color={dark} opacity={opacity} smooth />
        </mesh>
      </group>
    )
  }

  if (look.eyeStyle === 'stalk') {
    const stalkH = 0.28
    return (
      <group>
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[s * side, bodyCenterY(look) + bodyRadius(look) * 0.55, 0.02]}>
            <mesh position={[0, stalkH * 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.028, stalkH, 8]} />
              <Mat color={look.limbColor} opacity={opacity} />
            </mesh>
            <mesh position={[0, stalkH + 0.02, 0.02]} castShadow>
              <PSphere args={[size, 14, 14]} />
              <Mat color={look.scleraColor ?? '#f6efe6'} opacity={opacity} roughness={0.28} smooth />
            </mesh>
            <mesh position={[0, stalkH + 0.015, size * 0.55]}>
              <PSphere args={[size * 0.42, 10, 10]} />
              <Mat color={look.irisColor ?? dark} opacity={opacity} smooth />
            </mesh>
            <mesh position={[0, stalkH + size * 0.55, 0.01]} scale={[1.15, 0.45, 1.1]}>
              <PSphere args={[size * 0.95, 12, 12]} />
              <Mat color={look.bodyColor} opacity={opacity} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  if (look.eyeStyle === 'largeWhite') {
    return (
      <group>
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[s * side, y, z * 0.55]}>
            <mesh castShadow>
              <PSphere args={[size, 14, 14]} />
              <Mat color={look.scleraColor ?? '#effde6'} opacity={opacity} roughness={0.32} smooth />
            </mesh>
            <mesh rotation={[0, 0, 0]} position={[0, 0, size * 0.72]} scale={[1.1, 0.28, 0.2]}>
              <PCapsule args={[0.012, 0.04, 3, 6]} />
              <Mat color={dark} opacity={opacity} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  const sclera = look.eyeStyle === 'yellow' ? (look.scleraColor ?? '#F9EB68') : null
  return (
    <group>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[s * side, y, z]}>
          {sclera ? (
            <>
              <mesh>
                <PSphere args={[size, 12, 12]} />
                <Mat color={sclera} opacity={opacity} roughness={0.3} smooth />
              </mesh>
              <mesh position={[0, 0, size * 0.55]}>
                <PSphere args={[size * 0.38, 10, 10]} />
                <Mat color={dark} opacity={opacity} smooth />
              </mesh>
            </>
          ) : (
            <mesh>
              <PSphere args={[size, 10, 10]} />
              <Mat color={dark} opacity={opacity} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function Brows({ look, opacity }: { look: CharacterLook; opacity: number }) {
  if (look.browStyle === 'none') return null
  const y = bodyCenterY(look) + look.eyeY + look.eyeSize + 0.045
  const z = faceZ(look) + 0.01
  const color = look.accentColor
  if (look.browStyle === 'unibrow') {
    return (
      <RoundedBox args={[0.26, 0.045, 0.05]} radius={0.014} smoothness={2} position={[0, y, z]}>
        <Mat color={color} opacity={opacity} />
      </RoundedBox>
    )
  }
  if (look.browStyle === 'thin') {
    return (
      <group>
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[look.eyeSpacing * side, y, z]} scale={[1, 0.35, 1]}>
            <PCapsule args={[0.012, 0.05, 3, 6]} />
            <Mat color={color} opacity={opacity} />
          </mesh>
        ))}
      </group>
    )
  }
  return (
    <group>
      {([-1, 1] as const).map((side) => (
        <RoundedBox
          key={side}
          args={[0.1, 0.05, 0.05]}
          radius={0.012}
          smoothness={2}
          position={[look.eyeSpacing * side, y, z]}
        >
          <Mat color={color} opacity={opacity} />
        </RoundedBox>
      ))}
    </group>
  )
}

function Mouth({ look, opacity }: { look: CharacterLook; opacity: number }) {
  const y = bodyCenterY(look) + look.eyeY - look.eyeSize - 0.08
  const z = faceZ(look)
  const tooth = look.toothColor ?? '#F5F0E8'
  const lip = look.mouthColor ?? look.accentColor

  if (look.mouthStyle === 'bigLips') {
    return (
      <group position={[0, y - 0.02, z]}>
        <mesh scale={[1.55, 0.72, 0.85]} castShadow>
          <torusGeometry args={[0.1, 0.045, 10, 18]} />
          <Mat color={lip} opacity={opacity} roughness={0.45} />
        </mesh>
      </group>
    )
  }

  if (look.mouthStyle === 'oneTooth') {
    return (
      <group position={[0, y, z]}>
        <mesh rotation={[0, 0, 0]} scale={[1.4, 0.35, 1]}>
          <PCapsule args={[0.012, 0.08, 3, 6]} />
          <Mat color={look.accentColor} opacity={opacity} />
        </mesh>
        <RoundedBox args={[0.03, 0.036, 0.02]} radius={0.006} position={[0.05, -0.02, 0.01]}>
          <Mat color={tooth} opacity={opacity} />
        </RoundedBox>
      </group>
    )
  }

  const teeth =
    look.mouthStyle === 'twoTeeth'
      ? 2
      : look.mouthStyle === 'threeTeeth'
        ? 3
        : look.mouthStyle === 'fourTeeth' || look.mouthStyle === 'buckTeeth'
          ? look.mouthStyle === 'buckTeeth'
            ? 2
            : 4
          : 0

  return (
    <group position={[0, y, z]}>
      <mesh scale={[1.6, 0.28, 1]}>
        <PCapsule args={[0.01, look.mouthStyle === 'smile' ? 0.07 : 0.055, 3, 6]} />
        <Mat color={look.eyeColor} opacity={opacity} />
      </mesh>
      {teeth > 0 &&
        Array.from({ length: teeth }, (_, i) => {
          const spread = teeth === 4 ? 0.028 : 0.022
          const x = (i - (teeth - 1) / 2) * spread
          const h = look.mouthStyle === 'buckTeeth' ? 0.038 : 0.03
          return (
            <RoundedBox key={i} args={[0.022, h, 0.018]} radius={0.005} position={[x, -0.02, 0.01]}>
              <Mat color={tooth} opacity={opacity} />
            </RoundedBox>
          )
        })}
    </group>
  )
}

function Features({ look, opacity }: { look: CharacterLook; opacity: number }) {
  const r = bodyRadius(look)
  const y = bodyCenterY(look)
  const accent = look.accentColor
  const feature = look.featureColor ?? accent

  return (
    <group>
      {hasFeature(look, 'bearEars') &&
        ([-1, 1] as const).map((side) => (
          <group key={side} position={[r * 0.7 * side, y + r * 0.78, 0]}>
            <BoogarPartProvider part="ear">
              <mesh castShadow>
                <PSphere args={[0.095, 12, 12]} />
                <Mat color={look.bodyColor} opacity={opacity} />
              </mesh>
            </BoogarPartProvider>
            <BoogarPartProvider part="earInner">
              <mesh position={[0, 0, 0.035]} scale={[0.7, 0.7, 0.35]}>
                <PSphere args={[0.07, 10, 10]} />
                <Mat color={feature} opacity={opacity} />
              </mesh>
            </BoogarPartProvider>
          </group>
        ))}

      {hasFeature(look, 'bunnyEars') &&
        ([-1, 1] as const).map((side) => (
          <group key={side} position={[0.09 * side, y + r * 1.05, -0.02]} rotation={[0.08, 0, side * 0.12]}>
            <mesh castShadow>
              <PCapsule args={[0.052, 0.46, 6, 10]} />
              <Mat color={feature} opacity={opacity} />
            </mesh>
            <mesh position={[0, 0.04, 0.025]} scale={[0.62, 0.88, 0.32]}>
              <PCapsule args={[0.045, 0.36, 5, 8]} />
              <Mat color={look.bodyColor} opacity={opacity} />
            </mesh>
          </group>
        ))}

      {hasFeature(look, 'nubEars') &&
        ([-1, 1] as const).map((side) => (
          <mesh key={side} position={[r * 0.62 * side, y + r * 0.62, 0.02]} castShadow>
            <PSphere args={[0.045, 10, 10]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
        ))}

      {hasFeature(look, 'bullHorns') &&
        ([-1, 1] as const).map((side) => (
          <group key={side} position={[0.13 * side, y + r * 0.88, -0.02]}>
            <mesh rotation={[0.12, 0, side * -0.5]} position={[side * 0.03, 0.1, 0]} castShadow>
              <PCapsule args={[0.048, 0.16, 5, 8]} />
              <Mat color="#FFD54F" opacity={opacity} />
            </mesh>
            <mesh rotation={[0.02, 0, side * -0.12]} position={[side * 0.02, 0.22, 0]} castShadow>
              <PCapsule args={[0.038, 0.1, 5, 8]} />
              <Mat color="#FFB34A" opacity={opacity} />
            </mesh>
            <mesh position={[0.01 * side, 0.3, 0]} castShadow>
              <PSphere args={[0.04, 10, 10]} />
              <Mat color="#FF6B6B" opacity={opacity} />
            </mesh>
          </group>
        ))}

      {hasFeature(look, 'onionSprout') && (
        <group position={[0, y + r * 1.05, 0]}>
          {[
            [0, 0.08, 0.02, 0],
            [-0.06, 0.06, -0.01, -0.4],
            [0.06, 0.06, -0.01, 0.4],
            [-0.03, 0.05, -0.05, -0.2],
            [0.03, 0.045, -0.05, 0.2],
          ].map(([x, hy, z, rot], i) => (
            <mesh key={i} position={[x, hy, z]} rotation={[0.2, 0, rot]} castShadow>
              <PCone args={[0.042, 0.18, 7]} />
              <Mat color={i % 2 ? '#67C25A' : feature} opacity={opacity} />
            </mesh>
          ))}
        </group>
      )}

      {hasFeature(look, 'leafSprout') && (
        <group position={[0, y + r * 0.95, 0]}>
          <mesh rotation={[0, 0, 0.55]} position={[-0.02, 0.04, 0]} castShadow>
            <PCapsule args={[0.018, 0.06, 4, 6]} />
            <Mat color={feature} opacity={opacity} />
          </mesh>
          <mesh rotation={[0, 0, -0.55]} position={[0.02, 0.04, 0]} castShadow>
            <PCapsule args={[0.018, 0.06, 4, 6]} />
            <Mat color={feature} opacity={opacity} />
          </mesh>
        </group>
      )}

      {hasFeature(look, 'hairTuft') && (
        <group position={[0, y + r * 0.95, 0]}>
          {[0, -0.03, 0.03].map((x, i) => (
            <mesh key={i} position={[x, 0.07, -0.01]} rotation={[0.2, 0, x * 8]} castShadow>
              <PCone args={[0.024, 0.11, 6]} />
              <Mat color={feature} opacity={opacity} />
            </mesh>
          ))}
        </group>
      )}

      {hasFeature(look, 'flameCrest') && (
        <group position={[0, y + r * 0.85, 0]}>
          {[-0.07, -0.035, 0, 0.035, 0.07].map((x, i) => (
            <mesh key={i} position={[x, 0.1 + (i === 2 ? 0.05 : 0.02), 0]} rotation={[0.1, 0, x * 1.4]} castShadow>
              <PCone args={[0.036, 0.18 + (i === 2 ? 0.08 : 0), 6]} />
              <Mat color={feature} opacity={opacity} />
            </mesh>
          ))}
        </group>
      )}

      {hasFeature(look, 'spiralAntenna') &&
        ([-1, 1] as const).map((side) => (
          <group key={side} position={[0.08 * side, y + r * 0.95, 0]}>
            <mesh position={[0, 0.11, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.016, 0.22, 6]} />
              <Mat color={accent} opacity={opacity} />
            </mesh>
            <mesh position={[0.04 * side, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.04, 0.013, 6, 12]} />
              <Mat color={accent} opacity={opacity} />
            </mesh>
          </group>
        ))}

      {hasFeature(look, 'dorsalSpikes') &&
        [
          [0.98, 0.12],
          [0.82, 0.02],
          [0.62, -0.08],
          [0.38, -0.16],
          [0.12, -0.22],
          [-0.1, -0.26],
        ].map(([t, z], i) => (
          <mesh
            key={i}
            position={[0, y + r * t, r * z]}
            rotation={[0.35 + i * 0.18, 0, 0]}
            castShadow
          >
            <PCone args={[0.058 - i * 0.004, 0.18 - i * 0.012, 7]} />
            <Mat color={accent} opacity={opacity} />
          </mesh>
        ))}

      {hasFeature(look, 'trunk') && (
        <group position={[0, y + 0.02, faceZ(look) * 0.55]}>
          <mesh rotation={[1.15, 0, 0]} position={[0, -0.06, 0.1]} castShadow>
            <PCapsule args={[0.07, 0.22, 6, 10]} />
            <Mat color={look.bodyColor} opacity={opacity} />
          </mesh>
          <mesh position={[0, -0.16, 0.22]} castShadow>
            <PSphere args={[0.065, 10, 10]} />
            <Mat color={look.bodyColor} opacity={opacity} />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[0.018 * side, -0.13, 0.2]}>
              <PSphere args={[0.01, 6, 6]} />
              <Mat color={accent} opacity={opacity} />
            </mesh>
          ))}
        </group>
      )}

      {hasFeature(look, 'cheekDashes') &&
        ([-1, 1] as const).map((side) => (
          <group key={side} position={[0.16 * side, y - 0.02, faceZ(look) * 0.7]}>
            {[0.03, 0, -0.03].map((dy, i) => (
              <mesh key={i} position={[0, dy, 0]} scale={[1.2, 0.35, 0.4]}>
                <PCapsule args={[0.01, 0.02, 3, 5]} />
                <Mat color={look.eyeColor} opacity={opacity} />
              </mesh>
            ))}
          </group>
        ))}

      {hasFeature(look, 'onionRidges') &&
        [-0.45, -0.22, 0, 0.22, 0.45].map((ang, i) => (
          <mesh
            key={i}
            position={[Math.sin(ang) * r * 0.92, y, Math.cos(ang) * r * 0.15]}
            rotation={[0, ang, 0]}
            scale={[0.08, 1.05, 0.12]}
          >
            <PCapsule args={[0.04, r * 1.5, 4, 6]} />
            <Mat color={look.bodyColor} opacity={opacity} roughness={0.55} />
          </mesh>
        ))}

      {hasFeature(look, 'goldSpots') &&
        [
          [0.12, -0.08, -0.14],
          [-0.1, -0.16, -0.1],
          [0.04, -0.22, 0.08],
          [-0.14, 0.02, -0.16],
        ].map(([x, dy, z], i) => (
          <mesh key={i} position={[x, y + dy, z]}>
            <PSphere args={[0.018, 8, 8]} />
            <Mat color={feature} opacity={opacity} emissive={feature} emissiveIntensity={0.2} />
          </mesh>
        ))}

      {hasFeature(look, 'bellySeam') && (
        <mesh position={[0, y - r * 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 0.92, 0.012, 8, 24]} />
          <Mat color={feature} opacity={opacity} />
        </mesh>
      )}

      {hasFeature(look, 'redNose') && (
        <mesh position={[0, y + look.eyeY - 0.02, faceZ(look) + 0.02]} castShadow>
          <PSphere args={[0.028, 10, 10]} />
          <Mat color={feature} opacity={opacity} />
        </mesh>
      )}

      {hasFeature(look, 'backBumps') &&
        [0.2, 0, -0.16].map((t, i) => (
          <mesh key={i} position={[0, y + t, -r * 0.85]}>
            <PSphere args={[0.028, 8, 8]} />
            <Mat color={look.accentColor} opacity={opacity} />
          </mesh>
        ))}

      {hasFeature(look, 'bodySpikes') && <BodySpikes look={look} opacity={opacity} />}
    </group>
  )
}

function BodySpikes({ look, opacity }: { look: CharacterLook; opacity: number }) {
  const r = bodyRadius(look)
  const y = bodyCenterY(look)
  const points = useMemo(() => {
    const out: [number, number, number][] = []
    const n = 36
    for (let i = 0; i < n; i += 1) {
      const yy = 1 - (i / (n - 1)) * 2
      const rad = Math.sqrt(Math.max(0, 1 - yy * yy))
      const theta = i * 2.399
      const x = Math.cos(theta) * rad
      const z = Math.sin(theta) * rad
      if (z > 0.62 && Math.abs(x) < 0.5 && yy < 0.4 && yy > -0.45) continue
      out.push([x * r, y + yy * r * 0.95, z * r])
    }
    return out
  }, [r, y])

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <PCone args={[0.022, 0.05, 5]} />
          <Mat color={look.bodyColor} opacity={opacity} />
        </mesh>
      ))}
    </group>
  )
}

function Tail({ look, opacity }: { look: CharacterLook; opacity: number }) {
  const r = bodyRadius(look)
  const y = bodyCenterY(look)
  if (look.tail === 'ball') {
    return (
      <mesh position={[0, y - r * 0.35, -r * 0.95]} castShadow>
        <PSphere args={[0.07, 12, 12]} />
        <Mat color={look.bodyColor} opacity={opacity} />
      </mesh>
    )
  }
  if (look.tail === 'spiral') {
    return (
      <group position={[0, y - r * 0.45, -r * 0.7]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[Math.cos(i * 1.2) * 0.05, -i * 0.035, -0.04 - i * 0.03]}
            rotation={[0.4, i, 0]}
          >
            <torusGeometry args={[0.045 - i * 0.006, 0.018, 6, 10]} />
            <Mat color={look.bodyColor} opacity={opacity} />
          </mesh>
        ))}
      </group>
    )
  }
  if (look.tail === 'scurve') {
    return (
      <group position={[0, y - r * 0.85, -0.12]}>
        <mesh rotation={[0.8, 0, 0]} position={[0, -0.04, -0.06]} castShadow>
          <PCapsule args={[0.05, 0.16, 5, 8]} />
          <Mat color={look.bodyColor} opacity={opacity} />
        </mesh>
        <mesh position={[0.04, -0.12, -0.14]} rotation={[0, 0.4, 0.6]}>
          <torusGeometry args={[0.055, 0.022, 6, 12, Math.PI * 1.4]} />
          <Mat color={look.bodyColor} opacity={opacity} />
        </mesh>
      </group>
    )
  }
  return null
}

function HeldInstrument({ instrument, bodyY }: { instrument?: string; bodyY: number }) {
  if (!instrument) return null
  const kind = instrumentKind(instrument) ?? instrument
  const y = bodyY * 0.55
  if (kind === 'drums' || kind === 'dj' || kind === 'bombo' || kind === 'caixa' || kind === 'conga' || kind === 'bongo') {
    return (
      <mesh position={[0.3, y, 0.16]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
        <Mat color="#E74C3C" />
      </mesh>
    )
  }
  if (kind === 'guitar' || kind === 'ukulele' || kind === 'electric_guitar' || kind === 'violin') {
    return (
      <group position={[0.28, y, 0.14]} rotation={[0.2, 0.4, 0.5]}>
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
  if (kind === 'trumpet' || kind === 'trombone' || kind === 'flute' || kind === 'clarinet' || kind === 'harmonica') {
    return (
      <mesh position={[0.3, y + 0.04, 0.16]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 8]} />
        <Mat color="#F4D03F" />
      </mesh>
    )
  }
  if (kind === 'piano' || kind === 'xylophone' || kind === 'synth' || kind === 'accordion' || kind === 'organ') {
    return (
      <mesh position={[0.28, y, 0.16]}>
        <boxGeometry args={[0.18, 0.08, 0.1]} />
        <Mat color="#2b1654" />
      </mesh>
    )
  }
  return (
    <mesh position={[0.28, y, 0.16]}>
      <PSphere args={[0.07, 10, 10]} />
      <Mat color="#5EE0C4" />
    </mesh>
  )
}

export function Humanoid({
  characterId,
  instrument,
  muted = false,
  playing = false,
  ghost = false,
}: Props) {
  const group = useRef<Group>(null)
  const look = CHARACTERS[characterId]
  const opacity = ghost ? 0.42 : muted ? 0.55 : 1
  const color = muted ? '#8a8496' : look.bodyColor
  const bodyY = bodyCenterY(look)

  useLayoutEffect(() => {
    const root = group.current
    if (!root || !ghost) return
    root.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) obj.castShadow = false
    })
  }, [ghost, characterId, instrument])

  useFrame(() => {
    if (!group.current) return
    const live = playing && !muted && !ghost && audioEngine.isAudible()
    group.current.position.y = live
      ? Math.abs(Math.sin(audioEngine.getVisualBeatPhase() * Math.PI)) * 0.07
      : 0
  })

  const armSlots = look.armCount === 4 ? ([0, 1] as const) : ([0] as const)
  const plush = useTexPilot() && characterId === 'boogar'

  return (
    <BoogarPlush.Provider value={plush}>
      <group ref={group} scale={look.height}>
        <BoogarPartProvider part="leg">
          <Limb look={look} opacity={opacity} side={-1} kind="leg" />
          <Limb look={look} opacity={opacity} side={1} kind="leg" />
        </BoogarPartProvider>
        <BoogarPartProvider part="body">
          <BodyMesh look={look} color={color} opacity={opacity} />
        </BoogarPartProvider>
        {armSlots.map((index) => (
          <BoogarPartProvider part="arm" key={index}>
            <Limb look={look} opacity={opacity} side={-1} kind="arm" index={index} />
            <Limb look={look} opacity={opacity} side={1} kind="arm" index={index} />
          </BoogarPartProvider>
        ))}
        {!plush && <Eyes look={look} opacity={opacity} />}
        {!plush && <Brows look={look} opacity={opacity} />}
        {!plush && <Mouth look={look} opacity={opacity} />}
        <Features look={look} opacity={opacity} />
        <Tail look={look} opacity={opacity} />
        <HeldInstrument instrument={instrument} bodyY={bodyY} />
      </group>
    </BoogarPlush.Provider>
  )
}
