import { STAGE_BOUNDS } from '../state/sceneBridge'
import { STAGE_LOOK } from './stageLook'

/** Aim just above typical jelly-character faces so the beam reads as uplight. */
export const FOOTLIGHT_FACE_Y = 1.18

export type FootlightRig = {
  position: [number, number, number]
  target: [number, number, number]
}

/**
 * Perimeter footlights. Each target stays close to its fixture so the cone
 * tilts up into nearby faces instead of raking the whole floor.
 */
export const FOOTLIGHT_RIGS: FootlightRig[] = [
  {
    position: [-3.35, 0.07, STAGE_BOUNDS.zFront - 0.28],
    target: [-2.15, FOOTLIGHT_FACE_Y, STAGE_BOUNDS.zFront - 1.55],
  },
  {
    position: [0, 0.07, STAGE_BOUNDS.zFront - 0.18],
    target: [0, FOOTLIGHT_FACE_Y + 0.08, STAGE_BOUNDS.zFront - 1.45],
  },
  {
    position: [3.35, 0.07, STAGE_BOUNDS.zFront - 0.28],
    target: [2.15, FOOTLIGHT_FACE_Y, STAGE_BOUNDS.zFront - 1.55],
  },
  {
    position: [-STAGE_BOUNDS.x + 0.38, 0.07, 0.55],
    target: [-STAGE_BOUNDS.x + 2.15, FOOTLIGHT_FACE_Y, 0.4],
  },
  {
    position: [STAGE_BOUNDS.x - 0.38, 0.07, 0.55],
    target: [STAGE_BOUNDS.x - 2.15, FOOTLIGHT_FACE_Y, 0.4],
  },
  {
    position: [-STAGE_BOUNDS.x + 0.42, 0.07, -2.15],
    target: [-STAGE_BOUNDS.x + 2.2, FOOTLIGHT_FACE_Y, -2.0],
  },
  {
    position: [STAGE_BOUNDS.x - 0.42, 0.07, -2.15],
    target: [STAGE_BOUNDS.x - 2.2, FOOTLIGHT_FACE_Y, -2.0],
  },
]

export function activeFootlightRigs(): FootlightRig[] {
  return FOOTLIGHT_RIGS.slice(0, STAGE_LOOK.footlightCount)
}
