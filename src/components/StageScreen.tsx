import { getSong } from '../config/loadConfig'
import { useGame } from '../state/gameStore'
import { Balloon } from './Balloon'
import { DragLayer } from './DragLayer'
import { HomeButton } from './HomeButton'
import { PrizeOverlay } from './PrizeOverlay'
import { StageScene } from './StageScene'
import { Tray } from './Tray'

export function StageScreen() {
  const songId = useGame((s) => s.songId)
  const song = getSong(songId)

  return (
    <div className="stage-screen">
      <StageScene />
      <div className="hud-top">
        <HomeButton />
        <div className="song-chip">{song?.title ?? 'Infanti'}</div>
      </div>
      <Balloon />
      <Tray />
      <DragLayer />
      <PrizeOverlay />
    </div>
  )
}
