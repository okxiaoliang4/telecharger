import { asyncPool, download, getContentLength } from './utils'
import { TChunk } from './chunk'
import mitt from 'mitt'

export type TelechargerEvent = {
  progress: number
  done: Blob
}

export interface TelechargerOptions {
  /**
   * 线程数
   * @default 8
   */
  threads?: number

  /**
   * 块大小
   * @default 10_240_000
   */
  chunkSize?: number
}

export async function telecharger(url: string, options: TelechargerOptions = {}) {
  const emitter = mitt<TelechargerEvent>()
  const {
    threads = 8,
    chunkSize = 10_240_000,
  } = options
  const contentLength = await getContentLength(url)
  const chunksCount = Math.ceil(contentLength / chunkSize);
  const chunks = new Array<TChunk>(chunksCount)
  const undone = new Set<TChunk>()

  for (let i = 0; i < chunksCount; i++) {
    let start = i * chunkSize;
    let end = i + 1 == chunksCount ? contentLength - 1 : (i + 1) * chunkSize - 1;
    const chunk = new TChunk({
      url,
      index: i,
      start,
      end,
    })
    chunk.emitter.on('progress', (progress) => {
      const totalProgress = chunks.reduce((prev: number, current) => {
        return prev + current.progress
      }, 0) / chunksCount
      emitter.emit('progress', totalProgress)

      // recycle event
      if (totalProgress >= 1) emitter.all.delete('progress')
      // recycle event
      if (progress >= 1) chunk.emitter.all.delete('progress')
    })
    chunks[i] = chunk
    undone.add(chunk)
  }

  (async () => {
    for await (const chunk of asyncPool(threads, chunks, download)) {
      chunk.emitter.emit('done', chunk)

      // recycle event
      chunk.emitter.all.delete('done')
    }

    emitter.emit('done', new Blob(chunks.map(chunk => chunk.blob!), { type: chunks[0].blob!.type }))

    // recycle event
    emitter.all.delete('done')
  })()

  function pause() {
    undone.forEach(chunk => chunk.pause())
  }

  function resume() {
    undone.forEach(chunk => chunk.resume())
  }

  return {
    chunks,
    emitter,
    pause,
    resume,
  }
}

export default telecharger