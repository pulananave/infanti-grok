import { useGame } from '../state/gameStore'
import { SideArtButton } from './SideArtButton'

export function ClearStageButton() {
  const clearStage = useGame((s) => s.clearStage)
  return (
    <SideArtButton
      normalSrc="/ui/clear-normal.svg"
      pressedSrc="/ui/clear-pressed.svg"
      label="Limpar palco"
      onClick={clearStage}
      dataClearStage
    />
  )
}
