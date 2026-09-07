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
] as const

export type InstrumentId = (typeof INSTRUMENT_IDS)[number]

export function isInstrumentId(value: string): value is InstrumentId {
  return (INSTRUMENT_IDS as readonly string[]).includes(value)
}
