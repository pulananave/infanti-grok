import { access, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const songsFile = JSON.parse(await import('node:fs/promises').then((fs) => fs.readFile(join(root, 'src/config/songs.json'), 'utf8')))

const referenced = new Set()
let missing = 0
for (const song of songsFile.songs) {
  for (const stem of song.stems) {
    if (!stem.file) {
      console.error(`stem ${song.id}/${stem.instrument} has no file`)
      missing += 1
      continue
    }
    const rel = `public/audio/${song.folder}/${stem.file}`
    referenced.add(`${song.folder}/${stem.file}`)
    try {
      await access(join(root, rel))
    } catch {
      console.error(`missing ${rel}`)
      missing += 1
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
      console.error(`unreferenced ${key}`)
      extras += 1
    }
  }
}

const combosFile = JSON.parse(
  await import('node:fs/promises').then((fs) => fs.readFile(join(root, 'src/config/combos.json'), 'utf8')),
)
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

if (missing || extras || comboErrors) {
  console.error(`audio check failed: missing=${missing} unreferenced=${extras} combos=${comboErrors}`)
  process.exit(1)
}
console.log(`audio check ok: ${referenced.size} stems, ${oggs} oggs on disk`)
