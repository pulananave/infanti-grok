import combosData from './combos.json'
import songsData from './songs.json'
import type { AlbumConfig, ComboShape, SongConfig, SongTheme, StemConfig } from '../types'

export const CATALOG_STORAGE_KEY = 'infanti.catalog.v1'

export const CANCIONEIRO_POPULAR_ID = 'cancioneiro-popular'

export const DEFAULT_THEME: SongTheme = {
  sky: '#d4c6f0',
  horizon: '#e8b8d4',
  floor: '#b8e0c4',
  floorAccent: '#9ee0c8',
  fog: '#dcc8ec',
  accent: '#d4f08a',
}

export const EMPTY_COMBOS: Record<ComboShape, string[]> = {
  circle: [],
  square: [],
  triangle: [],
}

const SHIPPED_SONG_IDS = ['aranha', 'canoa', 'coelho', 'pintinho', 'sapo'] as const

interface SongsFile {
  albums?: AlbumConfig[]
  songs: SongConfig[]
}

type CombosFile = Record<string, Record<ComboShape, string[]>>

export const SHIPPED_SONGS: SongConfig[] = (songsData as SongsFile).songs
export const SHIPPED_COMBOS = combosData as CombosFile
export const SHIPPED_ALBUMS: AlbumConfig[] = normalizeAlbums(
  (songsData as SongsFile).albums,
  SHIPPED_SONGS.map((song) => song.id),
)

export interface CatalogOverlay {
  version: 1
  albums?: AlbumConfig[]
  songPatches?: Record<string, SongConfig>
  deletedSongIds?: string[]
  comboPatches?: Record<string, Record<ComboShape, string[]>>
}

export interface MergedCatalog {
  albums: AlbumConfig[]
  songs: SongConfig[]
  combos: Record<string, Record<ComboShape, string[]>>
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function emptyCombos(): Record<ComboShape, string[]> {
  return clone(EMPTY_COMBOS)
}

export function normalizeAlbums(
  albums: AlbumConfig[] | undefined,
  songIds: string[],
): AlbumConfig[] {
  const known = new Set(songIds)
  const source =
    albums && albums.length > 0
      ? albums
      : [
          {
            id: CANCIONEIRO_POPULAR_ID,
            name: 'Cancioneiro Popular',
            songIds: SHIPPED_SONG_IDS.filter((id) => known.has(id)),
          },
        ]

  const seenSong = new Set<string>()
  const next: AlbumConfig[] = []
  const usedAlbumIds = new Set<string>()

  for (const album of source) {
    const id = slugify(album.id || album.name)
    if (!id || usedAlbumIds.has(id)) continue
    usedAlbumIds.add(id)
    const ids = (album.songIds ?? []).filter((songId) => known.has(songId) && !seenSong.has(songId))
    for (const songId of ids) seenSong.add(songId)
    next.push({
      id,
      name: album.name.trim() || 'Álbum',
      songIds: ids,
    })
  }

  if (next.length === 0) {
    next.push({
      id: CANCIONEIRO_POPULAR_ID,
      name: 'Cancioneiro Popular',
      songIds: [],
    })
  }

  const orphans = songIds.filter((id) => !seenSong.has(id))
  if (orphans.length > 0) {
    next[0] = { ...next[0], songIds: [...next[0].songIds, ...orphans] }
  }

  return next
}

export function mergeShippedWithOverlay(overlay: CatalogOverlay | null): MergedCatalog {
  const deleted = new Set(overlay?.deletedSongIds ?? [])
  const patches = overlay?.songPatches ?? {}
  const songsById = new Map<string, SongConfig>()

  for (const song of SHIPPED_SONGS) {
    if (!deleted.has(song.id)) songsById.set(song.id, clone(song))
  }
  for (const [id, song] of Object.entries(patches)) {
    if (!song || deleted.has(id)) continue
    songsById.set(song.id || id, clone(song))
  }

  const songs = [...songsById.values()]
  const albums = normalizeAlbums(overlay?.albums ?? SHIPPED_ALBUMS, songs.map((song) => song.id))
  const combos: Record<string, Record<ComboShape, string[]>> = clone(SHIPPED_COMBOS)
  for (const [id, value] of Object.entries(overlay?.comboPatches ?? {})) {
    if (value) combos[id] = clone(value)
  }
  for (const id of deleted) {
    delete combos[id]
  }

  return { albums, songs, combos }
}

export function readOverlay(): CatalogOverlay | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CatalogOverlay
    if (!parsed || parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function writeOverlay(overlay: CatalogOverlay | null): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (!overlay) {
      localStorage.removeItem(CATALOG_STORAGE_KEY)
      return
    }
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(overlay))
  } catch {
    // Private mode / quota — keep the in-memory catalog anyway.
  }
}

