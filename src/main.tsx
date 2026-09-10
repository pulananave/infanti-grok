import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { audioEngine } from './audio/AudioEngine'
import { useGame } from './state/gameStore'
import { instanceScreenPoint, panForPosition, pickInstanceAt } from './state/sceneBridge'
import { beatToTile } from './theme/floorGrid'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')) {
  ;(
    window as Window & {
      __infanti?: {
        getState: typeof useGame.getState
        pickInstanceAt: typeof pickInstanceAt
        instanceScreenPoint: typeof instanceScreenPoint
        beatToTile: typeof beatToTile
        panForPosition: typeof panForPosition
        audio: {
          isAudible: () => boolean
          getBeatIndex: () => number
          getPan: (id: string) => number | null
        }
      }
    }
  ).__infanti = {
    getState: useGame.getState,
    pickInstanceAt,
    instanceScreenPoint,
    beatToTile,
    panForPosition,
    audio: {
      isAudible: () => audioEngine.isAudible(),
      getBeatIndex: () => audioEngine.getBeatIndex(),
      getPan: (id) => audioEngine.getPan(id),
    },
  }
}
