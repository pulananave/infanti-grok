/**
 * Mobile-landscape look knobs for the 3D toy stage.
 * Tune here rather than scattering magic numbers across lights/bloom/materials.
 */
export const STAGE_LOOK = {
  /** Weak warm ambient so the key light can sculpt volume. */
  ambient: 0.14,
  ambientColor: '#ffe6cc',
  /** Sky/ground bounce; keep below the key so it does not flatten the grid. */
  hemi: 0.24,
  hemiGround: '#7fa88c',
  /** Single shadow-casting sun, slightly raking so forms read. */
  key: 1.55,
  keyColor: '#fff4e4',
  keyPosition: [6.2, 7.2, 5.0] as [number, number, number],
  /** Soft colored fills — not extra point lights. */
  fillCool: 0.12,
  fillCoolColor: '#b7d8ff',
  fillWarm: 0.08,
  fillWarmColor: '#ffd2c4',
  /** PCF soft shadow map edge length (512 stays cheap on phones). */
  shadowMapSize: 512,
  /** ACES exposure after the dimmer ambient. */
  exposure: 1.06,
  bloomThreshold: 0.92,
  bloomSmoothing: 0.34,
  bloomIntensity: 0.22,
  contactOpacity: 0.45,
  contactBlur: 2.2,
  /** Default silicone/clay response (not mirrors). */
  roughness: 0.7,
  roughnessGlow: 0.5,
  clearcoat: 0.26,
  clearcoatGlow: 0.1,
  sheen: 0.2,
  envMapIntensity: 0.28,
  /** Emissive accents — bloom picks these up without blowing pastels. */
  glowDefault: 0.36,
  glowOrb: 0.42,
  glowLamp: 0.5,
  glowIcon: 0.32,
  glowStar: 0.3,
  glowFlower: 0.24,
} as const
