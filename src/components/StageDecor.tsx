import type { SongId } from '../types'

function Web() {
  return (
    <group position={[0, 2.4, -4.4]}>
      {[-2, -1, 0, 1, 2].map((x) => (
        <mesh key={x} position={[x * 0.7, 0, 0]} rotation={[0, 0, x * 0.2]}>
          <cylinderGeometry args={[0.01, 0.01, 2.8, 6]} />
          <meshStandardMaterial color="#e8d7ff" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  )
}

function Canoe() {
  return (
    <group position={[-3.6, 0.12, -3.2]} rotation={[0, 0.6, 0]}>
      <mesh>
        <capsuleGeometry args={[0.35, 1.6, 6, 12]} />
        <meshStandardMaterial color="#8B5A2B" />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#F4D03F" />
      </mesh>
    </group>
  )
}

function Eggs() {
  return (
    <group>
      {[
        [-3.8, -2.4, '#ff8dc7'],
        [-3.2, -3.1, '#ffe56a'],
        [3.6, -2.8, '#5ee0c4'],
        [4.1, -3.6, '#c39bd3'],
      ].map(([x, z, color]) => (
        <mesh key={`${x}${z}`} position={[x as number, 0.16, z as number]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial color={color as string} />
        </mesh>
      ))}
    </group>
  )
}

function Hay() {
  return (
    <group>
      <mesh position={[3.8, 0.2, -3.4]}>
        <boxGeometry args={[1.2, 0.4, 0.7]} />
        <meshStandardMaterial color="#E4B84A" />
      </mesh>
      <mesh position={[-4, 0.35, -3.6]}>
        <boxGeometry args={[0.12, 0.7, 1.4]} />
        <meshStandardMaterial color="#8B5A2B" />
      </mesh>
    </group>
  )
}

function Pads() {
  return (
    <group>
      {[
        [-3.4, -2.6],
        [-2.4, -3.6],
        [3.2, -3],
        [4, -3.8],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.45, 16]} />
          <meshStandardMaterial color="#3FA36A" />
        </mesh>
      ))}
    </group>
  )
}

export function StageDecor({ songId }: { songId: SongId }) {
  return (
    <group>
      {songId === 'aranha' && <Web />}
      {songId === 'canoa' && <Canoe />}
      {songId === 'coelho' && <Eggs />}
      {songId === 'pintinho' && <Hay />}
      {songId === 'sapo' && <Pads />}
    </group>
  )
}
