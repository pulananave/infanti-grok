import { useEffect, useState } from 'react'
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'
import { QUALITY_PRESET } from './stageLook'

function readQueryFlag(): boolean {
  if (typeof window === 'undefined') return false
  const value = new URLSearchParams(window.location.search).get('texPilot')
  return value === '1' || value === 'true' || value === ''
}

export const TEX_PILOT_QUERY = readQueryFlag()

type Listener = () => void

let enabled = TEX_PILOT_QUERY
const listeners = new Set<Listener>()
let loader: TextureLoader | null = null
const cache = new Map<string, Texture>()

export function isTexPilot() {
  return enabled
}

export function setTexPilot(next: boolean) {
  if (enabled === next) return
  enabled = next
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('texPilot', '1')
    else url.searchParams.delete('texPilot')
    window.history.replaceState({}, '', url)
  }
  listeners.forEach((fn) => fn())
}

export function subscribeTexPilot(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useTexPilot() {
  const [on, setOn] = useState(isTexPilot)
  useEffect(() => subscribeTexPilot(() => setOn(isTexPilot())), [])
  return on
}

export type PilotMaps = {
  map: Texture
  normalMap: Texture
}

function getLoader() {
  if (!loader) loader = new TextureLoader()
  return loader
}

function loadMap(url: string, kind: 'color' | 'normal', flipY: boolean): Texture {
  const key = `${url}:${kind}:${flipY ? 1 : 0}`
  const hit = cache.get(key)
  if (hit) return hit
  const tex = getLoader().load(url)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(1, 1)
  tex.anisotropy = QUALITY_PRESET === 'mobile' ? 2 : 4
  tex.minFilter = LinearMipmapLinearFilter
  tex.magFilter = LinearFilter
  tex.generateMipmaps = true
  tex.flipY = flipY
  tex.colorSpace = kind === 'color' ? SRGBColorSpace : NoColorSpace
  tex.needsUpdate = true
  cache.set(key, tex)
  return tex
}

export function getBoogarMaps(): PilotMaps {
  return {
    map: loadMap('/textures/boogar/albedo.png', 'color', false),
    normalMap: loadMap('/textures/boogar/normal.png', 'normal', false),
  }
}

export function getFloorMaps(): PilotMaps {
  return {
    map: loadMap('/textures/floor/silicone_albedo.png', 'color', true),
    normalMap: loadMap('/textures/floor/silicone_normal.png', 'normal', true),
  }
}

export function preloadTexPilot() {
  if (!isTexPilot()) return
  getBoogarMaps()
  getFloorMaps()
}
