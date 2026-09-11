import { useEffect, useLayoutEffect, useRef } from 'react'
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
  registerPickable,
  registerScene,
  unregisterPickable,
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

function StageCharacter({
  instance,
}: {
  instance: StageInstance
}) {
  const group = useRef<THREE.Group>(null)
  const beginMoveDrag = useGame((s) => s.beginMoveDrag)

  useLayoutEffect(() => {
    const object = group.current
    if (!object) return
    object.userData.instanceId = instance.id
    registerPickable(instance.id, object)
    return () => unregisterPickable(instance.id)
  }, [instance.id])

  return (
    <group
      ref={group}
      position={instance.position}
      userData={{ instanceId: instance.id }}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.nativeEvent.preventDefault()
        beginMoveDrag(instance.id, instance.instrument, instance.type, event.clientX, event.clientY)
      }}
    >
      <Humanoid
        characterId={instance.characterId}
        instrument={instance.type}
        muted={instance.muted}
        playing
      />
    </group>
  )
}

function SpawnPreview() {
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
      <Humanoid characterId={drag.characterId} instrument={drag.iconType} ghost />
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
          color={STAGE_LOOK.ssaoColor}
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
  const dragging = useGame((s) => s.drag != null)
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
        <StageCharacter key={instance.id} instance={instance} />
      ))}
      <SpawnPreview />
      {!dragging && (
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={STAGE_LOOK.contactOpacity}
          scale={14}
          blur={STAGE_LOOK.contactBlur}
          far={STAGE_LOOK.contactFar}
          resolution={STAGE_LOOK.contactResolution}
          color={STAGE_LOOK.contactColor}
        />
      )}
      <mesh position={LISTENER_POSITION.toArray()} visible={false}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial />
      </mesh>
      <StagePost />
    </Canvas>
  )
}
