import * as THREE from 'three'
import { atlasImageUrl, parseTpsheet, type ParsedSpritesheet, type TpsheetJson } from './tpsheet'

export interface LoadedPage {
  image: string
  size: { w: number; h: number }
  texture: THREE.Texture
}

export interface LoadedSheet extends ParsedSpritesheet {
  url: string
  pages: LoadedPage[]
}

const loader = new THREE.TextureLoader()
const cache = new Map<string, Promise<LoadedSheet>>()

function configureAtlas(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
}

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        configureAtlas(texture)
        resolve(texture)
      },
      undefined,
      () => reject(new Error(`Failed to load atlas ${url}`)),
    )
  })
}

async function loadSheet(tpsheetUrl: string): Promise<LoadedSheet> {
  const response = await fetch(tpsheetUrl)
  if (!response.ok) throw new Error(`Failed to load ${tpsheetUrl}`)
  const parsed = parseTpsheet((await response.json()) as TpsheetJson)
  const pages = await Promise.all(
    parsed.pages.map(async (page) => ({
      ...page,
      texture: await loadTexture(atlasImageUrl(tpsheetUrl, page.image)),
    })),
  )
  return { ...parsed, url: tpsheetUrl, pages }
}

export function getSpritesheet(tpsheetUrl: string): Promise<LoadedSheet> {
  const cached = cache.get(tpsheetUrl)
  if (cached) return cached
  const pending = loadSheet(tpsheetUrl).catch((error) => {
    cache.delete(tpsheetUrl)
    throw error
  })
  cache.set(tpsheetUrl, pending)
  return pending
}

export function applyFrameToTexture(
  texture: THREE.Texture,
  region: { x: number; y: number; w: number; h: number },
  atlas: { w: number; h: number },
) {
  texture.repeat.set(region.w / atlas.w, region.h / atlas.h)
  texture.offset.set(region.x / atlas.w, 1 - (region.y + region.h) / atlas.h)
  texture.needsUpdate = true
}
