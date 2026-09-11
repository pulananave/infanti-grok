import { create } from 'zustand'
import {
  createBlankSong,
  duplicateSong,
  emptyCombos,
  findSong,
  mergeShippedWithOverlay,
  overlayFromCatalog,
  readOverlay,
  uniqueSongId,
  writeOverlay,
  type MergedCatalog,
} from '../config/catalog'
import type { AlbumConfig, ComboShape, SongConfig, SongId } from '../types'

export interface CatalogState extends MergedCatalog {
  upsertSong: (song: SongConfig, albumId: string, combos?: Record<ComboShape, string[]>) => void
  deleteSong: (songId: string) => void
  duplicateSongInto: (songId: string, albumId?: string) => SongConfig | undefined
  createSong: (albumId: string, title?: string) => SongConfig
  upsertAlbum: (album: AlbumConfig) => void
  createAlbum: (name: string) => AlbumConfig
  deleteAlbum: (albumId: string) => void
  moveSongToAlbum: (songId: string, albumId: string) => void
  resetToShipped: () => void
  replaceCatalog: (catalog: MergedCatalog) => void
}

function persist(catalog: MergedCatalog): MergedCatalog {
  writeOverlay(overlayFromCatalog(catalog))
  return catalog
}

function withoutSong(albums: AlbumConfig[], songId: string): AlbumConfig[] {
  return albums.map((album) => ({
    ...album,
    songIds: album.songIds.filter((id) => id !== songId),
  }))
}

function withSongInAlbum(albums: AlbumConfig[], songId: string, albumId: string): AlbumConfig[] {
  const currentAlbum = albums.find((album) => album.songIds.includes(songId))
  if (currentAlbum?.id === albumId) return albums
  const cleaned = withoutSong(albums, songId)
  const target = cleaned.find((album) => album.id === albumId) ?? cleaned[0]
  if (!target) return cleaned
  return cleaned.map((album) =>
    album.id === target.id ? { ...album, songIds: [...album.songIds, songId] } : album,
  )
}

const shipped = mergeShippedWithOverlay(readOverlay())

export const useCatalog = create<CatalogState>((set, get) => ({
  albums: shipped.albums,
  songs: shipped.songs,
  combos: shipped.combos,

  upsertSong: (song, albumId, combos) => {
    const current = get()
    const nextSongs = current.songs.some((item) => item.id === song.id)
      ? current.songs.map((item) => (item.id === song.id ? song : item))
      : [...current.songs, song]
    const nextCombos = {
      ...current.combos,
      [song.id]: combos ?? current.combos[song.id] ?? emptyCombos(),
    }
    set(
      persist({
        albums: withSongInAlbum(current.albums, song.id, albumId),
        songs: nextSongs,
        combos: nextCombos,
      }),
    )
  },

  deleteSong: (songId) => {
    const current = get()
    const restCombos = { ...current.combos }
    delete restCombos[songId]
    set(
      persist({
        albums: withoutSong(current.albums, songId),
        songs: current.songs.filter((song) => song.id !== songId),
        combos: restCombos,
      }),
    )
  },

  duplicateSongInto: (songId, albumId) => {
    const current = get()
    const source = findSong(current.songs, songId)
    if (!source) return undefined
    const copy = duplicateSong(
      source,
      current.songs.flatMap((song) => [song.id, ...song.aliases]),
    )
    const dest = albumId ?? current.albums.find((album) => album.songIds.includes(source.id))?.id
    get().upsertSong(copy, dest ?? current.albums[0]?.id ?? 'cancioneiro-popular', current.combos[source.id])
    return copy
  },

  createSong: (albumId, title) => {
    const current = get()
    const song = createBlankSong(
      current.songs.flatMap((item) => [item.id, ...item.aliases]),
      title,
    )
    get().upsertSong(song, albumId, emptyCombos())
    return song
  },

  upsertAlbum: (album) => {
    const current = get()
    const exists = current.albums.some((item) => item.id === album.id)
    const albums = exists
      ? current.albums.map((item) => (item.id === album.id ? { ...item, name: album.name } : item))
      : [...current.albums, { ...album, songIds: album.songIds ?? [] }]
    set(persist({ albums, songs: current.songs, combos: current.combos }))
  },

  createAlbum: (name) => {
    const current = get()
    const id = uniqueSongId(name, current.albums.map((album) => album.id), 'album')
    const album: AlbumConfig = { id, name: name.trim() || 'Novo álbum', songIds: [] }
    get().upsertAlbum(album)
    return album
  },

  deleteAlbum: (albumId) => {
    const current = get()
    if (current.albums.length <= 1) return
    const removed = current.albums.find((album) => album.id === albumId)
    if (!removed) return
    const remaining = current.albums.filter((album) => album.id !== albumId)
    const fallback = remaining[0]
    const albums = remaining.map((album) =>
      album.id === fallback.id
        ? { ...album, songIds: [...album.songIds, ...removed.songIds.filter((id) => !album.songIds.includes(id))] }
        : album,
    )
    set(persist({ albums, songs: current.songs, combos: current.combos }))
  },

  moveSongToAlbum: (songId, albumId) => {
    const current = get()
    set(
      persist({
        albums: withSongInAlbum(current.albums, songId, albumId),
        songs: current.songs,
        combos: current.combos,
      }),
    )
  },

  resetToShipped: () => {
    writeOverlay(null)
    set(mergeShippedWithOverlay(null))
  },

  replaceCatalog: (catalog) => {
    set(persist(catalog))
  },
}))

export function getSong(id: string | null | undefined): SongConfig | undefined {
  return findSong(useCatalog.getState().songs, id)
}

export function getCombos(songId: SongId | string): Record<ComboShape, string[]> {
  const song = getSong(songId)
  const key = song?.id ?? songId
  return (
    useCatalog.getState().combos[key] ?? {
      circle: [],
      square: [],
      triangle: [],
    }
  )
}
