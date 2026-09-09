import { useLayoutEffect, useRef } from 'react'
import { Environment, Lightformer, SoftShadows } from '@react-three/drei'
import { BackSide, Object3D, type DirectionalLight } from 'three'
import { STAGE_LOOK } from '../theme/stageLook'
import { liftPastel, mixHex, TOY } from '../theme/toy'
import type { SongTheme } from '../types'

function ApronUplight() {
  const light = useRef<DirectionalLight>(null)
  const target = useRef<Object3D>(null)

  useLayoutEffect(() => {
    if (!light.current || !target.current) return
    light.current.target = target.current
    target.current.position.set(0, 1.15, -0.35)
    target.current.updateMatrixWorld()
  }, [])

  return (
    <>
      <directionalLight
        ref={light}
        position={[0, 0.16, 3.55]}
        intensity={STAGE_LOOK.apronIntensity}
        color={STAGE_LOOK.apronColor}
        castShadow={false}
      />
      <object3D ref={target} position={[0, 1.15, -0.35]} />
    </>
  )
}

/**
 * High-key pastel IBL. A bright sky shell plus small lemon/cyan/pink formers
 * so clearcoat picks up candy highlights instead of a warm brown studio bake.
 */
export function SoftToyIbl() {
  return (
    <Environment
      frames={1}
      resolution={STAGE_LOOK.envResolution}
      environmentIntensity={STAGE_LOOK.envIntensity}
      background={false}
    >
      <mesh scale={18}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshBasicMaterial color="#e6f6ff" side={BackSide} />
      </mesh>
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#fff8e8"
        scale={[3.6, 2.2, 1]}
        position={[6.4, 8.2, 4.6]}
        target={[0, 0.4, 0]}
      />
      <Lightformer
        form="rect"
        intensity={1.05}
        color="#c4e8ff"
        scale={[2.8, 2, 1]}
        position={[-6.2, 3.4, 2.2]}
        target={[0, 0.3, 0]}
      />
      <Lightformer
        form="ring"
        intensity={0.55}
        color="#ffd4e8"
        scale={5}
        position={[-3.4, 2.8, -5.4]}
        target={[0, 0.6, 0]}
      />
      <Lightformer
        form="rect"
        intensity={0.34}
        color="#c8f4e0"
        scale={[10, 10, 1]}
        position={[0, -4.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </Environment>
  )
}

export function StageLights({ theme }: { theme: Pick<SongTheme, 'sky' | 'horizon' | 'fog'> }) {
  const sky = liftPastel(theme.sky, TOY.sky, 0.48)
  const fog = mixHex(liftPastel(theme.fog, TOY.sky, 0.5), TOY.cream, 0.28)
  const hemiSky = mixHex(theme.horizon, STAGE_LOOK.hemiSky, 0.55)

  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fog, 26, 54]} />
      <ambientLight intensity={STAGE_LOOK.ambient} color={STAGE_LOOK.ambientColor} />
      <hemisphereLight args={[hemiSky, STAGE_LOOK.hemiGround, STAGE_LOOK.hemi]} />
      <directionalLight
        position={STAGE_LOOK.keyPosition}
        intensity={STAGE_LOOK.key}
        color={STAGE_LOOK.keyColor}
        castShadow
        shadow-mapSize={[STAGE_LOOK.shadowMapSize, STAGE_LOOK.shadowMapSize]}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-4.8, 3.4, 2.8]} intensity={STAGE_LOOK.fillCool} color={STAGE_LOOK.fillCoolColor} />
      <directionalLight position={[1.6, 3.8, -5.6]} intensity={STAGE_LOOK.fillWarm} color={STAGE_LOOK.fillWarmColor} />
      <directionalLight position={STAGE_LOOK.rimPosition} intensity={STAGE_LOOK.rim} color={STAGE_LOOK.rimColor} />
      <ApronUplight />
      {STAGE_LOOK.softShadows ? (
        <SoftShadows
          size={STAGE_LOOK.softShadowSize}
          samples={STAGE_LOOK.softShadowSamples}
          focus={STAGE_LOOK.softShadowFocus}
        />
      ) : null}
      <SoftToyIbl />
    </>
  )
}
