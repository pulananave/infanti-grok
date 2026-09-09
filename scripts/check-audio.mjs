import { access, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const songsFile = JSON.parse(await readFile(join(root, 'src/config/songs.json'), 'utf8'))

const referenced = new Set()
let missing = 0
let configErrors = 0
for (const song of songsFile.songs) {
  if (!Number.isFinite(song.bars) || song.bars < 1) {
    console.error(`song ${song.id} missing bars`)
    configErrors += 1
  }
  const seen = new Set()
  for (const stem of song.stems) {
    if (!stem.file) {
      console.error(`stem ${song.id}/${stem.instrument} has no file`)
      missing += 1
      continue
    }
    if (!stem.type) {
      console.error(`stem ${song.id}/${stem.instrument} has no type`)
      configErrors += 1
    }
    const key = `${stem.character}:${stem.instrument}`
    if (seen.has(key)) {
      console.error(`duplicate stem ${song.id}/${key}`)
      configErrors += 1
    }
    seen.add(key)
    const rel = `public/audio/${song.folder}/${stem.file}`
    referenced.add(`${song.folder}/${stem.file}`)
    try {
      await access(join(root, rel))
    } catch {
      console.error(`missing ${rel}`)
      missing += 1
    }
  }
  for (const [character, limit] of Object.entries(song.instrumentUseLimit ?? {})) {
    const count = song.stems.filter((stem) => stem.character === character).length
    if (count === 0) {
      console.error(`instrumentUseLimit on ${song.id}/${character} but character has no stems`)
      configErrors += 1
    }
    if (!Number.isFinite(Number(limit)) || Number(limit) < 1) {
      console.error(`bad instrumentUseLimit ${song.id}/${character}=${limit}`)
      configErrors += 1
    }
  }
}

const audioRoot = join(root, 'public/audio')
const folders = (await readdir(audioRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory())
let extras = 0
let oggs = 0
for (const folder of folders) {
  const names = (await readdir(join(audioRoot, folder.name))).filter((name) => name.endsWith('.ogg'))
  oggs += names.length
  for (const name of names) {
    const key = `${folder.name}/${name}`
    if (!referenced.has(key)) {
      extras += 1
      console.warn(`unreferenced (not in Godot cfg) ${key}`)
    }
  }
}

const combosFile = JSON.parse(await readFile(join(root, 'src/config/combos.json'), 'utf8'))
let comboErrors = 0
for (const [songId, shapes] of Object.entries(combosFile)) {
  const song = songsFile.songs.find((item) => item.id === songId)
  const ids = new Set((song?.stems ?? []).map((stem) => stem.instrument))
  for (const [shape, instruments] of Object.entries(shapes)) {
    for (const instrument of instruments) {
      if (!ids.has(instrument)) {
        console.error(`combo ${songId}.${shape} references missing ${instrument}`)
        comboErrors += 1
      }
    }
  }
}

if (missing || comboErrors || configErrors) {
  console.error(
    `audio check failed: missing=${missing} unreferenced=${extras} combos=${comboErrors} config=${configErrors}`,
  )
  process.exit(1)
}
console.log(
  `audio check ok: ${referenced.size} stems from configs, ${oggs} oggs on disk, ${extras} extra files not offered`,
)
