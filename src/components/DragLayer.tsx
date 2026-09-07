import { useEffect } from 'react'
import { useGame } from '../state/gameStore'
import { InstrumentIcon } from './InstrumentIcon'

export function DragLayer() {
  const drag = useGame((s) => s.drag)
  const updateDrag = useGame((s) => s.updateDrag)
  const endDrag = useGame((s) => s.endDrag)

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!useGame.getState().drag) return
      event.preventDefault()
      updateDrag(event.clientX, event.clientY)
    }
    const onUp = (event: PointerEvent) => {
      if (!useGame.getState().drag) return
      void endDrag(event.clientX, event.clientY)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [updateDrag, endDrag])

  if (!drag || drag.type !== 'spawn') return null

  return (
    <div className="drag-ghost" style={{ left: drag.clientX, top: drag.clientY }}>
      <InstrumentIcon instrument={drag.instrument} />
    </div>
  )
}
