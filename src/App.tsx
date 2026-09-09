import { lazy, Suspense, useEffect } from 'react'
import { audioEngine } from './audio/AudioEngine'
import { SongMenu } from './components/SongMenu'
import { StageScreen } from './components/StageScreen'
import { useGame } from './state/gameStore'

const LookGallery = lazy(() => import('./components/LookGallery').then((m) => ({ default: m.LookGallery })))
const SHOW_LOOKS = new URLSearchParams(window.location.search).has('looks')

export default function App() {
  const screen = useGame((s) => s.screen)

  useEffect(() => {
    if (SHOW_LOOKS) return
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

  if (SHOW_LOOKS) {
    return (
      <Suspense fallback={null}>
        <LookGallery />
      </Suspense>
    )
  }

  return <div className="app">{screen === 'menu' ? <SongMenu /> : <StageScreen />}</div>
}
