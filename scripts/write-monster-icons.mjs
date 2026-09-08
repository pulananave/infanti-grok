import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/icons/monsters')
mkdirSync(dir, { recursive: true })

const INK = '#3b0b32'
const WHITE = '#e7e7e7'
const PINK = '#ff637a'
const SHADOW = '#663156'
const TONGUE = '#f08370'

function chip(body, inner, { idle = false, id = 'face' } = {}) {
  const fade = idle ? ' opacity="0.82"' : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 105">
  <rect x="5" y="5" width="100" height="100" rx="15" fill="${SHADOW}" opacity="0.2"/>
  <rect width="100" height="100" rx="15" fill="${body}"/>
  <g id="${id}"${fade}>
${inner}
  </g>
</svg>
`
}

function write(name, body, inner) {
  writeFileSync(join(dir, `${name}.svg`), chip(body, inner, { idle: true, id: name.toLowerCase() }))
  writeFileSync(join(dir, `${name}_ATIVO.svg`), chip(body, inner, { idle: false, id: `${name.toLowerCase()}-ativo` }))
}

write(
  'ICONE_CEVAL',
  '#f3a07c',
  `    <circle cx="50" cy="42" r="16" fill="${WHITE}"/>
    <circle cx="50" cy="42" r="9.5" fill="${INK}"/>
    <path d="M36 68c6 10 22 10 28 0" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/>`,
)

write(
  'ICONE_GROMPY',
  '#f08370',
  `    <circle cx="34" cy="34" r="3.4" fill="${INK}"/>
    <circle cx="66" cy="34" r="3.4" fill="${INK}"/>
    <path d="M24 28c6 2 12-2 16-8" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M76 28c-6 2-12-2-16-8" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="50" cy="64" rx="22" ry="16" fill="${INK}"/>
    <ellipse cx="40" cy="54" rx="4.2" ry="5.4" fill="${WHITE}"/>
    <ellipse cx="48" cy="53" rx="4.2" ry="5.6" fill="${WHITE}"/>
    <ellipse cx="56" cy="53" rx="4" ry="5.4" fill="${WHITE}"/>
    <ellipse cx="64" cy="54" rx="4.2" ry="5.4" fill="${WHITE}"/>
    <path d="M38 74a14 10 0 0 0 24 0" fill="${TONGUE}"/>`,
)

write(
  'ICONE_OHLE',
  '#7a9e9a',
  `    <circle cx="38" cy="40" r="3.2" fill="${INK}"/>
    <circle cx="62" cy="40" r="3.2" fill="${INK}"/>
    <path d="M30 32c5 1 9-3 11-7" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M70 32c-5 1-9-3-11-7" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M22 62c10 16 46 16 56 0" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="34" cy="66" rx="5" ry="6.2" fill="${WHITE}"/>
    <ellipse cx="44" cy="69" rx="5.4" ry="6.4" fill="${WHITE}"/>
    <ellipse cx="58" cy="69" rx="7.2" ry="6.2" fill="${WHITE}"/>
    <ellipse cx="69" cy="66" rx="4.6" ry="5.8" fill="${WHITE}"/>`,
)

write(
  'ICONE_RAFOG',
  '#f08370',
  `    <circle cx="34" cy="40" r="10" fill="${WHITE}"/>
    <circle cx="66" cy="40" r="10" fill="${WHITE}"/>
    <circle cx="35" cy="41" r="4.4" fill="${INK}"/>
    <circle cx="67" cy="41" r="4.4" fill="${INK}"/>
    <ellipse cx="50" cy="68" rx="16" ry="12" fill="${INK}"/>
    <path d="M40 74a12 8 0 0 0 20 0" fill="${PINK}"/>`,
)

write(
  'ICONE_TEEWONG',
  '#4a2a48',
  `    <path d="M26 40a12 12 0 0 1 20 0" fill="${WHITE}"/>
    <path d="M54 40a12 12 0 0 1 20 0" fill="${WHITE}"/>
    <circle cx="38" cy="42" r="3.1" fill="${INK}"/>
    <circle cx="62" cy="42" r="3.1" fill="${INK}"/>
    <path d="M32 68c10-10 26-10 36 0" fill="none" stroke="#f3b39a" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="38" cy="70" rx="3.4" ry="4" fill="${WHITE}"/>`,
)

write(
  'ICONE_MONSTRO04',
  '#f08a3c',
  `    <rect x="24" y="24" width="16" height="22" rx="6" transform="rotate(-8 32 35)" fill="${INK}"/>
    <rect x="60" y="24" width="16" height="22" rx="6" transform="rotate(8 68 35)" fill="${INK}"/>
    <circle cx="46" cy="46" r="1.6" fill="${INK}"/>
    <circle cx="54" cy="46" r="1.6" fill="${INK}"/>
    <path d="M22 70c6-12 18-16 28-16s22 4 28 16c-4 10-16 16-28 16S26 80 22 70z" fill="${PINK}"/>
    <path d="M30 70h40" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M24 62c6 8 8 16 6 22" fill="none" stroke="#d46520" stroke-width="3" stroke-linecap="round"/>
    <path d="M76 62c-6 8-8 16-6 22" fill="none" stroke="#d46520" stroke-width="3" stroke-linecap="round"/>`,
)

write(
  'ICONE_MONSTRO05',
  '#86a39b',
  `    <path d="M44 14c2 8 0 12-2 16" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M50 12c1 9 0 14 0 18" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M56 14c-2 8 0 12 2 16" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="32" cy="38" r="3.3" fill="${INK}"/>
    <circle cx="68" cy="38" r="3.3" fill="${INK}"/>
    <rect x="43" y="36" width="14" height="22" rx="7" fill="${PINK}"/>
    <path d="M22 62c4 18 52 18 56 0-6 14-50 14-56 0z" fill="${INK}"/>
    <rect x="36" y="58" width="12" height="10" rx="3" fill="${WHITE}"/>
    <rect x="52" y="58" width="9" height="11" rx="3" transform="rotate(8 56 64)" fill="${WHITE}"/>
    <path d="M36 78a16 10 0 0 0 28 0" fill="${PINK}"/>`,
)

write(
  'ICONE_MONSTRO07',
  '#f2d46b',
  `    <polygon points="22,18 26,28 16,24" fill="#ffe56a" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="36" cy="40" r="9.5" fill="${WHITE}"/>
    <circle cx="64" cy="40" r="9.5" fill="${WHITE}"/>
    <circle cx="37" cy="41" r="3.6" fill="${INK}"/>
    <circle cx="65" cy="41" r="3.6" fill="${INK}"/>
    <path d="M44 58l6-4 6 4" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M38 70c8 7 16 7 24 0" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`,
)

const boogar = readFileSync(join(dir, 'ICONE_BOOGAR.svg'), 'utf8')
const boogarAtivo = boogar
  .replace('id="icones_mosntros_apagados"', 'id="icones_mosntros_ativos"')
  .replace('id="clip-path"', 'id="clip-path-boogar-ativo"')
  .replace('url(#clip-path)', 'url(#clip-path-boogar-ativo)')
  .replace('#f08370', '#f38b78')
writeFileSync(join(dir, 'ICONE_BOOGAR_ATIVO.svg'), boogarAtivo)

console.log('wrote monster icons to', dir)
