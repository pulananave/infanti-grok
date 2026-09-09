import { StageEnvironment } from './StageEnvironment'
import { TOY, ToyMaterial } from '../theme/toy'
import type { SongId, SongTheme } from '../types'

function ToyWeb() {
  return (
    <group position={[0, 3.32, -4.55]}>
      {[-2, -1, 0, 1, 2].map((x) => (
        <mesh key={x} position={[x * 0.55, 0, 0]} rotation={[0, 0, x * 0.18]}>
          <capsuleGeometry args={[0.035, 2.2, 4, 8]} />
          <ToyMaterial color={TOY.lavender} silicone />
        </mesh>
      ))}
      <mesh position={[0, 0.15, 0.12]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <ToyMaterial color={TOY.lilac} silicone />
      </mesh>
    </group>
  )
}

function ToyCanoe() {
  return (
    <group position={[-3.7, 0.18, -3.35]} rotation={[0, 0.55, 0]}>
      <mesh>
        <capsuleGeometry args={[0.32, 1.55, 6, 14]} />
        <ToyMaterial color={TOY.trunk} silicone />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <capsuleGeometry args={[0.05, 0.42, 4, 8]} />
        <ToyMaterial color={TOY.lemon} />
      </mesh>
    </group>
  )
}

function ToyEggs() {
  return (
    <group>
      {[
        [-3.9, -2.5, TOY.pink],
        [-3.25, -3.2, TOY.lemon],
        [3.55, -2.85, TOY.mint],
        [4.15, -3.55, TOY.lavender],
      ].map(([x, z, color]) => (
        <mesh key={`${x}${z}`} position={[x as number, 0.2, z as number]} scale={[1, 1.25, 1]}>
          <sphereGeometry args={[0.18, 14, 14]} />
          <ToyMaterial color={color as string} silicone />
        </mesh>
      ))}
    </group>
  )
}

function ToyHay() {
  return (
    <group>
      <mesh position={[3.75, 0.22, -3.45]}>
        <boxGeometry args={[1.15, 0.38, 0.68]} />
        <ToyMaterial color={TOY.lemon} silicone />
      </mesh>
      <mesh position={[-4.05, 0.32, -3.55]}>
        <capsuleGeometry args={[0.08, 0.7, 4, 8]} />
        <ToyMaterial color={TOY.trunk} />
      </mesh>
    </group>
  )
}

function ToyPads() {
  return (
    <group>
      {[
        [-3.45, -2.65],
        [-2.45, -3.55],
        [3.15, -3.05],
        [4.05, -3.75],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.42, 20]} />
          <ToyMaterial color={TOY.mint} silicone />
        </mesh>
      ))}
    </group>
  )
}

export function StageDecor({ songId, theme }: { songId: SongId; theme: SongTheme }) {
  return (
    <group>
      <StageEnvironment theme={theme} />
      {songId === 'aranha' && <ToyWeb />}
      {songId === 'canoa' && <ToyCanoe />}
      {songId === 'coelho' && <ToyEggs />}
      {songId === 'pintinho' && <ToyHay />}
      {songId === 'sapo' && <ToyPads />}
    </group>
  )
}
