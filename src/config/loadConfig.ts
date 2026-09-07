import combosData from './combos.json'
import songsData from './songs.json'
import { CHARACTER_ORDER } from './characters'
import type { CharacterId, ComboShape, SongConfig, SongId, StemConfig } from '../types'

interface SongsFile {
  songs: SongConfig[]
}

type CombosFile = Record<string, Record<ComboShape, string[]>>

export const SONGS: SongConfig[] = (songsData as SongsFile).songs
export const COMBOS = combosData as CombosFile

export function getSong(id: string | null | undefined): SongConfig | undefined {
  if (!id) return undefined
  return SONGS.find((song) => song.id === id || song.aliases.includes(id))
}

export function songCharacters(song: SongConfig): CharacterId[] {
  const present = new Set(song.stems.map((stem) => stem.character))
  return CHARACTER_ORDER.filter((id) => present.has(id))
}

export function stemsForCharacter(song: SongConfig, characterId: CharacterId): StemConfig[] {
  return song.stems.filter((stem) => stem.character === characterId)
}

export function findStem(
  song: SongConfig,
  characterId: CharacterId,
  instrument: string,
): StemConfig | undefined {
  return song.stems.find(
    (stem) => stem.character === characterId && stem.instrument === instrument,
  )
}

export function stemAudioCandidates(song: SongConfig, stem: StemConfig): string[] {
  const prefixes = [song.filePrefix, ...song.aliases]
  const folders = [song.folder, ...song.aliases.map((alias) => `infanti_${alias}`)]
  const paths: string[] = []
  for (const folder of folders) {
    for (const prefix of prefixes) {
      paths.push(`/audio/${folder}/${prefix}_${stem.genre}_${stem.instrument}.ogg`)
    }
  }
  return [...new Set(paths)]
}

export function getCombos(songId: SongId | string): Record<ComboShape, string[]> {
  const song = getSong(songId)
  const key = song?.id ?? songId
  return (
    COMBOS[key] ?? {
      circle: [],
      square: [],
      triangle: [],
    }
  )
}

export const COMBO_SHAPES: ComboShape[] = ['circle', 'square', 'triangle']
