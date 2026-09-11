import { useEffect, useLayoutEffect, useState } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import { CHARACTERS } from '../config/characters'
import { getSong, stemsForCharacter } from '../config/loadConfig'
import { MAX_STAGE_INSTANCES, availableStems, useGame } from '../state/gameStore'
import { InstrumentIcon } from './InstrumentIcon'

/** Matches `.balloon` max width in `index.css` (~30% larger than the old 360px). */
const BALLOON_MAX_WIDTH = 468

export function Balloon() {
  const balloonCharacterId = useGame((s) => s.balloonCharacterId)
  const songId = useGame((s) => s.songId)
  const instances = useGame((s) => s.instances)
  const beginSpawnDrag = useGame((s) => s.beginSpawnDrag)
  const [anchor, setAnchor] = useState({ left: 80, bottom: 86 })

  useLayoutEffect(() => {
    if (!balloonCharacterId) return
    const slot = document.querySelector<HTMLElement>(`[data-tray-char="${balloonCharacterId}"]`)
    const tray = document.querySelector<HTMLElement>('[data-tray]')
    if (!slot || !tray) return

    const slotRect = slot.getBoundingClientRect()
    const trayRect = tray.getBoundingClientRect()
    const width = Math.min(BALLOON_MAX_WIDTH, window.innerWidth * 0.8)
    const center = slotRect.left + slotRect.width / 2
    const left = Math.min(Math.max(8, center - width / 2), window.innerWidth - width - 8)
    setAnchor({
      left,
      bottom: window.innerHeight - trayRect.top + 10,
    })
  }, [balloonCharacterId, instances.length])

  useEffect(() => {
    if (!balloonCharacterId) return
    const onResize = () => {
      const slot = document.querySelector<HTMLElement>(`[data-tray-char="${balloonCharacterId}"]`)
      slot?.dispatchEvent(new Event('resize'))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [balloonCharacterId])

  if (!balloonCharacterId || instances.length >= MAX_STAGE_INSTANCES) return null
  const song = getSong(songId)
  if (!song) return null

  const remaining = availableStems(balloonCharacterId)
  const look = CHARACTERS[balloonCharacterId]
  const total = stemsForCharacter(song, balloonCharacterId).length

  return (
    <div
      className="balloon"
      data-balloon
      style={{
        left: anchor.left,
        bottom: anchor.bottom,
      }}
    >
      {remaining.length === 0 ? (
        <div className="balloon-empty">
          {total === 0 ? look.name : '• • •'}
        </div>
      ) : (
        <div className="balloon-grid">
          {remaining.map((stem) => (
            <button
              key={stem.instrument}
              type="button"
              className="instrument-btn"
              aria-label={stem.type}
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                audioEngine.unlock()
                event.currentTarget.setPointerCapture(event.pointerId)
                beginSpawnDrag(balloonCharacterId, stem.instrument, event.clientX, event.clientY)
              }}
            >
              <InstrumentIcon
                type={stem.type}
                instrument={stem.instrument}
                characterId={balloonCharacterId}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
