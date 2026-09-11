import { CHARACTER_ORDER } from './characters'
import type { CharacterId, ComboShape, SongConfig, StemConfig } from '../types'

export { getCombos, getSong } from '../state/catalogStore'
export { SHIPPED_SONGS as SONGS, SHIPPED_COMBOS as COMBOS } from './catalog'

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
  if (stem.file) {
    return [`/audio/${song.folder}/${stem.file}`]
  }
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

export const COMBO_SHAPES: ComboShape[] = ['circle', 'square', 'triangle']
