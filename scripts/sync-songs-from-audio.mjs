import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const root = join(import.meta.dirname, '..')
const songsPath = join(root, 'src/config/songs.json')
const configsDir = join(root, 'src/config/audio-configs')
const audioRoot = join(root, 'public/audio')

const CONFIG_SONGS = [
  {
    cfg: 'dona-aranha.cfg',
    id: 'aranha',
    aliases: ['dona_aranha'],
    title: 'Dona Aranha',
    folder: 'infanti_dona_aranha',
    filePrefix: 'aranha',
  },
  {
    cfg: 'a-canoa-virou.cfg',
    id: 'canoa',
    aliases: [],
    title: 'A Canoa Virou',
    folder: 'infanti_canoa_virou',
    filePrefix: 'canoa',
  },
  {
    cfg: 'coelho-da-pascoa.cfg',
    id: 'coelho',
    aliases: [],
    title: 'Coelhinho da Páscoa',
    folder: 'infanti_coelho',
    filePrefix: 'coelho',
  },
  {
    cfg: 'pintinho-amarelinho.cfg',
    id: 'pintinho',
    aliases: [],
    title: 'Pintinho Amarelinho',
    folder: 'infanti_pintinho',
    filePrefix: 'pintinho',
  },
  {
    cfg: 'o-sapo.cfg',
    id: 'sapo',
    aliases: [],
    title: 'O Sapo Não Lava o Pé',
    folder: 'infanti_sapo_nao_lava',
    filePrefix: 'sapo',
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
  'gerarda',
]

const TOKEN_ALIASES = {
  trompete: ['trumpete'],
  trumpete: ['trompete'],
  picolo: ['piccolo'],
  piccolo: ['picolo'],
  marcial: ['mar'],
  mar: ['marcial'],
}

function tokens(name) {
  return name
    .replace(/\.ogg$/i, '')
    .toLowerCase()
    .split(/[\s_\-]+/)
    .filter(Boolean)
}

function tokenEq(a, b) {
  if (a === b) return true
  return TOKEN_ALIASES[a]?.includes(b) || TOKEN_ALIASES[b]?.includes(a) || false
}

function filenameVariants(audio) {
  const base = audio.trim()
  return new Set([
    base,
    base.replace(/\s+/g, '_'),
    base.replace(/\s+/g, '-'),
    base.replace(/-/g, '_'),
    base.replace(/_/g, '-'),
    base.replace(/[\s-]+/g, '_'),
    base.replace(/[\s_]+/g, '-'),
  ])
}

function fuzzyScore(want, have) {
  if (want.length === 0 || have.length === 0) return -1
  if (want[0] !== have[0]) return -1
  if (!tokenEq(want[want.length - 1], have[have.length - 1])) return -1
  let score = 4
  if (want[want.length - 1] === have[have.length - 1]) score += 2
  const wantMid = want.slice(1, -1)
  const haveMid = have.slice(1, -1)
  for (const token of wantMid) {
    if (haveMid.some((item) => tokenEq(token, item))) score += 3
    else score -= 1
  }
  score -= Math.abs(want.length - have.length)
  return score
}

function resolveAudioFile(audio, files) {
  const fileSet = new Set(files)
  for (const variant of filenameVariants(audio)) {
    if (fileSet.has(variant)) return variant
  }
  const want = tokens(audio)
  let best = null
  let bestScore = 0
  let ties = []
  for (const file of files) {
    const score = fuzzyScore(want, tokens(file))
    if (score > bestScore) {
      best = file
      bestScore = score
      ties = [file]
    } else if (score === bestScore && score > 0) {
      ties.push(file)
    }
  }
  if (!best || bestScore < 4) {
    throw new Error(`no public stem for "${audio}"`)
  }
  if (ties.length > 1) {
    throw new Error(`ambiguous public stem for "${audio}": ${ties.join(', ')}`)
  }
  return best
}

function extractBalanced(text, openIndex) {
  let depth = 0
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return text.slice(openIndex, i + 1)
    }
  }
  throw new Error('unbalanced { } in config')
}

function parseGodotJson(objectText) {
  let json = objectText
  let prev
  do {
    prev = json
    json = json.replace(/,(\s*[}\]])/g, '$1')
  } while (json !== prev)
  return JSON.parse(json)
}

