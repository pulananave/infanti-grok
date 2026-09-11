import { useLayoutEffect, useRef } from 'react'
import { CHARACTERS } from '../config/characters'
import { HumanoidFace } from './HumanoidFace'
import { MAX_STAGE_INSTANCES, useGame, trayCharacterIds } from '../state/gameStore'
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
  const instances = useGame((s) => s.instances)
  const notifyStageFull = useGame((s) => s.notifyStageFull)
  const characters = trayCharacterIds()
  const onStage = new Set(instances.map((item) => item.characterId))
  const full = instances.length >= MAX_STAGE_INSTANCES
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
    <div
      ref={trayRef}
      className={`tray ${dropTarget ? 'drop-target' : ''} ${full ? 'is-full' : ''}`}
      data-tray
      data-tray-full={full ? 'true' : undefined}
      aria-disabled={full}
      onPointerUp={() => {
        if (!full) return
        if (useGame.getState().drag) return
        if (Date.now() - lastInteractAt < 200) return
        notifyStageFull()
      }}
    >
      <div className="tray-row">
        {characters.map((id) => {
          const look = CHARACTERS[id]
          const ativo = !full && (balloonCharacterId === id || onStage.has(id))
          return (
            <button
              key={id}
              type="button"
              className={`tray-slot ${!full && balloonCharacterId === id ? 'open' : ''} ${ativo ? 'ativo' : ''}`}
              data-tray-char={id}
              aria-label={look.name}
              disabled={full}
              onPointerUp={(event) => {
                event.stopPropagation()
                if (full) {
                  notifyStageFull()
                  return
                }
                if (useGame.getState().drag) return
                if (Date.now() - lastInteractAt < 200) return
                toggleBalloon(id)
              }}
            >
              <HumanoidFace characterId={id} ativo={ativo} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
