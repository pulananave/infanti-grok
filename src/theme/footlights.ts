import { STAGE_BOUNDS } from '../state/sceneBridge'
import { STAGE_LOOK } from './stageLook'

/** Aim just above typical jelly-character faces so the beam reads as uplight. */
export const FOOTLIGHT_FACE_Y = 1.18

export type FootlightRig = {
  position: [number, number, number]
  target: [number, number, number]
}

/**
 * Two front-edge footlights (left + right). Each target stays close to its
 * fixture so the cone tilts up into nearby faces instead of raking the floor.
 */
export const FOOTLIGHT_RIGS: FootlightRig[] = [
  {
    position: [-3.35, 0.07, STAGE_BOUNDS.zFront - 0.28],
    target: [-2.15, FOOTLIGHT_FACE_Y, STAGE_BOUNDS.zFront - 1.55],
  },
  {
    position: [3.35, 0.07, STAGE_BOUNDS.zFront - 0.28],
    target: [2.15, FOOTLIGHT_FACE_Y, STAGE_BOUNDS.zFront - 1.55],
  },
]

export function activeFootlightRigs(): FootlightRig[] {
  return FOOTLIGHT_RIGS.slice(0, STAGE_LOOK.footlightCount)
}
