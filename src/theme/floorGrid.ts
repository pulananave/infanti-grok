/**
 * Stage floor tiles as a musical grid.
 *
 * Layout in world space (see StageEnvironment tilePos):
 *   ix = 0 is stage left, ix = COLS-1 is stage right
 *   iz = 0 is the backdrop (rear), iz = ROWS-1 is the apron (front / camera)
 *
 * Beats walk one column at a time, front → back, then the next column to the right.
 * 4/4 transport: 4 beats per bar. ROWS is 8, so one column = 2 bars (not 1).
 * The full 11×8 grid is 88 beats = 22 bars, then wraps to the first column.
 * Song `bars` lengths (16 / 20 / 54) do not match 22, so we do not force a
 * song-form cycle onto the tiles — only the beat clock from the audio transport.
 */

export const FLOOR_COLS = 11
export const FLOOR_ROWS = 8
export const BEATS_PER_BAR = 4
export const BARS_PER_COLUMN = FLOOR_ROWS / BEATS_PER_BAR
export const GRID_BEATS = FLOOR_COLS * FLOOR_ROWS

export function tileIndex(ix: number, iz: number): number {
  return ix * FLOOR_ROWS + iz
}

/** Map a transport beat onto a floor tile (column left→right, row front→back). */
export function beatToTile(beatIndex: number): { ix: number; iz: number } {
  const cycle = GRID_BEATS
  const i = ((beatIndex % cycle) + cycle) % cycle
  const ix = Math.floor(i / FLOOR_ROWS)
  const rowFromFront = i % FLOOR_ROWS
  const iz = FLOOR_ROWS - 1 - rowFromFront
  return { ix, iz }
}
