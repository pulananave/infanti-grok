import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useGame } from './state/gameStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')) {
  ;(
    window as Window & {
      __infanti?: { getState: typeof useGame.getState }
    }
  ).__infanti = {
    getState: useGame.getState,
  }
}
