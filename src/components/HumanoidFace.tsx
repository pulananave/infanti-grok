import { CHARACTERS } from '../config/characters'
import type { CharacterId } from '../types'

export function HumanoidFace({ characterId }: { characterId: CharacterId }) {
  const look = CHARACTERS[characterId]
  return (
    <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden>
      <circle cx="32" cy="32" r="28" fill={look.bodyColor} />
      <circle cx="32" cy="30" r="16" fill={look.skinColor} />
      <circle cx="26" cy="28" r="3" fill="#2b1654" />
      <circle cx="38" cy="28" r="3" fill="#2b1654" />
      <rect x="26" y="36" width="12" height="3" rx="1.5" fill="#2b1654" opacity="0.35" />
      <circle cx="48" cy="16" r="6" fill={look.accentColor} />
    </svg>
  )
}
