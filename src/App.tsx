import { SongMenu } from './components/SongMenu'
import { StageScreen } from './components/StageScreen'
import { useGame } from './state/gameStore'

export default function App() {
  const screen = useGame((s) => s.screen)
  return <div className="app">{screen === 'menu' ? <SongMenu /> : <StageScreen />}</div>
}
