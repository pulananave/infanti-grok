import { useGame } from '../state/gameStore'
import { SideArtButton } from './SideArtButton'

export function HomeButton() {
  const exitToMenu = useGame((s) => s.exitToMenu)
  return (
    <SideArtButton
      normalSrc="/ui/home-normal.svg"
      pressedSrc="/ui/home-pressed.svg"
      label="Voltar ao menu"
      onClick={exitToMenu}
    />
  )
}
