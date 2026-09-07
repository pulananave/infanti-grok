import { useGame } from '../state/gameStore'

export function HomeButton() {
  const exitToMenu = useGame((s) => s.exitToMenu)
  return (
    <button type="button" className="home-btn" data-ui aria-label="Voltar ao menu" onClick={exitToMenu}>
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden>
        <path d="M8 22 L24 10 L40 22 V40 H30 V28 H18 V40 H8Z" fill="#6C2BD9" />
      </svg>
    </button>
  )
}
