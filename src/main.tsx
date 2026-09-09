import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useGame } from './state/gameStore'
import { instanceScreenPoint, pickInstanceAt } from './state/sceneBridge'

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
      }
    }
  ).__infanti = {
    getState: useGame.getState,
    pickInstanceAt,
    instanceScreenPoint,
  }
}
