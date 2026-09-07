export interface StubMeta {
  bpm: number
  compassos: number
  instrument: string
  genre: string
}

const GENRE_INTERVALS: Record<string, number[]> = {
  pop: [0, 4, 7, 12],
  rock: [0, 3, 7, 10],
  samba: [0, 3, 7, 10],
  jazz: [0, 4, 7, 11],
  classical: [0, 4, 7, 12],
  kids: [0, 4, 7, 9],
  march: [0, 5, 7, 12],
  bossa: [0, 3, 7, 10],
  electronic: [0, 5, 7, 10],
  reggae: [0, 4, 7, 9],
  forro: [0, 5, 7, 12],
  salsa: [0, 3, 7, 10],
  folk: [0, 2, 7, 9],
  waltz: [0, 4, 7, 11],
  funk: [0, 5, 7, 10],
}

function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function makeStubBuffer(ctx: AudioContext, meta: StubMeta): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const beat = 60 / meta.bpm
  const loopSec = beat * 4 * meta.compassos
  const tail = 0.55
  const duration = loopSec + tail
  const length = Math.max(1, Math.floor(duration * sampleRate))
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  const seed = hashString(`${meta.instrument}:${meta.genre}`)
  const root = 55 + (seed % 12)
  const intervals = GENRE_INTERVALS[meta.genre] ?? GENRE_INTERVALS.pop
  const swing = meta.genre === 'jazz' || meta.genre === 'samba' ? 0.12 : 0

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const inTail = t >= loopSec
    const loopT = inTail ? t : t
    const beatPos = loopT / beat
    const beatIndex = Math.floor(beatPos)
    const beatFrac = beatPos - beatIndex
    const swung = beatFrac < 0.5 ? beatFrac * (1 + swing) : beatFrac
    const envBeat = Math.max(0, 1 - swung * 2.2)

    let sample = 0
    const inst = meta.instrument

    if (inst === 'drums' || inst === 'dj') {
      const kick = beatIndex % 2 === 0 ? Math.sin(2 * Math.PI * (90 - beatFrac * 50) * loopT) * envBeat : 0
      const snare =
        beatIndex % 2 === 1
          ? (Math.random() * 2 - 1) * envBeat * 0.45 * Math.exp(-beatFrac * 18)
          : 0
      const hat = (Math.random() * 2 - 1) * 0.08 * Math.exp(-((beatFrac % 0.5) * 30))
      sample = kick * 0.7 + snare + hat
    } else if (inst === 'tambourine' || inst === 'shaker' || inst === 'maracas') {
      sample = (Math.random() * 2 - 1) * 0.35 * Math.exp(-((beatFrac % 0.5) * 22))
    } else if (inst === 'triangle') {
      sample = Math.sin(2 * Math.PI * 1760 * loopT) * envBeat * 0.25
    } else if (inst === 'bass' || inst === 'tuba' || inst === 'cello') {
      const degree = intervals[beatIndex % intervals.length]
      const freq = midiToHz(root - 12 + degree)
      sample = Math.sin(2 * Math.PI * freq * loopT) * envBeat * 0.55
      if (inst === 'cello') sample += Math.sin(2 * Math.PI * freq * 2 * loopT) * envBeat * 0.15
    } else if (inst === 'vocals') {
      const degree = intervals[(beatIndex + 2) % intervals.length]
      const freq = midiToHz(root + 12 + degree)
      const vibrato = 1 + 0.012 * Math.sin(2 * Math.PI * 5.5 * loopT)
      sample = Math.sin(2 * Math.PI * freq * vibrato * loopT) * envBeat * 0.35
    } else {
      const degree = intervals[beatIndex % intervals.length]
      const base = inst === 'flute' || inst === 'xylophone' ? root + 24 : root + 12
      const freq = midiToHz(base + degree)
      const wave =
        inst === 'electric_guitar' || inst === 'synth' || inst === 'saxophone'
          ? Math.sign(Math.sin(2 * Math.PI * freq * loopT))
          : Math.sin(2 * Math.PI * freq * loopT)
      sample = wave * envBeat * 0.28
    }

    const tailFade = inTail ? Math.max(0, 1 - (t - loopSec) / tail) : 1
    const fadeIn = Math.min(1, t / 0.02)
    data[i] = sample * tailFade * fadeIn * 0.85
  }

  return buffer
}
