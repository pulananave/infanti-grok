import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { CHARACTERS } from '../config/characters'
import { animationFps, resolvePerformer } from '../config/spriteMap'
import { applyFrameToTexture, getSpritesheet, type LoadedSheet } from '../sprites/spriteCache'
import type { CharacterId } from '../types'

const TARGET_CONTENT_HEIGHT = 1.82

interface Props {
  characterId: CharacterId
  instrument: string
  genre?: string
  muted?: boolean
  playing?: boolean
  bpm?: number
  ghost?: boolean
}

function FallbackBlob({
  characterId,
  opacity,
}: {
  characterId: CharacterId
  opacity: number
}) {
  const look = CHARACTERS[characterId]
  return (
    <mesh position={[0, 0.7, 0]}>
      <planeGeometry args={[1.1, 1.4]} />
      <meshBasicMaterial color={look.bodyColor} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

export function SpritePerformer({
  characterId,
  instrument,
  genre,
  muted = false,
  playing = false,
  bpm = 120,
  ghost = false,
}: Props) {
  const visual = useMemo(
    () => resolvePerformer(characterId, instrument, genre),
    [characterId, instrument, genre],
  )
  const [sheet, setSheet] = useState<LoadedSheet | null>(null)
  const texture = useRef<THREE.Texture | null>(null)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const frameIndex = useRef(0)
  const elapsed = useRef(0)
  const opacity = ghost ? 0.42 : muted ? 0.55 : 1

  useEffect(() => {
    let cancelled = false
    setSheet(null)
    if (!visual.tpsheetUrl) return
    void getSpritesheet(visual.tpsheetUrl).then((loaded) => {
      if (cancelled) return
      const clone = loaded.pages[0]?.texture.clone()
      if (clone) {
        clone.needsUpdate = true
        const first = loaded.frames[0]
        const page = first ? loaded.pages[first.page] : undefined
        if (first && page) applyFrameToTexture(clone, first.region, page.size)
        texture.current = clone
      }
      setSheet(loaded)
      frameIndex.current = 0
      elapsed.current = 0
    })
    return () => {
      cancelled = true
      texture.current?.dispose()
      texture.current = null
    }
  }, [visual.tpsheetUrl])

  useFrame((_, delta) => {
    if (!sheet || !texture.current || sheet.frames.length === 0) return
    const fps = animationFps(bpm)
    if (playing && !muted && !ghost) {
      elapsed.current += delta
    } else if (ghost && playing) {
      elapsed.current += delta
    }
    const next = Math.floor(elapsed.current * fps) % sheet.frames.length
    if (!playing || muted) {
      frameIndex.current = 0
    } else {
      frameIndex.current = next
    }
    const frame = sheet.frames[frameIndex.current]
    const page = sheet.pages[frame.page]
    if (!page || !mesh.current || !material.current) return

    if (texture.current.image !== page.texture.image) {
      const clone = page.texture.clone()
      clone.needsUpdate = true
      texture.current.dispose()
      texture.current = clone
      material.current.map = clone
    }

    applyFrameToTexture(texture.current, frame.region, page.size)

    const px = TARGET_CONTENT_HEIGHT / sheet.content.h
    mesh.current.scale.set(frame.region.w * px, frame.region.h * px, 1)
    mesh.current.position.set(
      (frame.margin.x + frame.region.w / 2 - sheet.source.w / 2) * px,
      (frame.margin.h + frame.region.h / 2) * px,
      0,
    )
    material.current.opacity = opacity
    material.current.color.set(muted && !ghost ? '#b9b3c4' : '#ffffff')
  })

  if (!visual.tpsheetUrl) {
    return <FallbackBlob characterId={characterId} opacity={opacity} />
  }

  if (!sheet || !texture.current) {
    return <FallbackBlob characterId={characterId} opacity={opacity * 0.35} />
  }

  const px = TARGET_CONTENT_HEIGHT / sheet.content.h
  const hitW = sheet.source.w * px
  const hitH = sheet.source.h * px

  return (
    <Billboard follow lockX={false} lockY={false} lockZ={false}>
      <mesh position={[0, hitH * 0.45, 0]} visible={false}>
        <planeGeometry args={[Math.max(1.1, hitW * 0.55), Math.max(1.4, hitH * 0.7)]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={mesh}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={material}
          map={texture.current}
          transparent
          opacity={opacity}
          depthWrite
          alphaTest={0.08}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  )
}
