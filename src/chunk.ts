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
  abortController: AbortController

  emitter: Emitter<TChunkEvents>

  constructor(options: TChunkParameters) {
    this.url = options.url
    this.index = options.index
    this.start = options.start
    this.end = options.end
    this.buffer = new Uint8Array(this.size)
    this.head = 0
    this.abortController = new AbortController()

    this.emitter = mitt()
  }

  get progress() {
    return this.head / this.size
  }
  
  get size() {
    return (this.end - this.start) + 1
  }

  append(value: Uint8Array) { 
    this.buffer.set(value, this.head)
    this.head += value.length
    this.emitter.emit('progress', this.progress)
  }

  done(blob: Blob) {
    this.blob = blob
  }

  pause() { 
    console.log('abort');
    
    this.abortController.abort()
  }

  resume() { 
    this.abortController = new AbortController()
  }
}