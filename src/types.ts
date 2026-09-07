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

export type HeadShape = 'round' | 'tall' | 'wide' | 'box' | 'diamond' | 'oval'

export type Accessory =
  | 'antenna'
  | 'sprout'
  | 'cap'
  | 'star'
  | 'horns'
  | 'unibrow'
  | 'bow'
  | 'mohawk'
  | 'glasses'
  | 'headphones'
  | 'bun'

export interface StemConfig {
  character: CharacterId
  instrument: string
  genre: string
  compassos: number
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
  folder: string
  filePrefix: string
  theme: SongTheme
  stems: StemConfig[]
}

export interface CharacterLook {
  name: string
  bodyColor: string
  accentColor: string
  skinColor: string
  height: number
  belly: number
  headShape: HeadShape
  accessory: Accessory
}

export interface StageInstance {
  id: string
  characterId: CharacterId
  instrument: string
  genre: string
  compassos: number
  audioPaths: string[]
  position: [number, number, number]
  muted: boolean
}

export type DragState =
  | null
  | {
      type: 'spawn'
      characterId: CharacterId
      instrument: string
      clientX: number
      clientY: number
    }
  | {
      type: 'move'
      instanceId: string
      instrument: string
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
