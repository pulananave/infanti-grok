export const INSTRUMENT_IDS = [
  'drums',
  'tambourine',
  'shaker',
  'maracas',
  'triangle',
  'bass',
  'cello',
  'guitar',
  'ukulele',
  'electric_guitar',
  'piano',
  'xylophone',
  'synth',
  'accordion',
  'trumpet',
  'tuba',
  'flute',
  'clarinet',
  'saxophone',
  'harmonica',
  'vocals',
  'dj',
  'agogo',
  'conga',
  'bongo',
  'clave',
  'reco_reco',
  'bombo',
  'caixa',
  'cymbals',
  'trombone',
  'violin',
  'organ',
] as const

export type InstrumentId = (typeof INSTRUMENT_IDS)[number]

export function isInstrumentId(value: string): value is InstrumentId {
  return (INSTRUMENT_IDS as readonly string[]).includes(value)
}

/** Godot `type` strings → 3D held-instrument clay props (balloon uses official SVGs). */
const TYPE_ICONS: Record<string, InstrumentId> = {
  pratos: 'cymbals',
  trombone: 'trombone',
  voz: 'vocals',
  sanfona: 'accordion',
  synthbass: 'bass',
  marimba: 'xylophone',
  bateriapop: 'drums',
  bateriarock: 'drums',
  bateriaeletronica: 'dj',
  bateriaeletronica2: 'dj',
  bateria: 'drums',
  baterialatin: 'drums',
  violao: 'guitar',
  caixa: 'caixa',
  baixoeletrico: 'bass',
  agogo: 'agogo',
  trompete: 'trumpet',
  tuba: 'tuba',
  synth: 'synth',
  baixorock: 'bass',
  guitarrabase: 'guitar',
  guitarrafrase: 'electric_guitar',
  guitararock: 'electric_guitar',
  picolo: 'flute',
  picolo2: 'flute',
  baixoacustico: 'bass',
  conga: 'conga',
  bombo: 'bombo',
  violino: 'violin',
  milkman: 'dj',
  orgao: 'organ',
  rhodes: 'piano',
  shaker: 'shaker',
  recoreco: 'reco_reco',
  pandeirola: 'tambourine',
}

const KIND_RULES: [RegExp, InstrumentId][] = [
  [/^voz_/, 'vocals'],
  [/bateria$/, 'drums'],
  [/baixo$|bass_synth$|synth_bass$/, 'bass'],
  [/violao$/, 'guitar'],
  [/gtr_base$|guitarra_base$/, 'guitar'],
  [/gtr_frase$|gtr_melodia$/, 'electric_guitar'],
  [/trompete$|trumpete$/, 'trumpet'],
  [/trombone$/, 'trombone'],
  [/tuba$/, 'tuba'],
  [/picolo$|piccolo$/, 'flute'],
  [/piano$|rhodes$|clavinote$/, 'piano'],
  [/orgao$/, 'organ'],
  [/marimba$/, 'xylophone'],
  [/sanfona$/, 'accordion'],
  [/violino$/, 'violin'],
  [/agogo$/, 'agogo'],
  [/conga$/, 'conga'],
  [/bongo$/, 'bongo'],
  [/shaker$/, 'shaker'],
  [/pandeirola$/, 'tambourine'],
  [/clave$/, 'clave'],
  [/reco_reco$|recc_reco$/, 'reco_reco'],
  [/bombo$/, 'bombo'],
  [/caixa$/, 'caixa'],
  [/pratos$/, 'cymbals'],
  [/synth/, 'synth'],
  [/loop$|milkman|milkyman|funky_break|techno|acid/, 'dj'],
]

function normalizeTypeKey(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase()
}

/** Map a Godot type or stem id to a tray/stage icon. */
export function instrumentKind(instrument: string): InstrumentId | null {
  const fromType = TYPE_ICONS[normalizeTypeKey(instrument)]
  if (fromType) return fromType
  if (isInstrumentId(instrument)) return instrument
  for (const [pattern, kind] of KIND_RULES) {
    if (pattern.test(instrument)) return kind
  }
  return null
}
