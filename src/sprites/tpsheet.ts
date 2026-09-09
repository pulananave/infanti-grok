export interface TpsheetRect {
  x: number
  y: number
  w: number
  h: number
}

export interface TpsheetSpriteJson {
  filename: string
  region: TpsheetRect
  margin: TpsheetRect
}

export interface TpsheetTextureJson {
  image: string
  size: { w: number; h: number }
  sprites: TpsheetSpriteJson[]
}

export interface TpsheetJson {
  textures: TpsheetTextureJson[]
}

export interface SpriteFrame {
  filename: string
  index: number
  page: number
  region: TpsheetRect
  margin: TpsheetRect
  source: { w: number; h: number }
}

export interface ParsedSpritesheet {
  frames: SpriteFrame[]
  pages: Array<{ image: string; size: { w: number; h: number } }>
  source: { w: number; h: number }
  content: { w: number; h: number }
}

function frameIndex(filename: string, fallback: number): number {
  const match = filename.match(/(\d+)(?:\.png)?$/i)
  return match ? Number(match[1]) : fallback
}

function regionKey(page: number, region: TpsheetRect): string {
  return `${page}:${region.x}:${region.y}:${region.w}:${region.h}`
}

export function parseTpsheet(data: TpsheetJson): ParsedSpritesheet {
  const listed: SpriteFrame[] = []
  const pages = (data.textures ?? []).map((texture, page) => {
    for (const sprite of texture.sprites ?? []) {
      const source = {
        w: sprite.region.w + sprite.margin.x + sprite.margin.w,
        h: sprite.region.h + sprite.margin.y + sprite.margin.h,
      }
      listed.push({
        filename: sprite.filename,
        index: frameIndex(sprite.filename, listed.length),
        page,
        region: sprite.region,
        margin: sprite.margin,
        source,
      })
    }
    return { image: texture.image, size: texture.size }
  })

  const chronological = [...listed].sort((a, b) => a.index - b.index || a.filename.localeCompare(b.filename))
  const frames: SpriteFrame[] = []
  const seen = new Set<string>()
  for (const frame of chronological) {
    const key = regionKey(frame.page, frame.region)
    if (seen.has(key)) continue
    seen.add(key)
    frames.push(frame)
  }

  const source = {
    w: Math.max(1, ...listed.map((frame) => frame.source.w), 1),
    h: Math.max(1, ...listed.map((frame) => frame.source.h), 1),
  }
  const content = {
    w: Math.max(1, ...listed.map((frame) => frame.region.w), 1),
    h: Math.max(1, ...listed.map((frame) => frame.region.h), 1),
  }

  return { frames: frames.length ? frames : listed, pages, source, content }
}

export function atlasImageUrl(tpsheetUrl: string, image: string): string {
  const dir = tpsheetUrl.replace(/\/[^/]+$/, '')
  return `${dir}/${image}`
}
