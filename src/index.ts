import { asyncPool, download, getHead } from './utils'
import { TChunk } from './chunk'
import mitt from 'mitt'

export type TelechargerEvent = {
  progress: number
  done: Blob
  error: Error
}

export interface TelechargerOptions {
  /**
   * 线程数
   * @default 8
   */
  threads?: number;

  /**
   * 块大小
   * @default 10_240_000
   */
  chunkSize?: number;

  /**
   * 是否立即下载
   * @default true
   */
  immediate?: boolean;
}

/**
 * 状态枚举
 */
enum Status {
  init,
  pending,
  pausing,
  error,
  done,
}

export class UnsupportedRangeError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export async function telecharger(url: string, options: TelechargerOptions = {}) {
  const emitter = mitt<TelechargerEvent>()
  const {
    threads = 8,
    chunkSize = 10_240_000,
    immediate = true,
  } = options

  // 发起Head请求
  const headers = await getHead(url)
  const contentType = headers.get('Content-Type')!

  // 判断是否支持 HTTP Range
  const isSupportedRange = headers.get('Accept-Ranges')?.includes('bytes')
  if (!isSupportedRange) throw new UnsupportedRangeError('unsupported http range')
  // 判断是否有Content-Range头部返回
  // ! 注意 CORS 需要配置 Access-Control-Expose-Headers 否则拿不到
  const contentRange = headers.get('Content-Range')
  if (!contentRange) throw new UnsupportedRangeError('no Content-Range')

  const contentLength = Number(contentRange.split('/')[1])
  // 根据contentLength计算总chunk数，向上取整
  const chunksCount = Math.ceil(contentLength / chunkSize)
  // 创建chunk数组
  const chunks = new Array<TChunk>(chunksCount)
  // 未完成的chunk集合
  const undone = new Set<TChunk>()

  for (let i = 0; i < chunksCount; i++) {
    // 创建chunk
    let start = i * chunkSize
    let end = i + 1 == chunksCount ? contentLength - 1 : (i + 1) * chunkSize - 1
    const chunk = new TChunk({
      url,
      index: i,
      start,
      end,
    })

    // 每个chunk的进度事件
    chunk.emitter.on('progress', (progress) => {
      const totalProgress = chunks.reduce((prev: number, current) => {
        return prev + current.progress
      }, 0) / chunksCount
      emitter.emit('progress', totalProgress)

      // 回收整体progress事件
      if (totalProgress >= 1) emitter.all.delete('progress')
      // 回收当前chunk progress事件
      if (progress >= 1) chunk.emitter.all.delete('progress')
    })

    chunks[i] = chunk
    undone.add(chunk)
  }

  let status: Status = 0
  let controller: AbortController

  async function start() {
    if (status === Status.pending || status === Status.done)
      return

    controller = new AbortController()
    status = Status.pending

    try {
      for await (const chunk of asyncPool(threads, Array.from(undone), (chunk) => download(chunk, controller))) {
        chunk.emitter.emit('done', chunk)

        // 回收事件
        chunk.emitter.all.delete('done')
      }
      status = Status.done
      emitter.emit('done', new Blob(chunks.map(chunk => chunk.blob!), {type: contentType}))
      // 回收事件
      emitter.all.delete('done')
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        status = Status.pausing
      } else {
        status = Status.error
        emitter.emit('error', error as Error)
      }
    }
  }

  if (immediate) {
    start()
  }

  function pause() {
    status = Status.pausing
    controller.abort()
  }

  function resume() {
    start()
  }

  return {
    chunks,
    emitter,
    start,
    pause,
    resume,
  }
}
