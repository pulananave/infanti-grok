import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
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

function Lights({ theme }: { theme: SongTheme }) {
  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.fog, 14, 28]} />
      <ambientLight intensity={0.88} color="#fff4e8" />
      <hemisphereLight args={[theme.horizon, '#b7e3c0', 0.58]} />
      <directionalLight
        position={[4.5, 9, 5]}
        intensity={0.48}
        color="#fff1d6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 3.2, 1.2]} color={theme.accent} intensity={0.35} distance={10} decay={2} />
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
      <Bloom luminanceThreshold={0.78} luminanceSmoothing={0.28} intensity={0.72} mipmapBlur />
      <DepthOfField focusDistance={0.014} focalLength={0.016} bokehScale={2.1} height={420} />
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
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 5.4, 8.4], fov: 42, near: 0.1, far: 48 }}
      onPointerMissed={() => undefined}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
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
      <ContactShadows position={[0, 0.012, 0]} opacity={0.22} scale={16} blur={2.8} far={4} color="#6b4a78" />
      <GrabPlane />
      <mesh position={LISTENER_POSITION.toArray()} visible={false}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial />
      </mesh>
      <StagePost />
    </Canvas>
  )
}
