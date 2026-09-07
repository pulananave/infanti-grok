import { CHARACTERS } from '../config/characters'
import { HumanoidFace } from './HumanoidFace'
import { useGame, trayCharacterIds } from '../state/gameStore'

export function Tray() {
  const balloonCharacterId = useGame((s) => s.balloonCharacterId)
  const toggleBalloon = useGame((s) => s.toggleBalloon)
  const characters = trayCharacterIds()

  return (
    <div className="tray" data-tray>
      {characters.map((id) => {
        const look = CHARACTERS[id]
        return (
          <button
            key={id}
            type="button"
            className={`tray-slot ${balloonCharacterId === id ? 'open' : ''}`}
            data-tray-char={id}
            aria-label={look.name}
            onPointerUp={(event) => {
              event.stopPropagation()
              toggleBalloon(id)
            }}
          >
            <HumanoidFace characterId={id} />
          </button>
        )
      })}
    </div>
  )
}
