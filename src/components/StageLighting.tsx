import { Environment, Lightformer, SoftShadows } from '@react-three/drei'
import { BackSide } from 'three'
import { STAGE_LOOK } from '../theme/stageLook'
import { kawaiiTint, TOY } from '../theme/toy'
import type { SongTheme } from '../types'

/**
 * Cool high-key IBL: navy shell (not brown) plus sky / lemon / mint formers.
 * Intensity stays low so clearcoat picks up highlights without washing pastels.
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
        <meshBasicMaterial color="#161c2c" side={BackSide} />
      </mesh>
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#fff6e0"
        scale={[3.6, 2.2, 1]}
        position={[6.4, 8.2, 4.6]}
        target={[0, 0.4, 0]}
      />
      <Lightformer
        form="rect"
        intensity={0.9}
        color="#b8e4ff"
        scale={[2.8, 2, 1]}
        position={[-6.2, 3.4, 2.2]}
        target={[0, 0.3, 0]}
      />
      <Lightformer
        form="ring"
        intensity={0.32}
        color="#ffe8b0"
        scale={5}
        position={[-3.4, 2.8, -5.4]}
        target={[0, 0.6, 0]}
      />
      <Lightformer
        form="rect"
        intensity={0.18}
        color="#9aecc8"
        scale={[10, 10, 1]}
        position={[0, -4.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </Environment>
  )
}

export function StageLights({ theme }: { theme: Pick<SongTheme, 'sky' | 'horizon' | 'fog'> }) {
  const sky = kawaiiTint(theme.sky, TOY.sky, 0.62)
  const fog = kawaiiTint(theme.fog, TOY.sky, 0.55)
  const horizon = kawaiiTint(theme.horizon, TOY.cream, 0.42)
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fog, 22, 44]} />
      <ambientLight intensity={STAGE_LOOK.ambient} color={STAGE_LOOK.ambientColor} />
      <hemisphereLight args={[horizon, STAGE_LOOK.hemiGround, STAGE_LOOK.hemi]} />
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
