/**
 * Mobile-landscape look knobs for the 3D toy stage.
 * Tune here rather than scattering magic numbers across lights/bloom/materials.
 */
export const STAGE_LOOK = {
  /** Weak warm ambient so the key light can sculpt volume. */
  ambient: 0.26,
  ambientColor: '#ffe6cc',
  /** Sky/ground bounce; keep below the key so it does not flatten the grid. */
  hemi: 0.36,
  hemiGround: '#8fb89a',
  /** Single shadow-casting sun. */
  key: 1.28,
  keyColor: '#fff4e4',
  /** Soft colored fills — not extra point lights. */
  fillCool: 0.2,
  fillCoolColor: '#b7d8ff',
  fillWarm: 0.15,
  fillWarmColor: '#ffd2c4',
  /** PCF soft shadow map edge length (512 stays cheap on phones). */
  shadowMapSize: 512,
  /** One-shot PMREM resolution for clearcoat/sheen. */
  envResolution: 64,
  envIntensity: 0.34,
  /** ACES exposure after the dimmer ambient. */
  exposure: 1.04,
  bloomThreshold: 0.9,
  bloomSmoothing: 0.34,
  bloomIntensity: 0.26,
  dofBokeh: 0.85,
  dofHeight: 360,
  contactOpacity: 0.32,
  contactBlur: 2.4,
  /** Default silicone/clay response (not mirrors). */
  roughness: 0.74,
  roughnessGlow: 0.5,
  clearcoat: 0.22,
  clearcoatGlow: 0.1,
  sheen: 0.18,
  envMapIntensity: 0.38,
  /** Emissive accents — bloom picks these up without blowing pastels. */
  glowDefault: 0.42,
  glowOrb: 0.5,
  glowLamp: 0.58,
  glowIcon: 0.38,
  glowStar: 0.4,
  glowFlower: 0.28,
} as const
