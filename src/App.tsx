import { useEffect } from 'react'
import { audioEngine } from './audio/AudioEngine'
import { SongMenu } from './components/SongMenu'
import { StageScreen } from './components/StageScreen'
import { useGame } from './state/gameStore'

export default function App() {
  const screen = useGame((s) => s.screen)

  useEffect(() => {
    const unlock = () => {
      audioEngine.unlock()
    }
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('touchstart', unlock, { capture: true, passive: true })
    window.addEventListener('keydown', unlock, true)
    return () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('touchstart', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }, [])

  return <div className="app">{screen === 'menu' ? <SongMenu /> : <StageScreen />}</div>
}
