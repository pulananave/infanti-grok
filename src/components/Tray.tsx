import { useLayoutEffect, useRef } from 'react'
import { CHARACTERS } from '../config/characters'
import { HumanoidFace } from './HumanoidFace'
import { useGame, trayCharacterIds } from '../state/gameStore'
import { isInRemoveZone } from '../state/sceneBridge'

function centerTrayScroll(node: HTMLElement) {
  const extra = node.scrollWidth - node.clientWidth
  node.scrollLeft = extra > 0 ? extra / 2 : 0
}

export function Tray() {
  const trayRef = useRef<HTMLDivElement>(null)
  const balloonCharacterId = useGame((s) => s.balloonCharacterId)
  const toggleBalloon = useGame((s) => s.toggleBalloon)
  const drag = useGame((s) => s.drag)
  const lastInteractAt = useGame((s) => s.lastInteractAt)
  const songId = useGame((s) => s.songId)
  const characters = trayCharacterIds()
  const dropTarget =
    drag?.type === 'move' && drag.moved && isInRemoveZone(drag.clientX, drag.clientY)

  useLayoutEffect(() => {
    const node = trayRef.current
    if (!node) return
    centerTrayScroll(node)
    const observer = new ResizeObserver(() => centerTrayScroll(node))
    observer.observe(node)
    return () => observer.disconnect()
  }, [songId])

  return (
    <div ref={trayRef} className={`tray ${dropTarget ? 'drop-target' : ''}`} data-tray>
      <div className="tray-row">
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
    </div>
  )
}
