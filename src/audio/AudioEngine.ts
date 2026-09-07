import { makeStubBuffer } from './stubBuffer'

const LOOKAHEAD = 0.15
const SCHEDULE_AHEAD = 1.25

interface VoiceMeta {
  compassos: number
  instrument: string
  genre: string
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
    const offset = elapsed % loopDuration
    this.playAt(now, offset)
    this.nextLoopTime = transportStart + Math.floor(elapsed / loopDuration) * loopDuration + loopDuration
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
    const horizon = this.ctx.currentTime + SCHEDULE_AHEAD
    while (this.nextLoopTime < horizon) {
      this.playAt(this.nextLoopTime, 0)
      this.nextLoopTime += this.loopDuration
    }
  }

  private playAt(when: number, offset: number) {
    if (offset >= this.buffer.duration) return
    const source = this.ctx.createBufferSource()
    source.buffer = this.buffer
    source.connect(this.gain)
    source.start(when, offset)
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

  async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
    return this.ctx
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
    this.chain = this.chain.then(() => this.addStemNow(id, paths, meta, gain)).catch(() => undefined)
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

  private async addStemNow(
    id: string,
    paths: string[],
    meta: VoiceMeta,
    gain: number,
  ): Promise<void> {
    const ctx = await this.ensureContext()
    if (!this.master) return
    if (this.voices.has(id)) return

    const buffer = await this.loadBuffer(paths, meta)
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
        const decoded = await ctx.decodeAudioData(bytes.slice(0))
        this.buffers.set(cacheKey, decoded)
        return decoded
      } catch {
        /* try next candidate or stub */
      }
    }

    const stub = makeStubBuffer(ctx, { ...meta, bpm: this.bpm })
    this.buffers.set(cacheKey, stub)
    return stub
  }
}

export const audioEngine = new AudioEngine()
