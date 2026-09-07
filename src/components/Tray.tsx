import { CHARACTERS } from '../config/characters'
import { HumanoidFace } from './HumanoidFace'
import { useGame, trayCharacterIds } from '../state/gameStore'
import { isInRemoveZone } from '../state/sceneBridge'

export function Tray() {
  const balloonCharacterId = useGame((s) => s.balloonCharacterId)
  const toggleBalloon = useGame((s) => s.toggleBalloon)
  const drag = useGame((s) => s.drag)
  const lastInteractAt = useGame((s) => s.lastInteractAt)
  const characters = trayCharacterIds()
  const dropTarget =
    drag?.type === 'move' && drag.moved && isInRemoveZone(drag.clientX, drag.clientY)

  return (
    <div className={`tray ${dropTarget ? 'drop-target' : ''}`} data-tray>
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
              if (useGame.getState().drag) return
              if (Date.now() - lastInteractAt < 200) return
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
