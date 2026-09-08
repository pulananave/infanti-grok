import { execFileSync } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const songsPath = join(root, 'src/config/songs.json')

const SONGS = [
  {
    id: 'aranha',
    aliases: ['dona_aranha'],
    title: 'Dona Aranha',
    bpm: 114,
    folder: 'infanti_dona_aranha',
    filePrefix: 'aranha',
    theme: {
      sky: '#3d2a6b',
      horizon: '#7b4aa8',
      floor: '#4a7c4a',
      floorAccent: '#6aa35a',
      fog: '#2a1848',
      accent: '#c9f27a',
    },
  },
  {
    id: 'canoa',
    aliases: [],
    title: 'A Canoa Virou',
    bpm: 118,
    folder: 'infanti_canoa_virou',
    filePrefix: 'canoa',
    theme: {
      sky: '#1d5f8a',
      horizon: '#4db7d4',
      floor: '#2f8f9a',
      floorAccent: '#57c4b0',
      fog: '#12384f',
      accent: '#ffe08a',
    },
  },
  {
    id: 'coelho',
    aliases: [],
    title: 'Coelhinho da Páscoa',
    bpm: 96,
    folder: 'infanti_coelho',
    filePrefix: 'coelho',
    theme: {
      sky: '#f3c6d8',
      horizon: '#f7e3b0',
      floor: '#8bc48a',
      floorAccent: '#d5f2a8',
      fog: '#e8b8c8',
      accent: '#ff8dc7',
    },
  },
  {
    id: 'pintinho',
    aliases: [],
    title: 'Pintinho Amarelinho',
    bpm: 148,
    folder: 'infanti_pintinho',
    filePrefix: 'pintinho',
    theme: {
      sky: '#f7d35c',
      horizon: '#f6a53a',
      floor: '#c4a35a',
      floorAccent: '#e8d27a',
      fog: '#f0c14d',
      accent: '#ff6b35',
    },
  },
  {
    id: 'sapo',
    aliases: [],
    title: 'O Sapo Não Lava o Pé',
    bpm: 138,
    folder: 'infanti_sapo_nao_lava',
    filePrefix: 'sapo',
    theme: {
      sky: '#1f6b4a',
      horizon: '#3fa36a',
      floor: '#2f6b4a',
      floorAccent: '#5cbc6e',
      fog: '#143d2c',
      accent: '#b6ff6a',
    },
  },
]

const CHARACTER_ORDER = [
  'boogar',
  'ceval',
  'dan',
  'esper',
  'gobu',
  'grompy',
  'ohle',
  'rafog',
  'teewong',
  'zoem',
]

const PERC = new Set([
  'bateria',
  'agogo',
  'conga',
  'shaker',
  'pandeirola',
  'clave',
  'bongo',
  'reco_reco',
  'recc_reco',
  'perc_loop',
])

function characterFor(genre, inst) {
  const g = genre === 'mar' ? 'marcial' : genre
  if (g === 'voz') return 'ohle'
  if (g === 'edm') return 'zoem'
  if (PERC.has(inst)) return 'boogar'
  if (inst === 'baixo') return 'ceval'
  if (inst === 'violao' || inst === 'gtr_frase' || (inst === 'gtr_base' && g === 'pop')) return 'dan'
  if (g === 'rock' && (inst === 'gtr_base' || inst === 'gtr_melodia' || inst === 'guitarra_base')) {
    return 'rafog'
  }
  if (['piano', 'rhodes', 'marimba', 'sanfona', 'clavinote', 'orgao'].includes(inst)) return 'esper'
  if (inst === 'trompete' || inst === 'trumpete') return 'gobu'
  if (['tuba', 'bombo', 'caixa', 'pratos'].includes(inst)) return 'grompy'
  if (inst === 'picolo' || inst === 'piccolo') return 'ohle'
  if (inst === 'trombone' || inst === 'violino') return 'teewong'
  if (inst === 'synth') return 'zoem'
  throw new Error(`no character mapping for ${genre}_${inst}`)
}

function parseStemName(prefix, filename) {
  if (!filename.endsWith('.ogg')) {
    throw new Error(`not an ogg: ${filename}`)
  }
  const stem = filename.slice(0, -4)
  const expected = `${prefix}_`
  if (!stem.startsWith(expected)) {
    throw new Error(`expected prefix ${prefix}_ in ${filename}`)
  }
  const rest = stem.slice(expected.length)
  const cut = rest.indexOf('_')
  if (cut < 0) throw new Error(`no genre in ${filename}`)
  const genre = rest.slice(0, cut)
  const inst = rest.slice(cut + 1)
  if (!genre || !inst) throw new Error(`bad name ${filename}`)
  return { genre, inst, instrument: rest }
}

function probeDuration(path) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
    { encoding: 'utf8' },
  ).trim()
  const duration = Number(out)
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`bad duration for ${path}: ${out}`)
  }
  return duration
}

function compassosFor(duration, bpm, file) {
  const bar = (60 / bpm) * 4
  const bars = duration / bar
  const compassos = Math.round(bars)
  if (compassos < 1) throw new Error(`${file} shorter than one bar`)
  if (Math.abs(bars - compassos) > 0.08) {
    throw new Error(`${file} duration ${duration.toFixed(3)}s is ${bars.toFixed(3)} bars at ${bpm} bpm`)
  }
  return compassos
}

const songs = []
for (const song of SONGS) {
  const dir = join(root, 'public/audio', song.folder)
  const names = (await readdir(dir)).filter((name) => name.endsWith('.ogg')).sort()
  if (names.length === 0) throw new Error(`no oggs in ${dir}`)
  const stems = names.map((file) => {
    const parsed = parseStemName(song.filePrefix, file)
    const duration = probeDuration(join(dir, file))
    return {
      character: characterFor(parsed.genre, parsed.inst),
      instrument: parsed.instrument,
      genre: parsed.genre,
      compassos: compassosFor(duration, song.bpm, file),
      file,
    }
  })
  stems.sort((a, b) => {
    const ca = CHARACTER_ORDER.indexOf(a.character)
    const cb = CHARACTER_ORDER.indexOf(b.character)
    if (ca !== cb) return ca - cb
    return a.instrument.localeCompare(b.instrument)
  })
  songs.push({ ...song, stems })
}

const existing = JSON.parse(await readFile(songsPath, 'utf8'))
const next = { songs }
await writeFile(songsPath, `${JSON.stringify(next, null, 2)}\n`)
const total = songs.reduce((sum, song) => sum + song.stems.length, 0)
console.log(`wrote ${songsPath} (${total} stems, was ${existing.songs.reduce((s, song) => s + song.stems.length, 0)})`)
for (const song of songs) {
  const counts = Object.fromEntries(
    CHARACTER_ORDER.map((id) => [id, song.stems.filter((stem) => stem.character === id).length]).filter(
      ([, n]) => n > 0,
    ),
  )
  console.log(`${song.id}: ${song.stems.length} stems`, counts)
}
