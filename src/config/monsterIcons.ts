import type { CharacterId } from '../types'

export interface MonsterIconSet {
  idle: string
  ativo: string
  source: string
}

/**
 * Tray chip mapping.
 * Named pack icons keep their official names.
 * Numbered leftovers fill the remaining cast; zoem and gerarda stay on a soft placeholder.
 */
export const MONSTER_ICON_MAP: Record<CharacterId, MonsterIconSet | null> = {
  boogar: {
    idle: '/icons/monsters/ICONE_BOOGAR.svg',
    ativo: '/icons/monsters/ICONE_BOOGAR_ATIVO.svg',
    source: 'ICONE_BOOGAR',
  },
  ceval: {
    idle: '/icons/monsters/ICONE_CEVAL.svg',
    ativo: '/icons/monsters/ICONE_CEVAL_ATIVO.svg',
    source: 'ICONE_CEVAL',
  },
  grompy: {
    idle: '/icons/monsters/ICONE_GROMPY.svg',
    ativo: '/icons/monsters/ICONE_GROMPY_ATIVO.svg',
    source: 'ICONE_GROMPY',
  },
  ohle: {
    idle: '/icons/monsters/ICONE_OHLE.svg',
    ativo: '/icons/monsters/ICONE_OHLE_ATIVO.svg',
    source: 'ICONE_OHLE',
  },
  rafog: {
    idle: '/icons/monsters/ICONE_RAFOG.svg',
    ativo: '/icons/monsters/ICONE_RAFOG_ATIVO.svg',
    source: 'ICONE_RAFOG',
  },
  teewong: {
    idle: '/icons/monsters/ICONE_TEEWONG.svg',
    ativo: '/icons/monsters/ICONE_TEEWONG_ATIVO.svg',
    source: 'ICONE_TEEWONG',
  },
  gobu: {
    idle: '/icons/monsters/ICONE_MONSTRO04.svg',
    ativo: '/icons/monsters/ICONE_MONSTRO04_ATIVO.svg',
    source: 'ICONE_MONSTRO04',
  },
  dan: {
    idle: '/icons/monsters/ICONE_MONSTRO05.svg',
    ativo: '/icons/monsters/ICONE_MONSTRO05_ATIVO.svg',
    source: 'ICONE_MONSTRO05',
  },
  esper: {
    idle: '/icons/monsters/ICONE_MONSTRO07.svg',
    ativo: '/icons/monsters/ICONE_MONSTRO07_ATIVO.svg',
    source: 'ICONE_MONSTRO07',
  },
  zoem: null,
  gerarda: null,
}

export function monsterIconFor(characterId: CharacterId, ativo: boolean): string | null {
  const set = MONSTER_ICON_MAP[characterId]
  if (!set) return null
  return ativo ? set.ativo : set.idle
}