export function overlayFromCatalog(catalog: MergedCatalog): CatalogOverlay | null {
  const liveIds = new Set(catalog.songs.map((song) => song.id))
  const deletedSongIds = SHIPPED_SONGS.map((song) => song.id).filter((id) => !liveIds.has(id))
  const songPatches: Record<string, SongConfig> = {}

  for (const song of catalog.songs) {
    const shipped = SHIPPED_SONGS.find((item) => item.id === song.id)
    if (!shipped || JSON.stringify(shipped) !== JSON.stringify(song)) {
      songPatches[song.id] = song
    }
  }

  const comboPatches: Record<string, Record<ComboShape, string[]>> = {}
  const comboIds = new Set([...Object.keys(SHIPPED_COMBOS), ...Object.keys(catalog.combos)])
  for (const id of comboIds) {
    const live = catalog.combos[id] ?? emptyCombos()
    const shipped = SHIPPED_COMBOS[id]
    if (!shipped || JSON.stringify(shipped) !== JSON.stringify(live)) {
      comboPatches[id] = live
    }
  }

  const albumsChanged = JSON.stringify(catalog.albums) !== JSON.stringify(SHIPPED_ALBUMS)
  const hasPatches =
    deletedSongIds.length > 0 ||
    Object.keys(songPatches).length > 0 ||
    Object.keys(comboPatches).length > 0 ||
    albumsChanged

  if (!hasPatches) return null

  return {
    version: 1,
    albums: catalog.albums,
    songPatches,
    deletedSongIds,
    comboPatches,
  }
}

export function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
  return slug
}

export function uniqueSongId(title: string, existing: Iterable<string>, fallback = 'musica'): string {
  const taken = new Set(existing)
  const base = slugify(title) || fallback
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base}_${index}`)) index += 1
  return `${base}_${index}`
}

export function createBlankSong(existingIds: Iterable<string>, title = 'Nova música'): SongConfig {
  const id = uniqueSongId(title, existingIds)
  return {
    id,
    aliases: [],
    title,
    bpm: 120,
    bars: 16,
    folder: `infanti_${id}`,
    filePrefix: id,
    theme: { ...DEFAULT_THEME },
    stems: [],
  }
}

export function duplicateSong(song: SongConfig, existingIds: Iterable<string>): SongConfig {
  const id = uniqueSongId(`${song.id}_copia`, existingIds, `${song.id}_copia`)
  return {
    ...clone(song),
    id,
    aliases: [],
    title: `${song.title} (cópia)`,
    folder: song.folder,
    filePrefix: id,
  }
}

export function createBlankStem(character: StemConfig['character'] = 'boogar'): StemConfig {
  return {
    character,
    instrument: 'novo_instrumento',
    type: 'Synth',
    genre: 'melo',
    compassos: 8,
    file: '',
  }
}

export function songsByAlbum(
  albums: AlbumConfig[],
  songs: SongConfig[],
): { album: AlbumConfig; songs: SongConfig[] }[] {
  const byId = new Map(songs.map((song) => [song.id, song]))
  return albums
    .map((album) => ({
      album,
      songs: album.songIds.map((id) => byId.get(id)).filter((song): song is SongConfig => Boolean(song)),
    }))
    .filter((group) => group.songs.length > 0)
}

export function findSong(songs: SongConfig[], id: string | null | undefined): SongConfig | undefined {
  if (!id) return undefined
  return songs.find((song) => song.id === id || song.aliases.includes(id))
}
