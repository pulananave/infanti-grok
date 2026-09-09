import { getSong } from '../config/loadConfig'
import { instrumentIconSrc } from '../config/instrumentIcons'
import { useGame } from '../state/gameStore'
import type { CharacterId } from '../types'

interface Props {
  /** Godot `type` (Pratos, Voz, Milkman, …). */
  type?: string
  /** Stem id — needed so e-drum variants stay unique inside a song. */
  instrument?: string
  characterId?: CharacterId
}

export function InstrumentIcon({ type, instrument, characterId }: Props) {
  const songId = useGame((s) => s.songId)
  const song = getSong(songId)
  const typeName = type ?? instrument ?? 'instrument'
  const src = instrumentIconSrc(
    typeName,
    song,
    characterId && instrument ? { character: characterId, instrument } : undefined,
  )

  return (
    <span className="instrument-icon">
      <img src={src} alt="" draggable={false} aria-hidden="true" />
    </span>
  )
}
