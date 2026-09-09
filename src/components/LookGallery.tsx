import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html } from '@react-three/drei'
import { CHARACTER_ORDER, CHARACTERS } from '../config/characters'
import { STAGE_LOOK } from '../theme/stageLook'
import { Humanoid } from './Humanoid'

function Lights() {
  return (
    <>
      <color attach="background" args={['#cfe8f6']} />
      <ambientLight intensity={0.5} color="#fff4e8" />
      <hemisphereLight args={['#ffe8c8', '#7fa88c', 0.42]} />
      <directionalLight
        position={STAGE_LOOK.keyPosition}
        intensity={1.25}
        color={STAGE_LOOK.keyColor}
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </>
  )
}

export function LookGallery() {
  const top = CHARACTER_ORDER.slice(0, 6)
  const bottom = CHARACTER_ORDER.slice(6)
  return (
    <div className="app" style={{ background: '#1a0f30' }}>
      <div style={{ position: 'absolute', top: 10, left: 14, zIndex: 2, color: '#fff7e8', fontWeight: 700 }}>
        Character looks
      </div>
      <Canvas shadows camera={{ position: [0, 3.4, 7.2], fov: 40, near: 0.1, far: 50 }}>
        <Lights />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[14, 8]} />
          <meshStandardMaterial color="#c8ddc0" />
        </mesh>
        {top.map((id, index) => {
          const x = (index - 2.5) * 1.35
          return (
            <group key={id} position={[x, 0, 0.6]}>
              <Humanoid characterId={id} playing bpm={110} />
              <Html position={[0, 1.35, 0]} center>
                <div style={{ color: '#2b1654', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {CHARACTERS[id].name}
                </div>
              </Html>
            </group>
          )
        })}
        {bottom.map((id, index) => {
          const x = (index - 2) * 1.35
          return (
            <group key={id} position={[x, 0, -1.4]}>
              <Humanoid characterId={id} playing bpm={110} />
              <Html position={[0, 1.35, 0]} center>
                <div style={{ color: '#2b1654', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {CHARACTERS[id].name}
                </div>
              </Html>
            </group>
          )
        })}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={18} blur={2} far={4} />
      </Canvas>
    </div>
  )
}
