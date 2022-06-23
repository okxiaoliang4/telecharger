import { asyncPool, download, getContentLength } from './utils'
import { TChunk } from './chunk'


interface TSliceDownLoadOptions {
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

export async function sliceDownLoad(url: string, options: TSliceDownLoadOptions = {}) {
  const {
    threads = 8,
    chunkSize = 10_240_000
  } = options
  const contentLength = await getContentLength(url)
  const chunks = Math.ceil(contentLength / chunkSize);
  const chunkArr = new Array(chunks)

  for (let i = 0; i < chunks; i++) {
    let start = i * chunkSize;
    let end = i + 1 == chunks ? contentLength - 1 : (i + 1) * chunkSize - 1;
    chunkArr[i] = new TChunk({
      url,
      index: i,
      start,
      end,
    })
  }

  (async () => {
    for await (const chunk of asyncPool(threads, chunkArr, download)) {
      chunk.emitter.emit('done')
    }
  })()

  return chunkArr
}

