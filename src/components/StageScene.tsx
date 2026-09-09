import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA } from '@react-three/postprocessing'
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
import { StageLights } from './StageLighting'
import type { SongId, SongTheme, StageInstance } from '../types'

function SceneBridge() {
  const { camera, gl, raycaster } = useThree()
  useEffect(() => {
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    raycaster.layers.enableAll()
    camera.layers.enable(0)
    camera.layers.enable(2)
    registerScene(camera, gl.domElement)
    return () => unregisterScene()
  }, [camera, gl, raycaster])
  return null
}

function Lights({ theme }: { theme: SongTheme }) {
  return <StageLights theme={theme} />
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
        beginMoveDrag(instance.id, instance.instrument, instance.type, event.clientX, event.clientY)
      }}
    >
      <mesh position={[0, 0.7, 0]} visible={false}>
        <sphereGeometry args={[1.15, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Humanoid
        characterId={instance.characterId}
        instrument={instance.type}
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
      onUpdate={(mesh) => mesh.layers.set(1)}
      onPointerDown={(event) => {
        if (useGame.getState().drag) return
        const nearest = pickNearestCharacter(event.point)
        if (!nearest) return
        event.stopPropagation()
        event.nativeEvent.preventDefault()
        beginMoveDrag(nearest.id, nearest.instrument, nearest.type, event.clientX, event.clientY)
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
      <Humanoid characterId={drag.characterId} instrument={drag.iconType} ghost bpm={bpm} />
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 5.4, 8.4)
    camera.lookAt(0, 0.35, -0.4)
    camera.layers.enable(0)
    camera.layers.enable(2)
  }, [camera])
  return null
}

function StagePost() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {STAGE_LOOK.ssao ? (
        <N8AO
          aoRadius={STAGE_LOOK.ssaoRadius}
          intensity={STAGE_LOOK.ssaoIntensity}
          distanceFalloff={1.15}
          quality="medium"
          halfRes
          color="#3a2048"
        />
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
      dpr={STAGE_LOOK.dpr}
      camera={{ position: [0, 5.4, 8.4], fov: 42, near: 0.1, far: 48 }}
      onPointerMissed={() => undefined}
      onCreated={({ gl, raycaster, camera }) => {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        raycaster.layers.enableAll()
        camera.layers.enable(0)
        camera.layers.enable(2)
      }}
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
        position={[0, 0.02, 0]}
        opacity={STAGE_LOOK.contactOpacity}
        scale={14}
        blur={STAGE_LOOK.contactBlur}
        far={STAGE_LOOK.contactFar}
        resolution={STAGE_LOOK.contactResolution}
        color="#3a2048"
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
