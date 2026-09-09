import { resolveInstrumentIcon, resolvePerformer } from '../config/spriteMap'
import type { CharacterId } from '../types'

interface Props {
  instrument: string
  genre?: string
  characterId?: CharacterId
}

export function InstrumentIcon({ instrument, genre, characterId }: Props) {
  const src = characterId
    ? resolvePerformer(characterId, instrument, genre).iconUrl
    : resolveInstrumentIcon(instrument, genre)
  if (src) {
    return (
      <span className="instrument-icon">
        <img className="instrument-sticker" src={src} alt="" draggable={false} />
      </span>
    )
  }
  return (
    <span className="instrument-icon">
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle cx="32" cy="32" r="16" fill="#5EE0C4" stroke="#2b1654" strokeWidth="3" />
      </svg>
    </span>
  )
}
