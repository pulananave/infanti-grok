import { useCallback, useState, type PointerEvent } from 'react'

interface Props {
  normalSrc: string
  pressedSrc: string
  label: string
  onClick: () => void
  dataClearStage?: boolean
}

export function SideArtButton({ normalSrc, pressedSrc, label, onClick, dataClearStage }: Props) {
  const [pressed, setPressed] = useState(false)

  const release = useCallback(() => setPressed(false), [])
  const press = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    setPressed(true)
  }, [])

  return (
    <button
      type="button"
      className={pressed ? 'side-btn is-pressed' : 'side-btn'}
      data-ui
      data-clear-stage={dataClearStage ? '' : undefined}
      aria-label={label}
      onClick={onClick}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      <img className="side-btn-art side-btn-art-normal" src={normalSrc} alt="" draggable={false} aria-hidden />
      <img className="side-btn-art side-btn-art-pressed" src={pressedSrc} alt="" draggable={false} aria-hidden />
    </button>
  )
}
