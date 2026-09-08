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

/** Map a stem instrument id (usually `{genre}_{mega-token}`) to a tray/stage icon. */
export function instrumentKind(instrument: string): InstrumentId | null {
  if (isInstrumentId(instrument)) return instrument
  for (const [pattern, kind] of KIND_RULES) {
    if (pattern.test(instrument)) return kind
  }
  return null
}
