import { CHARACTERS } from '../config/characters'
import { monsterIconFor } from '../config/monsterIcons'
import type { CharacterId } from '../types'

function PlaceholderChip({ characterId }: { characterId: CharacterId }) {
  const look = CHARACTERS[characterId]
  return (
    <svg className="tray-monster" viewBox="0 0 105 105" aria-hidden>
      <rect x="5" y="5" width="100" height="100" rx="15" fill="#663156" opacity="0.2" />
      <rect width="100" height="100" rx="15" fill={look.bodyColor} />
      <circle cx="38" cy="44" r="5" fill="#3b0b32" />
      <circle cx="62" cy="44" r="5" fill="#3b0b32" />
      <path
        d="M38 64c6 8 18 8 24 0"
        fill="none"
        stroke="#3b0b32"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="78" cy="22" r="7" fill={look.accentColor} />
    </svg>
  )
}

export function HumanoidFace({
  characterId,
  ativo = false,
}: {
  characterId: CharacterId
  ativo?: boolean
}) {
  const src = monsterIconFor(characterId, ativo)
  if (!src) return <PlaceholderChip characterId={characterId} />
  return <img className="tray-monster" src={src} alt="" draggable={false} />
}
