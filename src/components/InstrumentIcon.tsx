import type { ReactNode } from 'react'
import { instrumentKind, type InstrumentId } from '../config/instruments'

interface Props {
  instrument: string
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden>
      {children}
    </svg>
  )
}

const ICONS: Record<InstrumentId, ReactNode> = {
  drums: (
    <Svg>
      <ellipse cx="32" cy="30" rx="20" ry="12" fill="#E74C3C" stroke="#2b1654" strokeWidth="3" />
      <path d="M12 30v10c0 7 9 12 20 12s20-5 20-12V30" fill="#C0392B" stroke="#2b1654" strokeWidth="3" />
      <path d="M18 18l8 8M46 18l-8 8" stroke="#2b1654" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  ),
  tambourine: (
    <Svg>
      <circle cx="32" cy="32" r="18" fill="#F4D03F" stroke="#2b1654" strokeWidth="3" />
      <circle cx="32" cy="14" r="4" fill="#F5B041" />
      <circle cx="48" cy="24" r="4" fill="#F5B041" />
      <circle cx="48" cy="40" r="4" fill="#F5B041" />
      <circle cx="32" cy="50" r="4" fill="#F5B041" />
      <circle cx="16" cy="40" r="4" fill="#F5B041" />
      <circle cx="16" cy="24" r="4" fill="#F5B041" />
    </Svg>
  ),
  shaker: (
    <Svg>
      <ellipse cx="32" cy="26" rx="12" ry="16" fill="#58D68D" stroke="#2b1654" strokeWidth="3" />
      <rect x="26" y="40" width="12" height="12" rx="3" fill="#2b1654" />
      <circle cx="28" cy="22" r="2" fill="#fff7e8" />
      <circle cx="36" cy="28" r="2" fill="#fff7e8" />
    </Svg>
  ),
  maracas: (
    <Svg>
      <ellipse cx="24" cy="22" rx="10" ry="14" fill="#E74C3C" stroke="#2b1654" strokeWidth="3" />
      <rect x="21" y="34" width="6" height="16" rx="3" fill="#2b1654" />
      <ellipse cx="42" cy="26" rx="10" ry="14" fill="#F4D03F" stroke="#2b1654" strokeWidth="3" />
      <rect x="39" y="38" width="6" height="16" rx="3" fill="#2b1654" />
    </Svg>
  ),
  triangle: (
    <Svg>
      <path d="M32 12l20 36H12L32 12z" stroke="#F7DC6F" strokeWidth="5" fill="none" />
      <path d="M44 18v14" stroke="#2b1654" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  ),
  bass: (
    <Svg>
      <rect x="14" y="28" width="28" height="16" rx="8" fill="#6C3483" stroke="#2b1654" strokeWidth="3" />
      <rect x="40" y="18" width="6" height="28" rx="3" fill="#2b1654" />
      <circle cx="24" cy="36" r="4" fill="#F4D03F" />
    </Svg>
  ),
  cello: (
    <Svg>
      <path d="M24 18c0-6 16-6 16 0v10c8 4 8 16 0 20v6H24v-6c-8-4-8-16 0-20V18z" fill="#A04000" stroke="#2b1654" strokeWidth="3" />
      <path d="M32 12v40" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  ),
  guitar: (
    <Svg>
      <path d="M16 36c0-10 20-10 20 0 0 10-8 16-10 16s-10-6-10-16z" fill="#CA6F1E" stroke="#2b1654" strokeWidth="3" />
      <rect x="34" y="14" width="6" height="26" rx="3" fill="#2b1654" />
      <circle cx="26" cy="36" r="4" fill="#2b1654" />
    </Svg>
  ),
  ukulele: (
    <Svg>
      <circle cx="26" cy="38" r="12" fill="#F5B041" stroke="#2b1654" strokeWidth="3" />
      <rect x="32" y="12" width="5" height="24" rx="2" fill="#2b1654" />
      <circle cx="26" cy="38" r="3" fill="#2b1654" />
    </Svg>
  ),
  electric_guitar: (
    <Svg>
      <path d="M14 40c2-12 18-14 22-4 4 8-2 18-10 16-8-2-14-4-12-12z" fill="#E74C3C" stroke="#2b1654" strokeWidth="3" />
      <rect x="36" y="10" width="5" height="28" rx="2" fill="#1A1A1A" />
      <circle cx="26" cy="38" r="3" fill="#F4D03F" />
    </Svg>
  ),
  piano: (
    <Svg>
      <rect x="10" y="20" width="44" height="24" rx="4" fill="#2b1654" />
      <rect x="14" y="24" width="6" height="16" fill="#fff7e8" />
      <rect x="22" y="24" width="6" height="16" fill="#fff7e8" />
      <rect x="30" y="24" width="6" height="16" fill="#fff7e8" />
      <rect x="38" y="24" width="6" height="16" fill="#fff7e8" />
      <rect x="19" y="24" width="4" height="10" fill="#1a1a1a" />
      <rect x="27" y="24" width="4" height="10" fill="#1a1a1a" />
      <rect x="35" y="24" width="4" height="10" fill="#1a1a1a" />
    </Svg>
  ),
  xylophone: (
    <Svg>
      <rect x="10" y="18" width="10" height="28" rx="3" fill="#E74C3C" />
      <rect x="22" y="20" width="10" height="26" rx="3" fill="#F4D03F" />
      <rect x="34" y="22" width="10" height="24" rx="3" fill="#58D68D" />
      <rect x="46" y="24" width="8" height="22" rx="3" fill="#5DADE2" />
    </Svg>
  ),
  synth: (
    <Svg>
      <rect x="10" y="18" width="44" height="28" rx="6" fill="#5B2C6F" stroke="#2b1654" strokeWidth="3" />
      <circle cx="22" cy="32" r="5" fill="#5EE0C4" />
      <circle cx="36" cy="32" r="5" fill="#FF8DC7" />
      <rect x="44" y="24" width="6" height="16" rx="2" fill="#F4D03F" />
    </Svg>
  ),
  accordion: (
    <Svg>
      <rect x="12" y="18" width="12" height="28" rx="3" fill="#922B21" />
      <rect x="40" y="18" width="12" height="28" rx="3" fill="#922B21" />
      <path d="M24 22h16v20H24z" fill="#F5CBA7" stroke="#2b1654" strokeWidth="2" />
      <path d="M28 22v20M32 22v20M36 22v20" stroke="#2b1654" strokeWidth="2" />
    </Svg>
  ),
  trumpet: (
    <Svg>
      <rect x="8" y="28" width="30" height="8" rx="3" fill="#F4D03F" />
      <path d="M38 24h10l6 8-6 8H38z" fill="#F5B041" stroke="#2b1654" strokeWidth="2" />
      <circle cx="18" cy="24" r="4" fill="#F4D03F" />
      <circle cx="26" cy="24" r="4" fill="#F4D03F" />
    </Svg>
  ),
  tuba: (
    <Svg>
      <circle cx="28" cy="34" r="14" fill="#B7950B" stroke="#2b1654" strokeWidth="3" />
      <path d="M40 28c10 0 16 6 16 12" stroke="#F4D03F" strokeWidth="6" strokeLinecap="round" />
      <circle cx="28" cy="34" r="6" fill="#fff7e8" />
    </Svg>
  ),
  flute: (
    <Svg>
      <rect x="8" y="28" width="48" height="8" rx="4" fill="#D5DBDB" stroke="#2b1654" strokeWidth="3" />
      <circle cx="20" cy="32" r="2" fill="#2b1654" />
      <circle cx="28" cy="32" r="2" fill="#2b1654" />
      <circle cx="36" cy="32" r="2" fill="#2b1654" />
      <circle cx="44" cy="32" r="2" fill="#2b1654" />
    </Svg>
  ),
  clarinet: (
    <Svg>
      <rect x="16" y="10" width="8" height="44" rx="4" fill="#1C2833" />
      <rect x="14" y="48" width="12" height="6" rx="2" fill="#F4D03F" />
      <circle cx="20" cy="20" r="2" fill="#fff7e8" />
      <circle cx="20" cy="28" r="2" fill="#fff7e8" />
      <circle cx="20" cy="36" r="2" fill="#fff7e8" />
    </Svg>
  ),
  saxophone: (
    <Svg>
      <path d="M24 12c0 18 4 22 16 28 6 4 8 10 2 14-8 4-18-2-16-10" fill="#F4D03F" stroke="#2b1654" strokeWidth="3" />
      <rect x="20" y="8" width="10" height="8" rx="3" fill="#B7950B" />
    </Svg>
  ),
  harmonica: (
    <Svg>
      <rect x="8" y="24" width="48" height="16" rx="4" fill="#7F8C8D" stroke="#2b1654" strokeWidth="3" />
      <path d="M14 28h36v8H14z" fill="#F4D03F" />
    </Svg>
  ),
  vocals: (
    <Svg>
      <rect x="26" y="12" width="12" height="22" rx="6" fill="#E74C3C" stroke="#2b1654" strokeWidth="3" />
      <path d="M20 30c0 8 5 12 12 12s12-4 12-12" stroke="#2b1654" strokeWidth="3" />
      <path d="M32 42v8M24 50h16" stroke="#2b1654" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  ),
  dj: (
    <Svg>
      <rect x="10" y="20" width="44" height="24" rx="8" fill="#1A1A1A" />
      <circle cx="24" cy="32" r="8" fill="#5EE0C4" />
      <circle cx="40" cy="32" r="8" fill="#FF8DC7" />
      <circle cx="24" cy="32" r="3" fill="#2b1654" />
      <circle cx="40" cy="32" r="3" fill="#2b1654" />
    </Svg>
  ),
  agogo: (
    <Svg>
      <ellipse cx="22" cy="28" rx="8" ry="12" fill="#F4D03F" stroke="#2b1654" strokeWidth="3" />
      <ellipse cx="40" cy="32" rx="10" ry="14" fill="#F5B041" stroke="#2b1654" strokeWidth="3" />
      <path d="M22 40v10M40 46v8" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  ),
  conga: (
    <Svg>
      <ellipse cx="32" cy="18" rx="12" ry="6" fill="#CA6F1E" stroke="#2b1654" strokeWidth="3" />
      <path d="M20 18v24c0 8 24 8 24 0V18" fill="#A04000" stroke="#2b1654" strokeWidth="3" />
      <ellipse cx="32" cy="42" rx="12" ry="6" fill="#6E2C00" />
    </Svg>
  ),
  bongo: (
    <Svg>
      <ellipse cx="22" cy="30" rx="10" ry="12" fill="#CA6F1E" stroke="#2b1654" strokeWidth="3" />
      <ellipse cx="42" cy="32" rx="8" ry="10" fill="#A04000" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  ),
  clave: (
    <Svg>
      <rect x="10" y="18" width="8" height="32" rx="3" fill="#CA6F1E" stroke="#2b1654" strokeWidth="3" />
      <rect x="44" y="14" width="8" height="32" rx="3" fill="#A04000" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  ),
  reco_reco: (
    <Svg>
      <rect x="8" y="24" width="48" height="14" rx="6" fill="#CA6F1E" stroke="#2b1654" strokeWidth="3" />
      <path d="M16 26v10M22 26v10M28 26v10M34 26v10M40 26v10M46 26v10" stroke="#2b1654" strokeWidth="2" />
    </Svg>
  ),
  bombo: (
    <Svg>
      <ellipse cx="32" cy="32" rx="18" ry="16" fill="#7B241C" stroke="#2b1654" strokeWidth="3" />
      <ellipse cx="32" cy="32" rx="10" ry="9" fill="#F5CBA7" />
    </Svg>
  ),
  caixa: (
    <Svg>
      <ellipse cx="32" cy="28" rx="18" ry="10" fill="#F4D03F" stroke="#2b1654" strokeWidth="3" />
      <path d="M14 28v12c0 6 8 10 18 10s18-4 18-10V28" fill="#D4AC0D" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  ),
  cymbals: (
    <Svg>
      <ellipse cx="32" cy="30" rx="20" ry="8" fill="#F7DC6F" stroke="#2b1654" strokeWidth="3" />
      <ellipse cx="32" cy="38" rx="16" ry="6" fill="#F4D03F" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  ),
  trombone: (
    <Svg>
      <path d="M8 36h36" stroke="#F4D03F" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 36c0-10 16-10 16 0" stroke="#F4D03F" strokeWidth="5" fill="none" />
      <path d="M44 30h10l6 8-6 8H44z" fill="#F5B041" stroke="#2b1654" strokeWidth="2" />
    </Svg>
  ),
  violin: (
    <Svg>
      <path d="M22 20c0-6 20-6 20 0v8c10 4 10 16 0 20v8H22v-8c-10-4-10-16 0-20v-8z" fill="#A04000" stroke="#2b1654" strokeWidth="3" />
      <path d="M32 12v40" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  ),
  organ: (
    <Svg>
      <rect x="8" y="16" width="48" height="32" rx="4" fill="#5B2C6F" stroke="#2b1654" strokeWidth="3" />
      <rect x="14" y="22" width="4" height="20" fill="#F4D03F" />
      <rect x="22" y="22" width="4" height="20" fill="#F4D03F" />
      <rect x="30" y="22" width="4" height="20" fill="#F4D03F" />
      <rect x="38" y="22" width="4" height="20" fill="#F4D03F" />
      <rect x="46" y="22" width="4" height="20" fill="#F4D03F" />
    </Svg>
  ),
}

export function InstrumentIcon({ instrument }: Props) {
  const kind = instrumentKind(instrument)
  const node = kind ? (
    ICONS[kind]
  ) : (
    <Svg>
      <circle cx="32" cy="32" r="16" fill="#5EE0C4" stroke="#2b1654" strokeWidth="3" />
    </Svg>
  )
  return <span className="instrument-icon">{node}</span>
}
