import { useContext, useEffect, useMemo, createContext, type ReactNode } from 'react'
import { CapsuleGeometry, ConeGeometry, SphereGeometry, type BufferGeometry } from 'three'

/** Keep in sync with `ISLANDS` in scripts/gen-tex-pilot.py (v=0 bottom, flipY=true). */
export const BOOGAR_ISLANDS = {
  body: { u0: 0.0, v0: 0.5, u1: 1.0, v1: 1.0 },
  arm: { u0: 0.02, v0: 0.27, u1: 0.23, v1: 0.48 },
  leg: { u0: 0.27, v0: 0.27, u1: 0.48, v1: 0.48 },
  ear: { u0: 0.52, v0: 0.27, u1: 0.73, v1: 0.48 },
  claw: { u0: 0.77, v0: 0.27, u1: 0.98, v1: 0.48 },
  hand: { u0: 0.02, v0: 0.02, u1: 0.23, v1: 0.23 },
  earInner: { u0: 0.27, v0: 0.02, u1: 0.48, v1: 0.23 },
} as const

export type BoogarPart = keyof typeof BOOGAR_ISLANDS

export const BoogarPartContext = createContext<BoogarPart | null>(null)

export function BoogarPartProvider({ part, children }: { part: BoogarPart; children: ReactNode }) {
  return <BoogarPartContext.Provider value={part}>{children}</BoogarPartContext.Provider>
}

export function applyBoogarUVs(geo: BufferGeometry, part: BoogarPart) {
  const uv = geo.getAttribute('uv')
  if (!uv) return geo
  const { u0, v0, u1, v1 } = BOOGAR_ISLANDS[part]
  const du = u1 - u0
  const dv = v1 - v0
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, u0 + uv.getX(i) * du, v0 + uv.getY(i) * dv)
  }
  uv.needsUpdate = true
  return geo
}

export function AtlasSphere({ args }: { args: [radius: number, width?: number, height?: number] }) {
  const part = useContext(BoogarPartContext)
  const radius = args[0]
  const width = args[1] ?? 32
  const height = args[2] ?? 16
  const geo = useMemo(() => {
    const g = new SphereGeometry(radius, width, height)
    if (part) applyBoogarUVs(g, part)
    return g
  }, [radius, width, height, part])
  useEffect(() => () => geo.dispose(), [geo])
  return <primitive object={geo} attach="geometry" />
}

export function AtlasCapsule({
  args,
}: {
  args: [radius: number, length: number, cap?: number, radial?: number]
}) {
  const part = useContext(BoogarPartContext)
  const radius = args[0]
  const length = args[1]
  const cap = args[2] ?? 4
  const radial = args[3] ?? 8
  const geo = useMemo(() => {
    const g = new CapsuleGeometry(radius, length, cap, radial)
    if (part) applyBoogarUVs(g, part)
    return g
  }, [radius, length, cap, radial, part])
  useEffect(() => () => geo.dispose(), [geo])
  return <primitive object={geo} attach="geometry" />
}

export function AtlasCone({ args }: { args: [radius: number, height: number, radial?: number] }) {
  const part = useContext(BoogarPartContext)
  const radius = args[0]
  const height = args[1]
  const radial = args[2] ?? 8
  const geo = useMemo(() => {
    const g = new ConeGeometry(radius, height, radial)
    if (part) applyBoogarUVs(g, part)
    return g
  }, [radius, height, radial, part])
  useEffect(() => () => geo.dispose(), [geo])
  return <primitive object={geo} attach="geometry" />
}
