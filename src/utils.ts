import { TChunk } from './chunk';

export function getContentLength(url: string) {
  return fetch(url, {
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

export async function download(chunk: TChunk, controller: AbortController) {
  const response = await fetch(chunk.url, {
    signal: controller.signal,
    headers: {
      Range: `bytes=${chunk.head}-${chunk.end}`
    },
  })

  const reader = response.body!.getReader()
  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      const blob = new Blob([chunk.buffer], { type: contentType })
      chunk.done(blob)
      return chunk
    }
    chunk.append(value)
  }
}
