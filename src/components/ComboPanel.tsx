import { COMBO_SHAPES, getCombos } from '../config/loadConfig'
import { useGame } from '../state/gameStore'

function slicesFor(instruments: string[], onStage: Set<string>) {
  return instruments.map((instrument) => onStage.has(instrument))
}

function CircleMeter({ filled }: { filled: boolean[] }) {
  const colors = ['#FF8DC7', '#5EE0C4', '#FFE56A', '#7C4DFF']
  return (
    <svg viewBox="0 0 64 64">
      {filled.map((on, index) => {
        const start = (index * Math.PI) / 2 - Math.PI / 2
        const end = start + Math.PI / 2
        const x1 = 32 + Math.cos(start) * 26
        const y1 = 32 + Math.sin(start) * 26
        const x2 = 32 + Math.cos(end) * 26
        const y2 = 32 + Math.sin(end) * 26
        return (
          <path
            key={index}
            d={`M32 32 L${x1} ${y1} A26 26 0 0 1 ${x2} ${y2} Z`}
            fill={on ? colors[index] : '#fff7e8'}
            stroke="#2b1654"
            strokeWidth="2.5"
            opacity={on ? 1 : 0.45}
          />
        )
      })}
    </svg>
  )
}

function SquareMeter({ filled }: { filled: boolean[] }) {
  const colors = ['#FF8DC7', '#5EE0C4', '#FFE56A', '#7C4DFF']
  const cells = [
    [8, 8],
    [34, 8],
    [8, 34],
    [34, 34],
  ]
  return (
    <svg viewBox="0 0 64 64">
      {filled.map((on, index) => (
        <rect
          key={index}
          x={cells[index][0]}
          y={cells[index][1]}
          width="22"
          height="22"
          rx="5"
          fill={on ? colors[index] : '#fff7e8'}
          stroke="#2b1654"
          strokeWidth="2.5"
          opacity={on ? 1 : 0.45}
        />
      ))}
    </svg>
  )
}

function TriangleMeter({ filled }: { filled: boolean[] }) {
  const colors = ['#FF8DC7', '#5EE0C4', '#FFE56A', '#7C4DFF']
  const bands = [
    'M32 8 L36 18 H28 Z',
    'M26 20 L38 20 L42 30 H22 Z',
    'M20 32 L44 32 L48 42 H16 Z',
    'M14 44 L50 44 L56 56 H8 Z',
  ]
  return (
    <svg viewBox="0 0 64 64">
      {filled.map((on, index) => (
        <path
          key={index}
          d={bands[index]}
          fill={on ? colors[index] : '#fff7e8'}
          stroke="#2b1654"
          strokeWidth="2"
          opacity={on ? 1 : 0.45}
        />
      ))}
    </svg>
  )
}

export function ComboPanel() {
  const songId = useGame((s) => s.songId)
  const instances = useGame((s) => s.instances)
  const awarded = useGame((s) => s.awarded)
  if (!songId) return null
  const combos = getCombos(songId)
  const onStage = new Set(instances.map((item) => item.instrument))

  return (
    <div className="combo-panel" data-ui>
      {COMBO_SHAPES.map((shape) => {
        const filled = slicesFor(combos[shape] ?? [], onStage)
        const complete = awarded.includes(shape) || filled.every(Boolean)
        return (
          <div key={shape} className={`combo-item ${complete ? 'complete' : ''}`}>
            {shape === 'circle' && <CircleMeter filled={filled} />}
            {shape === 'square' && <SquareMeter filled={filled} />}
            {shape === 'triangle' && <TriangleMeter filled={filled} />}
          </div>
        )
      })}
    </div>
  )
}
