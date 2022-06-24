import { $fetch } from 'ohmyfetch'
import { TChunk } from './chunk';

export function getContentLength(url: string) {
  return $fetch.raw(url, {
    method: 'HEAD'
  }).then(res => Number(res.headers.get('Content-Length')))
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

export async function download(chunk: TChunk, options: {
  controller: AbortController
  retry: number
}): Promise<TChunk> {
  try {
    const response = await $fetch.raw(chunk.url, {
      signal: options.controller.signal,
      responseType: 'stream',
      headers: {
        Range: `bytes=${chunk.head}-${chunk.end}`
      },
      mode: 'cors'
    })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const reader = response.body!.getReader()
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        const blob = new Blob([chunk.buffer], { type: contentType })
        chunk.done(blob)
        return chunk
      }
      chunk.append(value)
    }
  } catch (err) {
    if (options.retry > 0) {
      await new Promise<void>((resolve, reject) => {
        setTimeout(resolve, 1000)
      })
      return await download(chunk, {
        ...options,
        retry: options.retry - 1
      })
    } else {
      throw err
    }
  }
}
