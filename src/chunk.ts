import type { Emitter } from 'mitt'
import mitt from 'mitt'

export type TChunkEvents = {
  progress: number
  done: TChunk
}

export interface TChunkParameters {
  url: string,
  index: number,
  start: number
  end: number
}

export class TChunk implements TChunkParameters {
  readonly url: string
  readonly index: number
  readonly start: number
  readonly end: number
  buffer: Uint8Array
  head: number
  blob: Blob | null = null

  emitter: Emitter<TChunkEvents>

  constructor(options: TChunkParameters) {
    this.url = options.url
    this.index = options.index
    this.start = options.start
    this.head = options.start
    this.end = options.end
    this.buffer = new Uint8Array(this.size)

    this.emitter = mitt()
  }

  get progress() {
    return (this.head - this.start) / this.size
  }

  get size() {
    return (this.end - this.start) + 1
  }

  append(value: Uint8Array) {
    this.buffer.set(value, this.head - this.start)
    this.head += value.length
    this.emitter.emit('progress', this.progress)
  }

  done(blob: Blob) {
    this.blob = blob
  }
}