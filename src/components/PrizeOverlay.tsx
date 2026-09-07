import { useEffect } from 'react'
import { useGame } from '../state/gameStore'

const LABELS = {
  circle: 'Círculo',
  square: 'Quadrado',
  triangle: 'Triângulo',
}

export function PrizeOverlay() {
  const prize = useGame((s) => s.prize)
  const dismissPrize = useGame((s) => s.dismissPrize)

  useEffect(() => {
    if (!prize) return
    const timer = window.setTimeout(dismissPrize, 2400)
    return () => window.clearTimeout(timer)
  }, [prize, dismissPrize])

  if (!prize) return null

  return (
    <button type="button" className="prize" data-prize onClick={dismissPrize}>
      <div className="prize-card">
        <div className="prize-gift">🎁</div>
        <strong>Prêmio!</strong>
        <div>{LABELS[prize.shape]} completo</div>
      </div>
    </button>
  )
}
