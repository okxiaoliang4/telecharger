import { $fetch } from 'ohmyfetch'

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

interface SliceDownLoadOptions {
  /**
   * 线程数
   * @default 3
   */
  threads?: number

  /**
   * 块大小
   * @default 102400
   */
  chunkSize?: number
}

export async function sliceDownLoad(url: string, options: SliceDownLoadOptions = {}) {
  const {
    threads = 6,
    chunkSize = 102400
  } = options
  const contentLength = await getContentLength(url)
  const reqs = new Array(threads)
  const chunks = Math.ceil(contentLength / chunkSize);

  // TODO: 每下载好一块就从队列中删除，并添加新的下载任务
  // TODO: 逻辑优化
  for (let i = 0; i < threads; i++) {
    let start = i * chunkSize;
    let end = i + 1 == chunks ? contentLength - 1 : (i + 1) * chunkSize - 1;
    console.log(`bytes=${start}-${end}`);
  }
  
  // Promise.race(reqs)
}

export function download(url: string, start: number, end: number) {
  return $fetch(url, {
    headers: {
      Range: `bytes=${start}-${end}`
    }
  })
}

export function getContentLength(url: string) {
  return $fetch.raw(url, {
    method: 'HEAD'
  }).then(res => Number(res.headers.get('Content-Length')))
}

