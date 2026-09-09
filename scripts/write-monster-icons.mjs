import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'assets/tray-icons')
const dest = join(root, 'public/icons/monsters')
mkdirSync(dest, { recursive: true })

function destName(name) {
  if (name === 'ICONE-TEEWONG-ATIVO.svg') return 'ICONE_TEEWONG_ATIVO.svg'
  return name
}

const names = readdirSync(source)
if (names.length === 0) {
  throw new Error(`no tray icons in ${source}`)
}

for (const name of names) {
  const target = destName(name)
  if (!target.endsWith('.svg')) continue
  copyFileSync(join(source, name), join(dest, target))
}

const required = [
  'ICONE_BOOGAR.svg',
  'ICONE_BOOGAR_ATIVO.svg',
  'ICONE_CEVAL.svg',
  'ICONE_CEVAL_ATIVO.svg',
  'ICONE_GROMPY.svg',
  'ICONE_GROMPY_ATIVO.svg',
  'ICONE_OHLE.svg',
  'ICONE_OHLE_ATIVO.svg',
  'ICONE_RAFOG.svg',
  'ICONE_RAFOG_ATIVO.svg',
  'ICONE_TEEWONG.svg',
  'ICONE_TEEWONG_ATIVO.svg',
  'ICONE_MONSTRO04.svg',
  'ICONE_MONSTRO04_ATIVO.svg',
  'ICONE_MONSTRO05.svg',
  'ICONE_MONSTRO05_ATIVO.svg',
  'ICONE_MONSTRO07.svg',
  'ICONE_MONSTRO07_ATIVO.svg',
  'LENTE.svg',
]

for (const name of required) {
  const svg = readFileSync(join(dest, name), 'utf8')
  if (!svg.includes('<svg')) {
    throw new Error(`${name} is not an SVG`)
  }
}

console.log('copied original monster icons to', dest)
