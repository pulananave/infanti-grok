import { useGame } from '../state/gameStore'

export function ClearStageButton() {
  const clearStage = useGame((s) => s.clearStage)
  return (
    <button
      type="button"
      className="home-btn"
      data-ui
      data-clear-stage
      aria-label="Limpar palco"
      onClick={clearStage}
    >
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden>
        <path d="M15 11 L29 29" stroke="#6C2BD9" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="33" cy="33" rx="11" ry="7" transform="rotate(-38 33 33)" fill="#FF8DC7" />
        <path
          d="M24 30 L28 36 M28 28 L33 37 M32 27 L38 36 M36 28 L42 34"
          stroke="#6C2BD9"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="11" cy="18" r="2" fill="#FFE56A" />
        <circle cx="36" cy="12" r="1.7" fill="#5EE0C4" />
      </svg>
    </button>
  )
}
