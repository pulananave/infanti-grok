import * as THREE from 'three'

const FLOOR_X = 5.6
const FLOOR_Z_BACK = -4.6
const FLOOR_Z_FRONT = 2.9

export const LISTENER_POSITION = new THREE.Vector3(0, 0.15, 2.7)

let camera: THREE.Camera | null = null
let canvas: HTMLCanvasElement | null = null

const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hit = new THREE.Vector3()
const projectScratch = new THREE.Vector3()

type Pickable = { id: string; object: THREE.Object3D }
const pickables: Pickable[] = []

export function registerScene(nextCamera: THREE.Camera, nextCanvas: HTMLCanvasElement) {
  camera = nextCamera
  canvas = nextCanvas
}

export function unregisterScene() {
  camera = null
  canvas = null
  pickables.length = 0
}

export function registerPickable(id: string, object: THREE.Object3D) {
  const existing = pickables.find((item) => item.id === id)
  if (existing) {
    existing.object = object
    return
  }
  pickables.push({ id, object })
}

export function unregisterPickable(id: string) {
  const index = pickables.findIndex((item) => item.id === id)
  if (index >= 0) pickables.splice(index, 1)
}

function setPointerNdc(clientX: number, clientY: number): boolean {
  if (!camera || !canvas) return false
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  ndc.set(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )
  return true
}

function instanceIdFromObject(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object
  while (current) {
    const id = current.userData?.instanceId
    if (typeof id === 'string' && id.length > 0) return id
    const registered = pickables.find((item) => item.object === current)
    if (registered) return registered.id
    current = current.parent
  }
  return null
}

/** Raycast the pointer against registered character meshes (visible skin), not a loose floor radius. */
export function pickInstanceAt(clientX: number, clientY: number): string | null {
  if (!camera || !setPointerNdc(clientX, clientY) || pickables.length === 0) return null
  raycaster.setFromCamera(ndc, camera)
  const hits = raycaster.intersectObjects(
    pickables.map((item) => item.object),
    true,
  )
  for (const entry of hits) {
    if (!entry.object.visible) continue
    const id = instanceIdFromObject(entry.object)
    if (id) return id
  }
  return null
}

export function instanceScreenPoint(
  position: [number, number, number],
  height = 0.55,
): { x: number; y: number } | null {
  if (!camera || !canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  camera.updateMatrixWorld()
  projectScratch.set(position[0], height, position[2]).project(camera)
  return {
    x: rect.left + (projectScratch.x * 0.5 + 0.5) * rect.width,
    y: rect.top + (-projectScratch.y * 0.5 + 0.5) * rect.height,
  }
}

export function projectToFloor(clientX: number, clientY: number): THREE.Vector3 | null {
  if (!camera || !setPointerNdc(clientX, clientY)) return null
  raycaster.setFromCamera(ndc, camera)
  if (!raycaster.ray.intersectPlane(floorPlane, hit)) return null
  return hit.clone()
}

export function isOnStageFloor(point: THREE.Vector3): boolean {
  return (
    point.x >= -FLOOR_X &&
    point.x <= FLOOR_X &&
    point.z >= FLOOR_Z_BACK &&
    point.z <= FLOOR_Z_FRONT
  )
}

export function clampToFloor(point: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    THREE.MathUtils.clamp(point.x, -FLOOR_X, FLOOR_X),
    0,
    THREE.MathUtils.clamp(point.z, FLOOR_Z_BACK, FLOOR_Z_FRONT),
  )
}

export const NEAR_GAIN = 1
export const FAR_GAIN = 0.2

function dbToGain(db: number): number {
  return 10 ** (db / 20)
}

export interface StemVolumeRange {
  minVolumeDb?: number
  maxVolumeDb?: number
}

/**
 * Distance gain along the stage depth.
 * Default: 1.0 at the listener (front), 0.2 at the back.
 * When a stem has Godot min/max dB, those become the back/front gains.
 */
export function volumeForPosition(
  position: THREE.Vector3 | [number, number, number],
  range?: StemVolumeRange,
): number {
  const z = Array.isArray(position) ? position[2] : position.z
  const t = THREE.MathUtils.clamp(
    THREE.MathUtils.inverseLerp(LISTENER_POSITION.z, FLOOR_Z_BACK, z),
    0,
    1,
  )
  if (range?.minVolumeDb != null || range?.maxVolumeDb != null) {
    const maxDb = range.maxVolumeDb ?? 0
    const minDb = range.minVolumeDb ?? maxDb - 14
    return dbToGain(THREE.MathUtils.lerp(maxDb, minDb, t))
  }
  return THREE.MathUtils.lerp(NEAR_GAIN, FAR_GAIN, t)
}

/**
 * Horizontal stereo pan from stage X.
 * Stage edges map to roughly ±1; a mild cubic keeps the center more centered
 * so dragging near the middle does not slam the stem left/right.
 */
export function panForPosition(position: THREE.Vector3 | [number, number, number]): number {
  const x = Array.isArray(position) ? position[0] : position.x
  const linear = THREE.MathUtils.clamp(x / FLOOR_X, -1, 1)
  return linear * (0.72 + 0.28 * linear * linear)
}

export function isOverBlockingUi(clientX: number, clientY: number): boolean {
  const el = document.elementFromPoint(clientX, clientY)
  if (!el) return false
  return Boolean(
    el.closest('[data-tray]') ||
      el.closest('[data-balloon]') ||
      el.closest('[data-ui]') ||
      el.closest('[data-prize]'),
  )
}

export function isOverTray(clientX: number, clientY: number): boolean {
  const el = document.elementFromPoint(clientX, clientY)
  return Boolean(el?.closest('[data-tray]'))
}

export function isInRemoveZone(clientX: number, clientY: number): boolean {
  if (isOverTray(clientX, clientY)) return true
  const tray = document.querySelector<HTMLElement>('[data-tray]')
  if (!tray) return clientY > window.innerHeight - 96
  const rect = tray.getBoundingClientRect()
  return clientY >= rect.top - 16 && clientX >= rect.left && clientX <= rect.right
}

export const STAGE_BOUNDS = {
  x: FLOOR_X,
  zBack: FLOOR_Z_BACK,
  zFront: FLOOR_Z_FRONT,
}

export function nearestInstanceId(
  point: { x: number; z: number },
  instances: { id: string; position: [number, number, number] }[],
  maxDistance = 1.8,
): string | null {
  let bestId: string | null = null
  let best = maxDistance
  for (const instance of instances) {
    const distance = Math.hypot(instance.position[0] - point.x, instance.position[2] - point.z)
    if (distance < best) {
      best = distance
      bestId = instance.id
    }
  }
  return bestId
}
