import spriteMapData from './spriteMap.json'
import { instrumentKind } from './instruments'
import type { CharacterId } from '../types'

export const SPRITE_SHEETS_BASE = '/runtime-2d/spritesheets'
export const INSTRUMENT_ICONS_BASE = '/runtime-2d/instruments'
export const REFERENCE_BPM = 120
export const FRAMES_PER_SECOND_AT_REFERENCE = 20

export interface InstrumentBinding {
  sheet: string
  icon?: string
}

export interface CharacterSpriteConfig {
  fallback?: string | null
  note?: string
  instruments?: Record<string, InstrumentBinding>
  tokens?: Record<string, string>
  genreSheets?: Record<string, Record<string, string>>
}

export interface SpriteMapFile {
  docs: {
    fps: string
    addSheet: string[]
  }
  sheetFiles: Record<string, string>
  icons: Record<string, string>
  iconTokens: Record<string, string>
  kindIcons: Record<string, string>
  genreIcons: Record<string, Record<string, string>>
  characters: Record<string, CharacterSpriteConfig>
}

export const SPRITE_MAP = spriteMapData as SpriteMapFile

export function animationFps(songBpm: number): number {
  return FRAMES_PER_SECOND_AT_REFERENCE * (songBpm / REFERENCE_BPM)
}

export interface ResolvedPerformer {
  sheetId: string | null
  tpsheetUrl: string | null
  iconFile: string | null
  iconUrl: string | null
}

function sheetUrl(sheetId: string | null | undefined): string | null {
  if (!sheetId) return null
  const file = SPRITE_MAP.sheetFiles[sheetId]
  if (!file) return null
  return `${SPRITE_SHEETS_BASE}/${file}`
}

function asIconUrl(file: string | null | undefined): string | null {
  if (!file) return null
  return `${INSTRUMENT_ICONS_BASE}/${file}`
}

/** `latin_agogo` → `latin_agogo`, `agogo`; `edm_milkyman_clock` → full + suffixes. */
export function instrumentTokens(instrument: string): string[] {
  const parts = instrument.split('_').filter(Boolean)
  const tokens = [instrument]
  for (let i = 1; i < parts.length; i += 1) {
    tokens.push(parts.slice(i).join('_'))
  }
  if (instrument.startsWith('voz_') && !tokens.includes('voz')) tokens.push('voz')
  if (/milkman|milkyman/.test(instrument) && !tokens.includes('milkman')) tokens.push('milkman')
  return tokens
}

function lookupToken(table: Record<string, string> | undefined, instrument: string): string | undefined {
  if (!table) return undefined
  for (const token of instrumentTokens(instrument)) {
    if (token in table) return table[token]
  }
  return undefined
}

export function resolveInstrumentIcon(instrument: string, genre?: string): string | null {
  return asIconUrl(resolveIconFile(instrument, genre, undefined))
}

function resolveIconFile(
  instrument: string,
  genre: string | undefined,
  bindingIcon: string | undefined,
): string | null {
  if (bindingIcon) return bindingIcon
  if (genre && SPRITE_MAP.genreIcons[instrument]?.[genre]) {
    return SPRITE_MAP.genreIcons[instrument][genre]
  }
  if (SPRITE_MAP.icons[instrument]) return SPRITE_MAP.icons[instrument]
  const tokenIcon = lookupToken(SPRITE_MAP.iconTokens, instrument)
  if (tokenIcon) return tokenIcon
  const kind = instrumentKind(instrument)
  if (kind && genre && SPRITE_MAP.genreIcons[kind]?.[genre]) {
    return SPRITE_MAP.genreIcons[kind][genre]
  }
  if (kind && SPRITE_MAP.kindIcons[kind]) return SPRITE_MAP.kindIcons[kind]
  return null
}

function resolveSheetId(
  char: CharacterSpriteConfig | undefined,
  instrument: string,
  genre?: string,
): string | null {
  if (!char) return null
  if (genre) {
    const exactGenre = char.genreSheets?.[instrument]?.[genre]
    if (exactGenre) return exactGenre
    for (const token of instrumentTokens(instrument)) {
      const byGenre = char.genreSheets?.[token]?.[genre]
      if (byGenre) return byGenre
    }
  }
  if (char.instruments?.[instrument]?.sheet) return char.instruments[instrument].sheet
  const tokenSheet = lookupToken(char.tokens, instrument)
  if (tokenSheet) return tokenSheet
  return char.fallback ?? null
}

export function resolvePerformer(
  characterId: CharacterId | string,
  instrument: string,
  genre?: string,
): ResolvedPerformer {
  const char = SPRITE_MAP.characters[characterId]
  const binding = char?.instruments?.[instrument]
  const sheetId = resolveSheetId(char, instrument, genre)
  const iconFile = resolveIconFile(instrument, genre, binding?.icon)
  return {
    sheetId,
    tpsheetUrl: sheetUrl(sheetId),
    iconFile,
    iconUrl: asIconUrl(iconFile),
  }
}
