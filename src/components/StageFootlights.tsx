import { useLayoutEffect, useMemo, useRef } from 'react'
import { Object3D, Quaternion, Vector3, type SpotLight } from 'three'
import { STAGE_LOOK } from '../theme/stageLook'
import { activeFootlightRigs, type FootlightRig } from '../theme/footlights'
import { TOY, ToyMaterial } from '../theme/toy'

function aimQuat(position: [number, number, number], target: [number, number, number]) {
  const dir = new Vector3(target[0] - position[0], target[1] - position[1], target[2] - position[2]).normalize()
  return new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir)
}

function FootlightFixture({ rig }: { rig: FootlightRig }) {
  const quat = useMemo(() => aimQuat(rig.position, rig.target), [rig.position, rig.target])

  return (
    <group position={rig.position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.42, 20]} />
        <ToyMaterial color="#ffe8a8" glow emissiveIntensity={STAGE_LOOK.glowLamp * 0.55} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.06, 12]} />
        <ToyMaterial color={TOY.peach} silicone />
      </mesh>
      <group quaternion={quat}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.09, 0.24, 14]} />
          <ToyMaterial color={TOY.spotlight} silicone />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.09, 14, 12]} />
          <ToyMaterial color={TOY.lemon} glow emissiveIntensity={STAGE_LOOK.glowLamp} />
        </mesh>
      </group>
    </group>
  )
}

function AimedSpot({ rig }: { rig: FootlightRig }) {
  const light = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)

  useLayoutEffect(() => {
    if (!light.current || !target.current) return
    light.current.target = target.current
    target.current.position.set(...rig.target)
    target.current.updateMatrixWorld()
  }, [rig.target])

  return (
    <>
      <spotLight
        ref={light}
        position={rig.position}
        intensity={STAGE_LOOK.footlightIntensity}
        color={STAGE_LOOK.footlightColor}
        angle={STAGE_LOOK.footlightAngle}
        penumbra={STAGE_LOOK.footlightPenumbra}
        distance={STAGE_LOOK.footlightDistance}
        decay={2}
        castShadow={false}
      />
      <object3D ref={target} position={rig.target} />
    </>
  )
}

/** Two front toy cones plus non-shadow spots aimed at face height. */
export function StageFootlights() {
  const lit = activeFootlightRigs()

  return (
    <group>
      {lit.map((rig) => (
        <FootlightFixture key={`${rig.position[0]}-${rig.position[2]}`} rig={rig} />
      ))}
      {lit.map((rig) => (
        <AimedSpot key={`spot-${rig.position[0]}-${rig.position[2]}`} rig={rig} />
      ))}
    </group>
  )
}
