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
    threads = 3,
    chunkSize = 102400
  } = options
  const contentLength = await getContentLength(url)
  const chunks = Math.ceil(contentLength / chunkSize);
  const reqs = new Array<ReturnType<typeof download>>(chunks)

  // TODO: 每下载好一块就从队列中删除，并添加新的下载任务
  // TODO: 逻辑优化
  // TODO: 进度条
  for (let i = 0; i < chunks; i++) {
    let start = i * chunkSize;
    let end = i + 1 == chunks ? contentLength - 1 : (i + 1) * chunkSize - 1;
    reqs[i] = (download(i, url, start, end));
  }

  const results = await Promise.all(reqs)
  console.log(results)
  const blob = new Blob(results.map(item => item.result as Blob), { type: 'image/jpg' })
  console.log(blob);
  const r = window.URL.createObjectURL(blob)
  console.log(r);
  const img = document.createElement('img')
  img.src = r
  document.body.appendChild(img)
}

export function mergeBlob(blobs: Blob[]): Blob { 
  return new Blob(blobs, { type: 'image/jpg' })
}

export async function download(index: number, url: string, start: number, end: number) {
  const result = await $fetch(url, {
    headers: {
      Range: `bytes=${start}-${end}`
    }
  })
  return {
    index,
    result
  }
}

export function getContentLength(url: string) {
  return $fetch.raw(url, {
    method: 'HEAD'
  }).then(res => Number(res.headers.get('Content-Length')))
}

