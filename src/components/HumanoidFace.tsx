import { CHARACTERS } from '../config/characters'
import { monsterIconFor } from '../config/monsterIcons'
import type { CharacterId } from '../types'

function PlaceholderChip({ characterId }: { characterId: CharacterId }) {
  const look = CHARACTERS[characterId]
  const eyeY = look.eyeStyle === 'stalk' ? 28 : 42
  const eyeSpread = look.eyeStyle === 'cyclops' ? 0 : Math.round(look.eyeSpacing * 90)
  const eyeR = look.eyeStyle === 'cyclops' || look.eyeStyle === 'largeWhite' || look.eyeStyle === 'stalk' ? 8 : 5
  return (
    <svg className="tray-monster" viewBox="0 0 105 105" aria-hidden>
      <rect width="100" height="100" x="2" y="2" rx="18" fill={look.bodyColor} />
      {look.eyeStyle === 'cyclops' ? (
        <>
          <circle cx="52" cy="44" r="14" fill={look.scleraColor ?? '#fff8f0'} />
          <circle cx="52" cy="44" r="8" fill={look.irisColor ?? look.accentColor} />
          <circle cx="52" cy="44" r="3" fill={look.eyeColor} />
        </>
      ) : (
        <>
          <circle cx={52 - eyeSpread} cy={eyeY} r={eyeR} fill={look.scleraColor ?? look.eyeColor} />
          <circle cx={52 + eyeSpread} cy={eyeY} r={eyeR} fill={look.scleraColor ?? look.eyeColor} />
          {look.scleraColor && (
            <>
              <circle cx={52 - eyeSpread} cy={eyeY} r={3} fill={look.eyeColor} />
              <circle cx={52 + eyeSpread} cy={eyeY} r={3} fill={look.eyeColor} />
            </>
          )}
        </>
      )}
      {look.browStyle === 'unibrow' && <rect x="32" y="30" width="36" height="6" rx="2" fill={look.accentColor} />}
      {look.browStyle === 'blocks' && (
        <>
          <rect x={40 - eyeSpread} y="28" width="16" height="7" rx="2" fill={look.accentColor} />
          <rect x={48 + eyeSpread} y="28" width="16" height="7" rx="2" fill={look.accentColor} />
        </>
      )}
      {look.features.includes('onionSprout') && (
        <>
          <ellipse cx="44" cy="14" rx="6" ry="10" fill={look.featureColor ?? '#4F9A52'} />
          <ellipse cx="58" cy="12" rx="6" ry="11" fill={look.featureColor ?? '#4F9A52'} />
        </>
      )}
      {look.features.includes('dorsalSpikes') && (
        <>
          <polygon points="28,22 36,6 44,22" fill={look.accentColor} />
          <polygon points="44,18 52,2 60,18" fill={look.accentColor} />
          <polygon points="60,22 68,8 76,22" fill={look.accentColor} />
        </>
      )}
      {look.features.includes('hairTuft') && (
        <polygon points="48,18 52,4 56,18" fill={look.featureColor ?? look.accentColor} />
      )}
      {look.features.includes('flameCrest') && (
        <>
          <polygon points="40,20 46,4 52,20" fill={look.accentColor} />
          <polygon points="50,16 56,2 62,16" fill={look.accentColor} />
        </>
      )}
      <path
        d="M38 68c6 8 18 8 24 0"
        fill="none"
        stroke={look.mouthColor ?? look.eyeColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
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
