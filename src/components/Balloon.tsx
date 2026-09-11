import { useLayoutEffect, useRef, useState } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import { CHARACTERS } from '../config/characters'
import { getSong, stemsForCharacter } from '../config/loadConfig'
import { MAX_STAGE_INSTANCES, availableStems, useGame } from '../state/gameStore'
import { InstrumentIcon } from './InstrumentIcon'

const EDGE_PAD = 8
/** Matches scaled `.balloon` corner radius so the tip stays on the body. */
const TIP_INSET = Math.round(28 * 0.85)

export function Balloon() {
  const balloonCharacterId = useGame((s) => s.balloonCharacterId)
  const songId = useGame((s) => s.songId)
  const instances = useGame((s) => s.instances)
  const beginSpawnDrag = useGame((s) => s.beginSpawnDrag)
  const balloonRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState({ left: 80, bottom: 86, tipX: 50 })

  useLayoutEffect(() => {
    if (!balloonCharacterId) return

    const place = () => {
      const slot = document.querySelector<HTMLElement>(`[data-tray-char="${balloonCharacterId}"]`)
      const tray = document.querySelector<HTMLElement>('[data-tray]')
      const balloon = balloonRef.current
      if (!slot || !tray || !balloon) return

      const slotRect = slot.getBoundingClientRect()
      const trayRect = tray.getBoundingClientRect()
      const width = balloon.offsetWidth
      const center = slotRect.left + slotRect.width / 2
      const maxLeft = Math.max(EDGE_PAD, window.innerWidth - width - EDGE_PAD)
      const left = Math.min(Math.max(EDGE_PAD, center - width / 2), maxLeft)
      const tipX = Math.min(Math.max(TIP_INSET, center - left), Math.max(TIP_INSET, width - TIP_INSET))
      const bottom = window.innerHeight - trayRect.top + 10

      setAnchor((prev) =>
        prev.left === left && prev.bottom === bottom && prev.tipX === tipX
          ? prev
          : { left, bottom, tipX },
      )
    }

    place()

    const balloon = balloonRef.current
    const tray = document.querySelector<HTMLElement>('[data-tray]')
    const observer = balloon ? new ResizeObserver(place) : null
    if (balloon) observer?.observe(balloon)
    window.addEventListener('resize', place)
    tray?.addEventListener('scroll', place, { passive: true })
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', place)
      tray?.removeEventListener('scroll', place)
    }
  }, [balloonCharacterId, instances.length])

  if (!balloonCharacterId || instances.length >= MAX_STAGE_INSTANCES) return null
  const song = getSong(songId)
  if (!song) return null

  const remaining = availableStems(balloonCharacterId)
  const look = CHARACTERS[balloonCharacterId]
  const total = stemsForCharacter(song, balloonCharacterId).length

  return (
    <div
      ref={balloonRef}
      className="balloon"
      data-balloon
      data-instrument-count={remaining.length}
      style={{
        left: anchor.left,
        bottom: anchor.bottom,
        ['--balloon-tip-x' as string]: `${anchor.tipX}px`,
      }}
    >
      <div className="balloon-body">
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
    </div>
  )
}
