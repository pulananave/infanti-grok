import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CHARACTER_ORDER, CHARACTERS } from '../config/characters'
import { STAGE_LOOK } from '../theme/stageLook'
import { Humanoid } from './Humanoid'
import { StageLights } from './StageLighting'

export function LookGallery() {
  const top = CHARACTER_ORDER.slice(0, 6)
  const bottom = CHARACTER_ORDER.slice(6)
  return (
    <div className="app" style={{ background: '#1a0f30' }}>
      <div style={{ position: 'absolute', top: 10, left: 14, zIndex: 2, color: '#fff7e8', fontWeight: 700 }}>
        Character looks
      </div>
      <Canvas
        shadows="soft"
        dpr={STAGE_LOOK.dpr}
        camera={{ position: [0, 3.4, 7.2], fov: 40, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: STAGE_LOOK.exposure,
          powerPreference: 'high-performance',
        }}
      >
        <StageLights theme={{ sky: '#cfe8f6', horizon: '#f3d4b8', fog: '#d8e8f0' }} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[14, 8]} />
          <meshPhysicalMaterial color="#c8ddc0" roughness={0.62} clearcoat={0.18} sheen={0.25} sheenColor="#c8ddc0" />
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
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={STAGE_LOOK.contactOpacity}
          scale={18}
          blur={STAGE_LOOK.contactBlur}
          far={STAGE_LOOK.contactFar}
          resolution={STAGE_LOOK.contactResolution}
          color="#3a2048"
        />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          {STAGE_LOOK.ssao ? (
            <N8AO aoRadius={STAGE_LOOK.ssaoRadius} intensity={STAGE_LOOK.ssaoIntensity} quality="medium" halfRes />
          ) : (
            <></>
          )}
          <Bloom
            luminanceThreshold={STAGE_LOOK.bloomThreshold}
            luminanceSmoothing={STAGE_LOOK.bloomSmoothing}
            intensity={STAGE_LOOK.bloomIntensity}
            mipmapBlur
          />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
