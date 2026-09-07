import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const songsFile = JSON.parse(await readFile(join(root, 'src/config/songs.json'), 'utf8'))

const SAMPLE_RATE = 22050
const TAIL = 0.6

const GENRE_INTERVALS = {
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

const ROOTS = {
  aranha: 60,
  canoa: 62,
  coelho: 65,
  pintinho: 67,
  sapo: 57,
}

function midiToHz(midi) {
  return 440 * 2 ** ((midi - 69) / 12)
}

function hashString(value) {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function synthesize({ bpm, compassos, instrument, genre, songId }) {
  const beat = 60 / bpm
  const loopSec = beat * 4 * compassos
  const duration = loopSec + TAIL
  const length = Math.floor(duration * SAMPLE_RATE)
  const data = new Float32Array(length)
  const rand = mulberry32(hashString(`${songId}:${genre}:${instrument}`))
  const root = ROOTS[songId] ?? 60
  const intervals = GENRE_INTERVALS[genre] ?? GENRE_INTERVALS.pop
  const swing = genre === 'jazz' || genre === 'samba' || genre === 'bossa' ? 0.14 : 0

  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE
    const loopT = t
    const beatPos = loopT / beat
    const beatIndex = Math.floor(beatPos)
    const beatFrac = beatPos - beatIndex
    const swung = beatFrac < 0.5 ? beatFrac * (1 + swing) : beatFrac
    const envBeat = Math.max(0, 1 - swung * 2.1)
    let sample = 0

    if (instrument === 'drums' || instrument === 'dj') {
      const kickEnv = Math.exp(-beatFrac * 14)
      const kick =
        beatIndex % 2 === 0 ? Math.sin(2 * Math.PI * (88 - beatFrac * 46) * t) * kickEnv : 0
      const snare =
        beatIndex % 2 === 1 ? (rand() * 2 - 1) * Math.exp(-beatFrac * 16) * 0.5 : 0
      const hat = (rand() * 2 - 1) * 0.09 * Math.exp(-((beatFrac % 0.5) * 28))
      sample = kick * 0.75 + snare + hat
      if (instrument === 'dj') {
        sample += Math.sin(2 * Math.PI * midiToHz(root + 19) * t) * envBeat * 0.12
      }
    } else if (instrument === 'tambourine' || instrument === 'shaker' || instrument === 'maracas') {
      sample = (rand() * 2 - 1) * 0.4 * Math.exp(-((beatFrac % 0.5) * 20))
    } else if (instrument === 'triangle') {
      sample = Math.sin(2 * Math.PI * 1760 * t) * envBeat * 0.22
    } else if (instrument === 'bass' || instrument === 'tuba' || instrument === 'cello') {
      const degree = intervals[beatIndex % intervals.length]
      const freq = midiToHz(root - 12 + degree)
      sample = Math.sin(2 * Math.PI * freq * t) * envBeat * 0.58
      if (instrument === 'cello') sample += Math.sin(2 * Math.PI * freq * 2 * t) * envBeat * 0.16
      if (instrument === 'tuba') sample += Math.sin(2 * Math.PI * (freq / 2) * t) * envBeat * 0.2
    } else if (instrument === 'vocals') {
      const degree = intervals[(beatIndex + 2) % intervals.length]
      const freq = midiToHz(root + 12 + degree)
      const vibrato = 1 + 0.013 * Math.sin(2 * Math.PI * 5.4 * t)
      sample = Math.sin(2 * Math.PI * freq * vibrato * t) * envBeat * 0.34
    } else {
      const degree = intervals[beatIndex % intervals.length]
      const treble = ['flute', 'xylophone', 'triangle', 'ukulele'].includes(instrument)
      const base = treble ? root + 24 : root + 12
      const freq = midiToHz(base + degree)
      const harsh = ['electric_guitar', 'synth', 'saxophone', 'harmonica'].includes(instrument)
      const wave = harsh
        ? Math.sign(Math.sin(2 * Math.PI * freq * t))
        : Math.sin(2 * Math.PI * freq * t + Math.sin(t * 8) * 0.15)
      sample = wave * envBeat * (harsh ? 0.22 : 0.3)
    }

    const tailFade = t >= loopSec ? Math.max(0, 1 - (t - loopSec) / TAIL) : 1
    const fadeIn = Math.min(1, t / 0.02)
    data[i] = sample * tailFade * fadeIn * 0.86
  }

  return data
}

function encodeWav(float32) {
  const n = float32.length
  const buffer = Buffer.alloc(44 + n * 2)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + n * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i += 1) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, 44 + i * 2)
  }
  return buffer
}

function ffmpegOgg(wav, outPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-i', 'pipe:0', '-c:a', 'libvorbis', '-q:a', '4', outPath],
      { stdio: ['pipe', 'ignore', 'pipe'] },
    )
    let err = ''
    proc.stderr.on('data', (chunk) => {
      err += chunk.toString()
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(err || `ffmpeg exited ${code}`))
    })
    proc.stdin.end(wav)
  })
}

let count = 0
for (const song of songsFile.songs) {
  const dir = join(root, 'public/audio', song.folder)
  await mkdir(dir, { recursive: true })
  for (const stem of song.stems) {
    const name = `${song.filePrefix}_${stem.genre}_${stem.instrument}.ogg`
    const outPath = join(dir, name)
    const pcm = synthesize({
      bpm: song.bpm,
      compassos: stem.compassos,
      instrument: stem.instrument,
      genre: stem.genre,
      songId: song.id,
    })
    await ffmpegOgg(encodeWav(pcm), outPath)
    count += 1
    process.stdout.write(`wrote ${song.folder}/${name}\n`)
  }
}

process.stdout.write(`generated ${count} stems\n`)
