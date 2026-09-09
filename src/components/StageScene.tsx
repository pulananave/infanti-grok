import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { getSong } from '../config/loadConfig'
import { useGame } from '../state/gameStore'
import {
  clampToFloor,
  LISTENER_POSITION,
  projectToFloor,
  registerScene,
  STAGE_BOUNDS,
  unregisterScene,
} from '../state/sceneBridge'
import { STAGE_LOOK } from '../theme/stageLook'
import { Humanoid } from './Humanoid'
import { StageDecor } from './StageDecor'
import type { SongId, SongTheme, StageInstance } from '../types'

function SceneBridge() {
  const { camera, gl } = useThree()
  useEffect(() => {
    registerScene(camera, gl.domElement)
    return () => unregisterScene()
  }, [camera, gl])
  return null
}

function SoftToyEnvironment() {
  const { scene } = useThree()
  useEffect(() => {
    scene.environmentIntensity = STAGE_LOOK.envIntensity
    return () => {
      scene.environmentIntensity = 1
    }
  }, [scene])

  return (
    <Environment frames={1} resolution={STAGE_LOOK.envResolution} environmentIntensity={STAGE_LOOK.envIntensity}>
      <mesh scale={12}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#f3dcc8" side={THREE.BackSide} />
      </mesh>
      <mesh position={[5, 7, 4]}>
        <sphereGeometry args={[2.2, 8, 8]} />
        <meshBasicMaterial color="#fff6e4" />
      </mesh>
      <mesh position={[-6, 2.5, -3]}>
        <sphereGeometry args={[2.8, 8, 8]} />
        <meshBasicMaterial color="#c5def5" />
      </mesh>
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshBasicMaterial color="#a8d4b0" />
      </mesh>
    </Environment>
  )
}

function Lights({ theme }: { theme: SongTheme }) {
  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.fog, 18, 36]} />
      <ambientLight intensity={STAGE_LOOK.ambient} color={STAGE_LOOK.ambientColor} />
      <hemisphereLight args={[theme.horizon, STAGE_LOOK.hemiGround, STAGE_LOOK.hemi]} />
      <directionalLight
        position={[5.2, 9.5, 4.2]}
        intensity={STAGE_LOOK.key}
        color={STAGE_LOOK.keyColor}
        castShadow
        shadow-mapSize={[STAGE_LOOK.shadowMapSize, STAGE_LOOK.shadowMapSize]}
        shadow-bias={-0.00035}
        shadow-normalBias={0.04}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4.6, 3.2, 2.6]} intensity={STAGE_LOOK.fillCool} color={STAGE_LOOK.fillCoolColor} />
      <directionalLight position={[1.4, 3.6, -5.4]} intensity={STAGE_LOOK.fillWarm} color={STAGE_LOOK.fillWarmColor} />
      <SoftToyEnvironment />
    </>
  )
}

function pickNearestCharacter(point: { x: number; z: number }) {
  const instances = useGame.getState().instances
  let nearest = null as (typeof instances)[number] | null
  let best = 1.2
  for (const instance of instances) {
    const distance = Math.hypot(instance.position[0] - point.x, instance.position[2] - point.z)
    if (distance < best) {
      best = distance
      nearest = instance
    }
  }
  return nearest
}

function StageCharacter({
  instance,
  bpm,
}: {
  instance: StageInstance
  bpm: number
}) {
  const group = useRef<THREE.Group>(null)
  const beginMoveDrag = useGame((s) => s.beginMoveDrag)

  return (
    <group
      ref={group}
      position={instance.position}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.nativeEvent.preventDefault()
        beginMoveDrag(instance.id, instance.instrument, event.clientX, event.clientY)
      }}
    >
      <mesh position={[0, 0.55, 0]} visible={false}>
        <sphereGeometry args={[0.95, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Humanoid
        characterId={instance.characterId}
        instrument={instance.instrument}
        muted={instance.muted}
        playing
        bpm={bpm}
      />
    </group>
  )
}

function GrabPlane() {
  const beginMoveDrag = useGame((s) => s.beginMoveDrag)
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
      onPointerDown={(event) => {
        if (useGame.getState().drag) return
        const nearest = pickNearestCharacter(event.point)
        if (!nearest) return
        event.stopPropagation()
        event.nativeEvent.preventDefault()
        beginMoveDrag(nearest.id, nearest.instrument, event.clientX, event.clientY)
      }}
    >
      <planeGeometry args={[STAGE_BOUNDS.x * 2.1, STAGE_BOUNDS.zFront - STAGE_BOUNDS.zBack + 0.6]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function SpawnPreview({ bpm }: { bpm: number }) {
  const drag = useGame((s) => s.drag)
  const marker = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!marker.current) return
    if (!drag || drag.type !== 'spawn') {
      marker.current.visible = false
      return
    }
    const hit = projectToFloor(drag.clientX, drag.clientY)
    if (!hit) {
      marker.current.visible = false
      return
    }
    const next = clampToFloor(hit)
    marker.current.visible = true
    marker.current.position.set(next.x, 0, next.z)
  })

  if (!drag || drag.type !== 'spawn') return null

  return (
    <group ref={marker}>
      <Humanoid characterId={drag.characterId} instrument={drag.instrument} ghost bpm={bpm} />
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 5.4, 8.4)
    camera.lookAt(0, 0.35, -0.4)
  }, [camera])
  return null
}

function StagePost() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        luminanceThreshold={STAGE_LOOK.bloomThreshold}
        luminanceSmoothing={STAGE_LOOK.bloomSmoothing}
        intensity={STAGE_LOOK.bloomIntensity}
        mipmapBlur
      />
      <DepthOfField
        focusDistance={0.014}
        focalLength={0.016}
        bokehScale={STAGE_LOOK.dofBokeh}
        height={STAGE_LOOK.dofHeight}
      />
    </EffectComposer>
  )
}

export function StageScene() {
  const songId = useGame((s) => s.songId) as SongId | null
  const instances = useGame((s) => s.instances)
  const song = getSong(songId)
  if (!song || !songId) return null

  return (
    <Canvas
      className="stage-canvas"
      shadows="soft"
      dpr={[1, 1.5]}
      camera={{ position: [0, 5.4, 8.4], fov: 42, near: 0.1, far: 48 }}
      onPointerMissed={() => undefined}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: STAGE_LOOK.exposure,
        powerPreference: 'high-performance',
      }}
      style={{ touchAction: 'none' }}
    >
      <SceneBridge />
      <CameraRig />
      <Lights theme={song.theme} />
      <StageDecor songId={songId} theme={song.theme} />
      {instances.map((instance) => (
        <StageCharacter key={instance.id} instance={instance} bpm={song.bpm} />
      ))}
      <SpawnPreview bpm={song.bpm} />
      <ContactShadows
        position={[0, 0.012, 0]}
        opacity={STAGE_LOOK.contactOpacity}
        scale={16}
        blur={STAGE_LOOK.contactBlur}
        far={4}
        color="#6b4a78"
      />
      <GrabPlane />
      <mesh position={LISTENER_POSITION.toArray()} visible={false}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial />
      </mesh>
      <StagePost />
    </Canvas>
  )
}
