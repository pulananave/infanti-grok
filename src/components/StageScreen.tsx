import { getSong } from '../config/loadConfig'
import { useGame } from '../state/gameStore'
import { Balloon } from './Balloon'
import { DragLayer } from './DragLayer'
import { ClearStageButton } from './ClearStageButton'
import { HomeButton } from './HomeButton'
import { PrizeOverlay } from './PrizeOverlay'
import { StageScene } from './StageScene'
import { TexPilotBadge } from './TexPilotBadge'
import { Tray } from './Tray'

export function StageScreen() {
  const songId = useGame((s) => s.songId)
  const notice = useGame((s) => s.stageNotice)
  const song = getSong(songId)

  return (
    <div className="stage-screen">
      <StageScene />
      <div className="hud-top">
        <div className="hud-left">
          <div className="song-chip">{song?.title ?? 'Infanti'}</div>
          <TexPilotBadge />
        </div>
        <div className="hud-right hud-rail">
          <HomeButton />
          <ClearStageButton />
        </div>
      </div>
      {notice === 'full' && (
        <div className="stage-notice" data-ui>
          Palco cheio · máximo 9
        </div>
      )}
      <Balloon />
      <Tray />
      <DragLayer />
      <PrizeOverlay />
    </div>
  )
}
