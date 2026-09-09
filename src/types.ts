export type SongId = 'aranha' | 'canoa' | 'coelho' | 'pintinho' | 'sapo'

export type CharacterId =
  | 'boogar'
  | 'ceval'
  | 'dan'
  | 'esper'
  | 'gobu'
  | 'grompy'
  | 'ohle'
  | 'rafog'
  | 'teewong'
  | 'zoem'
  | 'gerarda'

export type ComboShape = 'circle' | 'square' | 'triangle'

export type BodyForm = 'egg' | 'pear' | 'sphere' | 'onion' | 'bean' | 'scurve' | 'wide'

export type LimbStyle = 'stubby' | 'thick' | 'spindly' | 'wavy' | 'longThin'

export type EyeStyle = 'dot' | 'largeWhite' | 'cyclops' | 'stalk' | 'yellow'

export type MouthStyle = 'line' | 'smile' | 'twoTeeth' | 'threeTeeth' | 'fourTeeth' | 'buckTeeth' | 'bigLips' | 'oneTooth'

export type BrowStyle = 'none' | 'unibrow' | 'blocks' | 'thin'

export type TailStyle = 'none' | 'spiral' | 'ball' | 'scurve'

export type LookFeature =
  | 'bearEars'
  | 'bunnyEars'
  | 'nubEars'
  | 'bullHorns'
  | 'onionSprout'
  | 'leafSprout'
  | 'hairTuft'
  | 'flameCrest'
  | 'spiralAntenna'
  | 'dorsalSpikes'
  | 'trunk'
  | 'cheekDashes'
  | 'bodySpikes'
  | 'onionRidges'
  | 'goldSpots'
  | 'bellySeam'
  | 'redNose'
  | 'redTips'
  | 'claws3'
  | 'claws4'
  | 'pawPads'
  | 'backBumps'

export interface StemConfig {
  character: CharacterId
  /** Unique stem id from the MEGA filename (`{genre}_{rest}`). */
  instrument: string
  /** Godot `type` — balloon / held-instrument identity. */
  type: string
  genre: string
  compassos: number
  /** Exact filename under `public/audio/<folder>/`. Required for MEGA stems. */
  file: string
  minVolumeDb?: number
  maxVolumeDb?: number
}

export interface SongTheme {
  sky: string
  horizon: string
  floor: string
  floorAccent: string
  fog: string
  accent: string
}

export interface SongConfig {
  id: SongId
  aliases: string[]
  title: string
  bpm: number
  /** Song loop length in bars (4/4). Per-stem `compassos` still drives the scheduler. */
  bars: number
  folder: string
  filePrefix: string
  theme: SongTheme
  stems: StemConfig[]
  instrumentUseLimit?: Partial<Record<CharacterId, number>>
}

export interface CharacterLook {
  name: string
  bodyColor: string
  accentColor: string
  skinColor: string
  limbColor: string
  eyeColor: string
  scleraColor?: string
  irisColor?: string
  mouthColor?: string
  toothColor?: string
  clawColor?: string
  featureColor?: string
  height: number
  belly: number
  bodyForm: BodyForm
  limbStyle: LimbStyle
  armCount: 2 | 4
  eyeCount: 1 | 2
  eyeStyle: EyeStyle
  eyeSpacing: number
  eyeSize: number
  eyeY: number
  mouthStyle: MouthStyle
  browStyle: BrowStyle
  features: LookFeature[]
  tail: TailStyle
  monobody: boolean
  legLength?: number
  armLength?: number
}

export interface StageInstance {
  id: string
  characterId: CharacterId
  instrument: string
  type: string
  genre: string
  compassos: number
  audioPaths: string[]
  minVolumeDb?: number
  maxVolumeDb?: number
  position: [number, number, number]
  muted: boolean
}

export type DragState =
  | null
  | {
      type: 'spawn'
      characterId: CharacterId
      instrument: string
      iconType: string
      clientX: number
      clientY: number
    }
  | {
      type: 'move'
      instanceId: string
      instrument: string
      iconType: string
      clientX: number
      clientY: number
      startX: number
      startY: number
      moved: boolean
    }

export interface PrizeEvent {
  shape: ComboShape
  id: string
}
