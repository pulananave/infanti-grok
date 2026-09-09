import { CanvasTexture, LinearFilter, NoColorSpace, RepeatWrapping, Vector2 } from 'three'

function fade(t: number) {
  return t * t * (3 - 2 * t)
}

function hash2(ix: number, iy: number) {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const u = fade(fx)
  const v = fade(fy)
  const a = hash2(x0, y0)
  const b = hash2(x0 + 1, y0)
  const c = hash2(x0, y0 + 1)
  const d = hash2(x0 + 1, y0 + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number) {
  let sum = 0
  let amp = 0.55
  let freq = 1
  for (let i = 0; i < 4; i += 1) {
    sum += valueNoise(x * freq, y * freq) * amp
    freq *= 2.05
    amp *= 0.5
  }
  return sum
}

function makeNormalMap(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const img = ctx.createImageData(size, size)
  const height = new Float32Array(size * size)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      height[y * size + x] = fbm(x / 14, y / 14)
    }
  }
  const strength = 1.8
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const xl = height[y * size + ((x + size - 1) % size)]
      const xr = height[y * size + ((x + 1) % size)]
      const yd = height[((y + size - 1) % size) * size + x]
      const yu = height[((y + 1) % size) * size + x]
      let nx = (xl - xr) * strength
      let ny = (yd - yu) * strength
      let nz = 1
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len
      ny /= len
      nz /= len
      const i = (y * size + x) * 4
      img.data[i] = Math.round((nx * 0.5 + 0.5) * 255)
      img.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      img.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(2.4, 2.4)
  tex.anisotropy = 4
  tex.minFilter = LinearFilter
  tex.magFilter = LinearFilter
  tex.colorSpace = NoColorSpace
  tex.needsUpdate = true
  return tex
}

let cached: CanvasTexture | null | undefined

export function getToyNormalMap() {
  if (typeof document === 'undefined') return null
  if (cached !== undefined) return cached
  cached = makeNormalMap(128)
  return cached
}

const SCALE_CACHE = new Map<number, Vector2>()

export function normalScale(strength: number) {
  const key = Math.round(strength * 1000)
  let vec = SCALE_CACHE.get(key)
  if (!vec) {
    vec = new Vector2(strength, strength)
    SCALE_CACHE.set(key, vec)
  }
  return vec
}
