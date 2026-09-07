import { useEffect } from 'react'
import { useGame } from '../state/gameStore'
import { InstrumentIcon } from './InstrumentIcon'

export function DragLayer() {
  const drag = useGame((s) => s.drag)
  const updateDrag = useGame((s) => s.updateDrag)
  const endSpawnDrag = useGame((s) => s.endSpawnDrag)

  useEffect(() => {
    if (!drag) return

    const onMove = (event: PointerEvent) => {
      event.preventDefault()
      updateDrag(event.clientX, event.clientY)
    }
    const onUp = (event: PointerEvent) => {
      void endSpawnDrag(event.clientX, event.clientY)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, updateDrag, endSpawnDrag])

  if (!drag) return null

  return (
    <div className="drag-ghost" style={{ left: drag.clientX, top: drag.clientY }}>
      <InstrumentIcon instrument={drag.instrument} />
    </div>
  )
}
