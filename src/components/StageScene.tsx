import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getSong } from '../config/loadConfig'
import { useGame } from '../state/gameStore'
import {
  clampToFloor,
  depthScale,
  LISTENER_POSITION,
  projectToFloor,
  registerScene,
  STAGE_BOUNDS,
  unregisterScene,
} from '../state/sceneBridge'
import { SpritePerformer } from './SpritePerformer'
import type { SongId, StageInstance } from '../types'

function SceneBridge() {
  const { camera, gl } = useThree()
  useEffect(() => {
    registerScene(camera, gl.domElement)
    return () => unregisterScene()
  }, [camera, gl])
  return null
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
  const beginMoveDrag = useGame((s) => s.beginMoveDrag)

  return (
    <group
      position={instance.position}
      scale={depthScale(instance.position[2])}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.nativeEvent.preventDefault()
        beginMoveDrag(instance.id, instance.instrument, event.clientX, event.clientY)
      }}
    >
      <SpritePerformer
        characterId={instance.characterId}
        instrument={instance.instrument}
        genre={instance.genre}
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
    const scale = depthScale(next.z)
    marker.current.scale.setScalar(scale)
  })

  if (!drag || drag.type !== 'spawn') return null

  return (
    <group ref={marker}>
      <SpritePerformer
        characterId={drag.characterId}
        instrument={drag.instrument}
        genre={drag.genre}
        ghost
        playing
        bpm={bpm}
      />
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 5.15, 8.1)
    camera.lookAt(0, 0.2, -0.55)
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
      dpr={[1, 1.5]}
      camera={{ position: [0, 5.15, 8.1], fov: 40, near: 0.1, far: 40 }}
      onPointerMissed={() => undefined}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none', background: 'transparent' }}
    >
      <SceneBridge />
      <CameraRig />
      {instances.map((instance) => (
        <StageCharacter key={instance.id} instance={instance} bpm={song.bpm} />
      ))}
      <SpawnPreview bpm={song.bpm} />
      <GrabPlane />
      <mesh position={LISTENER_POSITION.toArray()} visible={false}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial />
      </mesh>
    </Canvas>
  )
}
