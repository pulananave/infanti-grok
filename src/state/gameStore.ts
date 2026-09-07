import { create } from 'zustand'
import { audioEngine } from '../audio/AudioEngine'
import {
  findStem,
  getCombos,
  getSong,
  songCharacters,
  stemAudioCandidates,
} from '../config/loadConfig'
import type { CharacterId, ComboShape, DragState, PrizeEvent, SongId, StageInstance } from '../types'
import {
  clampToFloor,
  isInRemoveZone,
  isOnStageFloor,
  isOverBlockingUi,
  isOverTray,
  projectToFloor,
  volumeForPosition,
} from './sceneBridge'

interface GameState {
  screen: 'menu' | 'stage'
  songId: SongId | null
  instances: StageInstance[]
  balloonCharacterId: CharacterId | null
  drag: DragState
  awarded: ComboShape[]
  prize: PrizeEvent | null
  lastInteractAt: number
  selectSong: (id: SongId) => Promise<void>
  exitToMenu: () => void
  toggleBalloon: (characterId: CharacterId) => void
  closeBalloon: () => void
  beginSpawnDrag: (characterId: CharacterId, instrument: string, x: number, y: number) => void
  beginMoveDrag: (instanceId: string, instrument: string, x: number, y: number) => void
  updateDrag: (x: number, y: number) => void
  endDrag: (x: number, y: number) => Promise<void>
  updateInstancePosition: (id: string, position: [number, number, number]) => void
  toggleMute: (id: string) => void
  removeInstance: (id: string) => void
  dismissPrize: () => void
  usedInstrumentsFor: (characterId: CharacterId) => string[]
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function refreshAwards(instances: StageInstance[], songId: SongId | null, already: ComboShape[]) {
  if (!songId) return { awarded: already, prize: null as PrizeEvent | null }
  const onStage = new Set(instances.map((item) => item.instrument))
  const combos = getCombos(songId)
  const nextAwarded = [...already]
  let prize: PrizeEvent | null = null
  for (const shape of Object.keys(combos) as ComboShape[]) {
    const needed = combos[shape] ?? []
    const complete = needed.length === 4 && needed.every((instrument) => onStage.has(instrument))
    if (complete && !nextAwarded.includes(shape)) {
      nextAwarded.push(shape)
      prize = { shape, id: newId() }
    }
  }
  return { awarded: nextAwarded, prize }
}

export const useGame = create<GameState>((set, get) => ({
  screen: 'menu',
  songId: null,
  instances: [],
  balloonCharacterId: null,
  drag: null,
  awarded: [],
  prize: null,
  lastInteractAt: 0,

  selectSong: async (id) => {
    const song = getSong(id)
    if (!song) return
    audioEngine.stopAndReset()
    audioEngine.setBpm(song.bpm)
    await audioEngine.ensureContext()
    set({
      screen: 'stage',
      songId: song.id,
      instances: [],
      balloonCharacterId: null,
      drag: null,
      awarded: [],
      prize: null,
      lastInteractAt: 0,
    })
  },

  exitToMenu: () => {
    audioEngine.stopAndReset()
    set({
      screen: 'menu',
      songId: null,
      instances: [],
      balloonCharacterId: null,
      drag: null,
      awarded: [],
      prize: null,
    })
  },

  toggleBalloon: (characterId) => {
    set({
      balloonCharacterId: get().balloonCharacterId === characterId ? null : characterId,
    })
  },

  closeBalloon: () => set({ balloonCharacterId: null }),

  beginSpawnDrag: (characterId, instrument, x, y) => {
    set({
      drag: { type: 'spawn', characterId, instrument, clientX: x, clientY: y },
    })
  },

  beginMoveDrag: (instanceId, instrument, x, y) => {
    set({
      drag: {
        type: 'move',
        instanceId,
        instrument,
        clientX: x,
        clientY: y,
        startX: x,
        startY: y,
        moved: false,
      },
    })
  },

  updateDrag: (x, y) => {
    const drag = get().drag
    if (!drag) return
    if (drag.type === 'move') {
      const moved = drag.moved || Math.hypot(x - drag.startX, y - drag.startY) > 8
      if (moved && !isInRemoveZone(x, y)) {
        const hit = projectToFloor(x, y)
        if (hit) {
          const next = clampToFloor(hit)
          get().updateInstancePosition(drag.instanceId, [next.x, 0, next.z])
        }
      }
      set({ drag: { ...drag, clientX: x, clientY: y, moved } })
      return
    }
    set({ drag: { ...drag, clientX: x, clientY: y } })
  },

  endDrag: async (x, y) => {
    const drag = get().drag
    set({ drag: null, lastInteractAt: Date.now() })
    if (!drag) return

    if (drag.type === 'move') {
      if (!drag.moved) {
        get().toggleMute(drag.instanceId)
        return
      }
      if (isInRemoveZone(x, y)) {
        get().removeInstance(drag.instanceId)
      }
      return
    }

    if (isOverBlockingUi(x, y) || isOverTray(x, y)) return

    const hit = projectToFloor(x, y)
    if (!hit || !isOnStageFloor(hit)) return

    const { songId, instances } = get()
    const song = getSong(songId)
    if (!song) return

    const alreadyUsed = instances.some(
      (item) => item.characterId === drag.characterId && item.instrument === drag.instrument,
    )
    if (alreadyUsed) return

    const stem = findStem(song, drag.characterId, drag.instrument)
    if (!stem) return

    const placed = clampToFloor(hit)
    const id = newId()
    const instance: StageInstance = {
      id,
      characterId: drag.characterId,
      instrument: stem.instrument,
      genre: stem.genre,
      compassos: stem.compassos,
      audioPaths: stemAudioCandidates(song, stem),
      position: [placed.x, 0, placed.z],
      muted: false,
    }

    const nextInstances = [...instances, instance]
    const awards = refreshAwards(nextInstances, song.id, get().awarded)
    set({
      instances: nextInstances,
      awarded: awards.awarded,
      prize: awards.prize ?? get().prize,
    })

    await audioEngine.addStem(
      id,
      instance.audioPaths,
      {
        compassos: instance.compassos,
        instrument: instance.instrument,
        genre: instance.genre,
      },
      volumeForPosition(placed),
    )
  },

  updateInstancePosition: (id, position) => {
    const instances = get().instances.map((item) =>
      item.id === id ? { ...item, position } : item,
    )
    set({ instances })
    const current = instances.find((item) => item.id === id)
    if (!current) return
    audioEngine.setGain(id, current.muted ? 0 : volumeForPosition(position))
  },

  toggleMute: (id) => {
    const instances = get().instances.map((item) =>
      item.id === id ? { ...item, muted: !item.muted } : item,
    )
    set({ instances })
    const current = instances.find((item) => item.id === id)
    if (!current) return
    audioEngine.setGain(id, current.muted ? 0 : volumeForPosition(current.position))
  },

  removeInstance: (id) => {
    audioEngine.removeStem(id)
    const instances = get().instances.filter((item) => item.id !== id)
    set({ instances })
  },

  dismissPrize: () => set({ prize: null }),

  usedInstrumentsFor: (characterId) =>
    get()
      .instances.filter((item) => item.characterId === characterId)
      .map((item) => item.instrument),
}))

export function availableInstruments(characterId: CharacterId) {
  const { songId, instances } = useGame.getState()
  const song = getSong(songId)
  if (!song) return []
  const used = new Set(
    instances.filter((item) => item.characterId === characterId).map((item) => item.instrument),
  )
  return song.stems
    .filter((stem) => stem.character === characterId && !used.has(stem.instrument))
    .map((stem) => stem.instrument)
}

export function trayCharacterIds(): CharacterId[] {
  const song = getSong(useGame.getState().songId)
  return song ? songCharacters(song) : []
}
