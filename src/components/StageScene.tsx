import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
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
import type { SongId, StageInstance } from '../types'

function SceneBridge() {
  const { camera, gl } = useThree()
  useEffect(() => {
    registerScene(camera, gl.domElement)
    return () => unregisterScene()
  }, [camera, gl])
  return null
}

function Lights({ sky }: { sky: string }) {
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 10, 22]} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#ffe8c8', '#4a7c4a', 0.45]} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
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

function Floor({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[STAGE_BOUNDS.x * 2.1, STAGE_BOUNDS.zFront - STAGE_BOUNDS.zBack + 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.01, 2.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 24]} />
        <meshStandardMaterial color={accent} transparent opacity={0.7} />
      </mesh>
    </group>
  )
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

export function StageScene() {
  const songId = useGame((s) => s.songId) as SongId | null
  const instances = useGame((s) => s.instances)
  const song = getSong(songId)
  if (!song || !songId) return null

  return (
    <Canvas
      className="stage-canvas"
      shadows
      camera={{ position: [0, 5.4, 8.4], fov: 42, near: 0.1, far: 40 }}
      onPointerMissed={() => undefined}
      gl={{ antialias: true, alpha: false }}
      style={{ touchAction: 'none' }}
    >
      <SceneBridge />
      <CameraRig />
      <Lights sky={song.theme.sky} />
      <Floor color={song.theme.floor} accent={song.theme.accent} />
      <StageDecor songId={songId} />
      {instances.map((instance) => (
        <StageCharacter key={instance.id} instance={instance} bpm={song.bpm} />
      ))}
      <SpawnPreview bpm={song.bpm} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={16} blur={2} far={4} />
      <GrabPlane />
      <mesh position={LISTENER_POSITION.toArray()} visible={false}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial />
      </mesh>
    </Canvas>
  )
}