function parseCfg(text) {
  const bars = Number(text.match(/bars\s*=\s*(\d+)/i)?.[1])
  const bpm = Number(text.match(/music_bpm\s*=\s*(\d+)/i)?.[1])
  if (!Number.isFinite(bars) || !Number.isFinite(bpm)) {
    throw new Error('missing bars or music_bpm')
  }
  const marker = text.search(/characters\s*=\s*\{/i)
  if (marker < 0) throw new Error('missing characters block')
  const open = text.indexOf('{', marker)
  const characters = parseGodotJson(extractBalanced(text, open))
  return { bars, bpm, characters }
}

function correctType(audio, type) {
  const haystack = audio.toLowerCase()
  if (/\bvoz\b/.test(haystack.replace(/[^a-z0-9]+/g, ' ')) && type === 'Shaker') {
    return 'Voz'
  }
  return type
}

function instrumentIdFromFile(filePrefix, file) {
  const stem = file.replace(/\.ogg$/i, '')
  const expected = `${filePrefix}_`
  if (!stem.startsWith(expected)) {
    throw new Error(`resolved file ${file} does not start with ${expected}`)
  }
  return stem.slice(expected.length)
}

function characterIdFromName(name) {
  const id = name.trim().toLowerCase()
  if (!CHARACTER_ORDER.includes(id)) {
    throw new Error(`unknown character "${name}"`)
  }
  return id
}

const existing = JSON.parse(await readFile(songsPath, 'utf8'))
const themeById = Object.fromEntries(existing.songs.map((song) => [song.id, song.theme]))

const songs = []
for (const meta of CONFIG_SONGS) {
  const cfgText = await readFile(join(configsDir, meta.cfg), 'utf8')
  const parsed = parseCfg(cfgText)
  const audioDir = join(audioRoot, meta.folder)
  const files = (await readdir(audioDir)).filter((name) => name.endsWith('.ogg'))
  const stems = []
  const instrumentUseLimit = {}

  for (const [characterName, body] of Object.entries(parsed.characters)) {
    const character = characterIdFromName(characterName)
    if (body.instrument_use_limit != null) {
      instrumentUseLimit[character] = Number(body.instrument_use_limit)
    }
    const instruments = body.instruments ?? []
    for (const item of instruments) {
      const file = resolveAudioFile(item.audio, files)
      const type = correctType(item.audio, item.type)
      const stem = {
        character,
        instrument: instrumentIdFromFile(meta.filePrefix, file),
        type,
        genre: instrumentIdFromFile(meta.filePrefix, file).split('_')[0],
        compassos: Number(item.bars),
        file,
      }
      if (item.min_volume_db != null) stem.minVolumeDb = Number(item.min_volume_db)
      if (item.max_volume_db != null) stem.maxVolumeDb = Number(item.max_volume_db)
      if (!Number.isFinite(stem.compassos) || stem.compassos < 1) {
        throw new Error(`bad bars for ${meta.id}/${item.audio}`)
      }
      stems.push(stem)
    }
  }

  stems.sort((a, b) => {
    const ca = CHARACTER_ORDER.indexOf(a.character)
    const cb = CHARACTER_ORDER.indexOf(b.character)
    if (ca !== cb) return ca - cb
    return a.instrument.localeCompare(b.instrument)
  })

  const song = {
    id: meta.id,
    aliases: meta.aliases,
    title: meta.title,
    bpm: parsed.bpm,
    bars: parsed.bars,
    folder: meta.folder,
    filePrefix: meta.filePrefix,
    theme: themeById[meta.id],
    stems,
  }
  if (Object.keys(instrumentUseLimit).length > 0) {
    song.instrumentUseLimit = instrumentUseLimit
  }
  songs.push(song)
}

const albums = existing.albums ?? [
  {
    id: 'cancioneiro-popular',
    name: 'Cancioneiro Popular',
    songIds: songs.map((song) => song.id),
  },
]
await writeFile(songsPath, `${JSON.stringify({ albums, songs }, null, 2)}\n`)

for (const song of songs) {
  const counts = Object.fromEntries(
    CHARACTER_ORDER.map((id) => [id, song.stems.filter((stem) => stem.character === id).length]).filter(
      ([, n]) => n > 0,
    ),
  )
  const limits = song.instrumentUseLimit
    ? ` limits=${JSON.stringify(song.instrumentUseLimit)}`
    : ''
  console.log(`${song.id}: ${song.stems.length} stems @ ${song.bpm} bpm / ${song.bars} bars`, counts, limits)
}
console.log(
  `wrote ${songsPath} (${songs.reduce((sum, song) => sum + song.stems.length, 0)} stems from ${CONFIG_SONGS.map((item) => basename(item.cfg)).join(', ')})`,
)
