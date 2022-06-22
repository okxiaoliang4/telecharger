import { $fetch } from 'ohmyfetch'

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

interface SliceDownLoadOptions {
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

export async function sliceDownLoad(url: string, options: SliceDownLoadOptions = {}) {
  const {
    threads = 8,
    chunkSize = 10_240_000
  } = options
  const contentLength = await getContentLength(url)
  const chunks = Math.ceil(contentLength / chunkSize);
  const reqs = new Array<DownloadOptions>(chunks)
  const blobs = new Array(chunks)

  // TODO: 进度条
  for (let i = 0; i < chunks; i++) {
    let start = i * chunkSize;
    let end = i + 1 == chunks ? contentLength - 1 : (i + 1) * chunkSize - 1;
    reqs[i] = { index: i, url, start, end };
  }

  for await (const value of asyncPool(threads, reqs, download)) {
    blobs[value.index] = value.result;
  }

  return new Blob(blobs, { type: blobs[0]?.type })
}

export async function* asyncPool<IN, OUT>(concurrency: number, iterable: ReadonlyArray<IN>, iteratorFn: (item: IN, iterable?: ReadonlyArray<IN>) => Promise<OUT>): AsyncIterableIterator<OUT> {
  const executing = new Set<Promise<IN>>();
  async function consume() {
    const [promise, value] = await Promise.race(executing) as unknown as [Promise<IN>, OUT];
    executing.delete(promise);
    return value;
  }
  for (const item of iterable) {
    const promise = (async () => await iteratorFn(item, iterable))().then(
      value => [promise, value]
    ) as Promise<IN>;
    executing.add(promise);
    if (executing.size >= concurrency) {
      yield await consume();
    }
  }
  while (executing.size) {
    yield await consume();
  }
}

interface DownloadOptions {
  index: number,
  url: string,
  start: number,
  end: number
}

export async function download(options: DownloadOptions) {
  const { index, url, start, end } = options
  const result = await $fetch(url, {
    responseType: 'blob',
    headers: {
      Range: `bytes=${start}-${end}`
    }
  })
  return {
    index,
    result,
  }
}

export function getContentLength(url: string) {
  return $fetch.raw(url, {
    method: 'HEAD'
  }).then(res => Number(res.headers.get('Content-Length')))
}

