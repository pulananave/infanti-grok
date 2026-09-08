import { makeStubBuffer } from './stubBuffer'

const LOOKAHEAD = 0.15
const SCHEDULE_AHEAD = 1.25

interface VoiceMeta {
  compassos: number
  instrument: string
  genre: string
}

function createAudioContext(): AudioContext {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) {
    throw new Error('Web Audio is not supported')
  }
  return new Ctor()
}

function decodeAudioData(ctx: AudioContext, bytes: ArrayBuffer): Promise<AudioBuffer> {
  const copy = bytes.slice(0)
  return new Promise((resolve, reject) => {
    let settled = false
    const ok = (buffer: AudioBuffer) => {
      if (settled) return
      settled = true
      resolve(buffer)
    }
    const fail = (error?: unknown) => {
      if (settled) return
      settled = true
      reject(error instanceof Error ? error : new Error('decodeAudioData failed'))
    }
    try {
      const maybe = ctx.decodeAudioData(copy, ok, fail)
      if (maybe && typeof maybe.then === 'function') {
        maybe.then(ok, fail)
      }
    } catch (error) {
      fail(error)
    }
  })
}

class StemVoice {
  private readonly ctx: AudioContext
  private readonly output: GainNode
  readonly gain: GainNode
  private readonly buffer: AudioBuffer
  private readonly loopDuration: number
  private nextLoopTime: number
  private timer: number | null = null
  private stopped = false
  private sources: AudioBufferSourceNode[] = []

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    buffer: AudioBuffer,
    loopDuration: number,
    transportStart: number,
    initialGain: number,
  ) {
    this.ctx = ctx
    this.buffer = buffer
    this.loopDuration = loopDuration
    this.output = ctx.createGain()
    this.gain = ctx.createGain()
    this.gain.gain.value = initialGain
    this.gain.connect(this.output)
    this.output.connect(destination)

    const now = ctx.currentTime
    const elapsed = Math.max(0, now - transportStart)
    const offset = this.loopDuration > 0 ? elapsed % this.loopDuration : 0
    this.playAt(now, offset)
    this.nextLoopTime =
      transportStart + Math.floor(elapsed / Math.max(this.loopDuration, 0.001)) * this.loopDuration + this.loopDuration
    this.tick()
    this.timer = window.setInterval(() => this.tick(), LOOKAHEAD * 1000)
  }

  setGain(value: number) {
    this.gain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.03)
  }

  stop() {
    this.stopped = true
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    for (const source of this.sources) {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
    }
    this.sources = []
    this.gain.disconnect()
    this.output.disconnect()
  }

  private tick() {
    if (this.stopped) return
    const now = this.ctx.currentTime
    const horizon = now + SCHEDULE_AHEAD
    while (this.nextLoopTime + this.loopDuration <= now) {
      this.nextLoopTime += this.loopDuration
    }
    while (this.nextLoopTime < horizon) {
      this.playAt(this.nextLoopTime, 0)
      this.nextLoopTime += this.loopDuration
    }
  }

  private playAt(when: number, offset: number) {
    if (!(this.buffer.duration > 0) || !(this.loopDuration > 0)) return

    let startAt = when
    let grain = offset
    const now = this.ctx.currentTime
    if (startAt < now) {
      grain += now - startAt
      startAt = now
    }
    if (grain >= this.buffer.duration) return

    const source = this.ctx.createBufferSource()
    source.buffer = this.buffer
    source.connect(this.gain)
    try {
      source.start(startAt, grain)
    } catch {
      try {
        source.start()
      } catch {
        return
      }
    }
    this.sources.push(source)
    source.onended = () => {
      this.sources = this.sources.filter((item) => item !== source)
    }
  }
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private transportStart: number | null = null
  private bpm = 120
  private readonly voices = new Map<string, StemVoice>()
  private readonly buffers = new Map<string, AudioBuffer>()
  private chain: Promise<void> = Promise.resolve()
  private primed = false
  private keeper: OscillatorNode | null = null

  /**
   * Must be called synchronously from a user gesture (pointer/touch/click).
   * Mobile browsers ignore resume() once the gesture has been consumed by awaits.
   */
  unlock(): void {
    try {
      const ctx = this.getOrCreateContext()
      if (ctx.state !== 'running') {
        void ctx.resume()
      }
      this.prime(ctx)
    } catch {
      /* Web Audio unavailable */
    }
  }

  async ensureContext(): Promise<AudioContext> {
    const ctx = this.getOrCreateContext()
    if (ctx.state !== 'running') {
      await ctx.resume()
    }
    this.prime(ctx)
    return ctx
  }

  setBpm(bpm: number) {
    this.bpm = bpm
  }

  loopDuration(compassos: number): number {
    return (60 / this.bpm) * 4 * compassos
  }

  isRunning(): boolean {
    return this.transportStart !== null
  }

  stopAndReset() {
    for (const voice of this.voices.values()) {
      voice.stop()
    }
    this.voices.clear()
    this.transportStart = null
  }

  addStem(
    id: string,
    paths: string[],
    meta: VoiceMeta,
    gain: number,
  ): Promise<void> {
    this.chain = this.chain
      .then(() => this.addStemNow(id, paths, meta, gain))
      .catch((error) => {
        console.warn('[infanti] addStem failed', error)
      })
    return this.chain
  }

  removeStem(id: string) {
    const voice = this.voices.get(id)
    if (!voice) return
    voice.stop()
    this.voices.delete(id)
    if (this.voices.size === 0) {
      this.transportStart = null
    }
  }

  setGain(id: string, value: number) {
    this.voices.get(id)?.setGain(value)
  }

  async preload(stems: { paths: string[]; meta: VoiceMeta }[]): Promise<void> {
    try {
      await this.ensureContext()
      await Promise.all(
        stems.map((stem) => this.loadBuffer(stem.paths, stem.meta).catch(() => undefined)),
      )
    } catch {
      /* preload is best-effort */
    }
  }

  private getOrCreateContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = createAudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
      this.ctx.addEventListener('statechange', () => {
        if (this.ctx && this.ctx.state !== 'running' && this.voices.size > 0) {
          void this.ctx.resume()
        }
      })
    }
    return this.ctx
  }

  private prime(ctx: AudioContext) {
    if (this.primed) {
      this.ensureKeeper(ctx)
      return
    }
    try {
      const silent = ctx.createBuffer(1, 1, ctx.sampleRate)
      const source = ctx.createBufferSource()
      source.buffer = silent
      source.connect(ctx.destination)
      source.start(0)
      this.primed = true
    } catch {
      this.primed = true
    }
    this.ensureKeeper(ctx)
  }

  private ensureKeeper(ctx: AudioContext) {
    if (this.keeper) return
    try {
      const osc = ctx.createOscillator()
      const gate = ctx.createGain()
      gate.gain.value = 0
      osc.connect(gate)
      gate.connect(ctx.destination)
      osc.start()
      this.keeper = osc
    } catch {
      /* optional iOS keep-alive */
    }
  }

  private async addStemNow(
    id: string,
    paths: string[],
    meta: VoiceMeta,
    gain: number,
  ): Promise<void> {
    let ctx = await this.ensureContext()
    if (!this.master) return
    if (this.voices.has(id)) return

    let buffer: AudioBuffer
    try {
      buffer = await this.loadBuffer(paths, meta)
    } catch {
      buffer = makeStubBuffer(ctx, { ...meta, bpm: this.bpm })
    }

    ctx = await this.ensureContext()
    if (ctx.state !== 'running') {
      await ctx.resume()
    }
    if (!this.master || this.voices.has(id)) return
    if (!(buffer.duration > 0)) {
      buffer = makeStubBuffer(ctx, { ...meta, bpm: this.bpm })
    }

    if (this.transportStart === null) {
      this.transportStart = ctx.currentTime
    }
    const voice = new StemVoice(
      ctx,
      this.master,
      buffer,
      this.loopDuration(meta.compassos),
      this.transportStart,
      gain,
    )
    this.voices.set(id, voice)
  }

  private async loadBuffer(paths: string[], meta: VoiceMeta): Promise<AudioBuffer> {
    const ctx = this.ctx
    if (!ctx) throw new Error('AudioContext missing')
    const cacheKey = paths[0] ?? `${meta.instrument}:${meta.genre}:${meta.compassos}`
    const cached = this.buffers.get(cacheKey)
    if (cached) return cached

    for (const path of paths) {
      try {
        const response = await fetch(path)
        if (!response.ok) continue
        const bytes = await response.arrayBuffer()
        if (bytes.byteLength < 64) continue
        const decoded = await decodeAudioData(ctx, bytes)
        if (!(decoded.duration > 0.02) || decoded.length < 32) continue
        this.buffers.set(cacheKey, decoded)
        return decoded
      } catch {
        /* try next candidate or stub — Safari often rejects .ogg */
      }
    }

    const stub = makeStubBuffer(ctx, { ...meta, bpm: this.bpm })
    this.buffers.set(cacheKey, stub)
    return stub
  }
}

export const audioEngine = new AudioEngine()
