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

export function registerScene(nextCamera: THREE.Camera, nextCanvas: HTMLCanvasElement) {
  camera = nextCamera
  canvas = nextCanvas
}

export function unregisterScene() {
  camera = null
  canvas = null
}

export function projectToFloor(clientX: number, clientY: number): THREE.Vector3 | null {
  if (!camera || !canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  ndc.set(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  )
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

export function volumeForPosition(position: THREE.Vector3 | [number, number, number]): number {
  const x = Array.isArray(position) ? position[0] : position.x
  const y = Array.isArray(position) ? position[1] : position.y
  const z = Array.isArray(position) ? position[2] : position.z
  const distance = LISTENER_POSITION.distanceTo(new THREE.Vector3(x, y, z))
  return THREE.MathUtils.clamp(1 / (1 + distance * 0.38), 0.08, 1)
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
