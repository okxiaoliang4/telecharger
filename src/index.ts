import { asyncPool, download, getContentLength } from './utils'
import { TChunk } from './chunk'
import mitt from 'mitt'

export type TelechargerEvent = {
  progress: number
  done: void
}

interface TelechargerOptions {
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

  for (let i = 0; i < chunksCount; i++) {
    let start = i * chunkSize;
    let end = i + 1 == chunksCount ? contentLength - 1 : (i + 1) * chunkSize - 1;
    const chunk = new TChunk({
      url,
      index: i,
      start,
      end,
    })
    chunk.emitter.on('progress', (progress: number) => {
      const totalProgress = chunks.reduce((prev: number, current) => {
        return prev + current.progress
      }, 0) / chunksCount
      emitter.emit('progress', totalProgress)
    })
    chunks[i] = chunk
  }

  (async () => {
    for await (const chunk of asyncPool(threads, chunks, download)) {
      chunk.emitter.emit('done', chunk)
    }

    emitter.emit('done')
  })()

  return {
    chunks,
    emitter,
  }
}

export default telecharger