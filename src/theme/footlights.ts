import { STAGE_BOUNDS } from '../state/sceneBridge'
import { STAGE_LOOK } from './stageLook'

/** Face-height aim for toy humanoids (about 0.6–1.1 after character scale). */
export const FOOTLIGHT_FACE_Y = 0.88

export type FootlightRig = {
  position: [number, number, number]
  target: [number, number, number]
}

/**
 * Perimeter footlights covering the playable floor.
 * Front three run on every preset; extra side/back rigs are desktop-only.
 */
export const FOOTLIGHT_RIGS: FootlightRig[] = [
  {
    position: [-3.35, 0.07, STAGE_BOUNDS.zFront - 0.28],
    target: [-1.45, FOOTLIGHT_FACE_Y, 0.35],
  },
  {
    position: [0, 0.07, STAGE_BOUNDS.zFront - 0.18],
    target: [0, FOOTLIGHT_FACE_Y + 0.06, 0.15],
  },
  {
    position: [3.35, 0.07, STAGE_BOUNDS.zFront - 0.28],
    target: [1.45, FOOTLIGHT_FACE_Y, 0.35],
  },
  {
    position: [-STAGE_BOUNDS.x + 0.38, 0.07, 0.55],
    target: [-2.05, FOOTLIGHT_FACE_Y, 0.15],
  },
  {
    position: [STAGE_BOUNDS.x - 0.38, 0.07, 0.55],
    target: [2.05, FOOTLIGHT_FACE_Y, 0.15],
  },
  {
    position: [-STAGE_BOUNDS.x + 0.42, 0.07, -2.15],
    target: [-2.1, FOOTLIGHT_FACE_Y, -1.45],
  },
  {
    position: [STAGE_BOUNDS.x - 0.42, 0.07, -2.15],
    target: [2.1, FOOTLIGHT_FACE_Y, -1.45],
  },
]

export function activeFootlightRigs(): FootlightRig[] {
  return FOOTLIGHT_RIGS.slice(0, STAGE_LOOK.footlightCount)
}
