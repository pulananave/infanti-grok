import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { CHARACTER_ORDER, CHARACTERS } from '../config/characters'
import { STAGE_LOOK } from '../theme/stageLook'
import { Humanoid } from './Humanoid'

function Lights() {
  return (
    <>
      <color attach="background" args={['#d8ecf8']} />
      <ambientLight intensity={0.45} color="#fff4e8" />
      <hemisphereLight args={['#ffe8c8', '#7fa88c', 0.4]} />
      <directionalLight
        position={STAGE_LOOK.keyPosition}
        intensity={1.2}
        color={STAGE_LOOK.keyColor}
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </>
  )
}

export function LookGallery() {
  return (
    <div className="app" style={{ background: '#1a0f30' }}>
      <div style={{ position: 'absolute', top: 10, left: 14, zIndex: 2, color: '#fff7e8', fontWeight: 700 }}>
        Character looks
      </div>
      <Canvas shadows camera={{ position: [0, 2.8, 7.6], fov: 42, near: 0.1, far: 40 }}>
        <Lights />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 4]} />
          <meshStandardMaterial color="#c8ddc0" />
        </mesh>
        {CHARACTER_ORDER.map((id, index) => {
          const x = (index - 5) * 1.08
          return (
            <group key={id} position={[x, 0, 0]}>
              <Humanoid characterId={id} playing bpm={110} />
            </group>
          )
        })}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={18} blur={2} far={4} />
      </Canvas>
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          color: '#fff7e8',
          fontSize: 11,
          pointerEvents: 'none',
        }}
      >
        {CHARACTER_ORDER.map((id) => (
          <span key={id} style={{ width: 72, textAlign: 'center' }}>
            {CHARACTERS[id].name}
          </span>
        ))}
      </div>
    </div>
  )
}
