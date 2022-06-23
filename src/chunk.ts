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
  progress: number
  blob: Blob | null = null

  emitter: Emitter<TChunkEvents>

  constructor(options: TChunkParameters) {
    this.url = options.url
    this.index = options.index
    this.start = options.start
    this.end = options.end
    this.progress = 0

    this.emitter = mitt()
  }

  get size() {
    return this.end - this.start
  }

  done(blob: Blob) {
    this.blob = blob
  }
}