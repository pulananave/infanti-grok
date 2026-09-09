import type { CharacterId, SongConfig, StemConfig } from '../types'

/** Official Godot Infanti SVGs served from `public/instrument_icons/`. */
export const INSTRUMENT_ICON_DIR = '/instrument_icons'

const TYPE_FILES: Record<string, string> = {
  agogo: 'AGOGO.svg',
  baixoacustico: 'BAIXO-ACUSTICO.svg',
  baixoeletrico: 'BAIXO_ELETRICO.svg',
  baixorock: 'BAIXO_ROCK.svg',
  bateria: 'BATERIA.svg',
  bateriapop: 'BATERIA_POP.svg',
  baterialatin: 'BATERIA_LATIN.svg',
  bateriaeletronica2: 'BATERIA_ELETRONICA2.svg',
  bombo: 'BOMBO.svg',
  caixa: 'CAIXA.svg',
  conga: 'CONGA.svg',
  guitarrabase: 'GUITARRA_BASE.svg',
  guitarrafrase: 'GUITARRA_FRASE.svg',
  guitarrarock: 'GUITARRA_ROCK.svg',
  marimba: 'MARIMBA.svg',
  orgao: 'ORGAO.svg',
  pandeirola: 'PANDEIROLA.svg',
  picolo: 'PICOLO.svg',
  picolo2: 'PICOLO2.svg',
  pratos: 'PRATOS.svg',
  recoreco: 'RECORECO.svg',
  rhodes: 'RHODES.svg',
  sanfona: 'SANFONA.svg',
  shaker: 'SHAKER.svg',
  synth: 'SYNTH.svg',
  synthbass: 'SYNTH_BASS.svg',
  trombone: 'TROMBONE.svg',
  trompete: 'TROMPETE.svg',
  tuba: 'TUBA.svg',
  violao: 'VIOLAO.svg',
  violino: 'VIOLINO.svg',
  voz: 'MICROFONE.svg',
  /** Exact rock kit — BATERIA_ROCK.svg is in public/instrument_icons/. */
  bateriarock: 'BATERIA_ROCK.svg',
  bateriaeletronica: 'BATERIA_ELETRONICA.svg',
  /** Milkman / clock loops — Relógio icon (edm milkman stems for Rafog). */
  milkman: 'RELOGIO.svg',
}

const EDRUM_FILES = ['BATERIA_ELETRONICA.svg', 'BATERIA_ELETRONICA2.svg', 'BATERIA_ELETRONICA_3.svg'] as const

function normalizeTypeKey(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase()
}

function isEdrumType(type: string): boolean {
  const key = normalizeTypeKey(type)
  return key === 'bateriaeletronica' || key === 'bateriaeletronica2'
}

export function preferredInstrumentIconFile(type: string): string {
  return TYPE_FILES[normalizeTypeKey(type)] ?? 'BATERIA.svg'
}

export function stemIconKey(characterId: string, instrument: string): string {
  return `${characterId}::${instrument}`
}

/**
 * Per-song icon filenames. Electronic-drum stems that would share one file
 * get distinct variants (ELETRONICA / ELETRONICA2 / ELETRONICA_3) in stem order.
 */
export function songInstrumentIconMap(song: SongConfig): Map<string, string> {
  const files = new Map<string, string>()
  const edrums: StemConfig[] = []

  for (const stem of song.stems) {
    if (isEdrumType(stem.type)) {
      edrums.push(stem)
      continue
    }
    files.set(stemIconKey(stem.character, stem.instrument), preferredInstrumentIconFile(stem.type))
  }

  const taken = new Set<string>()
  edrums.forEach((stem, index) => {
    let file = preferredInstrumentIconFile(stem.type)
    if (taken.has(file)) {
      file = EDRUM_FILES.find((name) => !taken.has(name)) ?? EDRUM_FILES[index % EDRUM_FILES.length]
    }
    taken.add(file)
    files.set(stemIconKey(stem.character, stem.instrument), file)
  })

  return files
}

export function instrumentIconSrc(
  type: string,
  song?: SongConfig | null,
  stem?: { character: CharacterId | string; instrument: string },
): string {
  if (song && stem) {
    const file = songInstrumentIconMap(song).get(stemIconKey(stem.character, stem.instrument))
    if (file) return `${INSTRUMENT_ICON_DIR}/${file}`
  }
  return `${INSTRUMENT_ICON_DIR}/${preferredInstrumentIconFile(type)}`
}
