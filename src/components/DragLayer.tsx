import { useEffect } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import { useGame } from '../state/gameStore'
import { isOverBlockingUi, isOverTray, nearestInstanceId, projectToFloor } from '../state/sceneBridge'
import { InstrumentIcon } from './InstrumentIcon'

export function DragLayer() {
  const drag = useGame((s) => s.drag)
  const updateDrag = useGame((s) => s.updateDrag)
  const endDrag = useGame((s) => s.endDrag)

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      audioEngine.unlock()
      const state = useGame.getState()
      if (state.drag || state.screen !== 'stage') return
      if (isOverBlockingUi(event.clientX, event.clientY) || isOverTray(event.clientX, event.clientY)) {
        return
      }
      const hit = projectToFloor(event.clientX, event.clientY)
      if (!hit) return
      const id = nearestInstanceId(hit, state.instances)
      if (!id) return
      const instance = state.instances.find((item) => item.id === id)
      if (!instance) return
      event.preventDefault()
      state.beginMoveDrag(id, instance.instrument, instance.type, event.clientX, event.clientY)
    }
    const onMove = (event: PointerEvent) => {
      if (!useGame.getState().drag) return
      event.preventDefault()
      updateDrag(event.clientX, event.clientY)
    }
    const onUp = (event: Event) => {
      audioEngine.unlock()
      if (!useGame.getState().drag) return
      if (!('clientX' in event) || !('clientY' in event)) return
      const { clientX, clientY } = event as MouseEvent
      void endDrag(clientX, clientY)
    }

    window.addEventListener('pointerdown', onDown, { passive: false, capture: true })
    window.addEventListener('pointermove', onMove, { passive: false, capture: true })
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
    window.addEventListener('mouseup', onUp, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
      window.removeEventListener('mouseup', onUp, true)
    }
  }, [updateDrag, endDrag])

  if (!drag || drag.type !== 'spawn') return null

  return (
    <div className="drag-ghost" style={{ left: drag.clientX, top: drag.clientY }}>
      <InstrumentIcon instrument={drag.iconType} />
    </div>
  )
}
