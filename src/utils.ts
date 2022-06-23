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

export async function download(chunk: TChunk) {
  const response = await $fetch.raw(chunk.url, {
    // @ts-expect-error 目前不支持等待pr https://github.com/unjs/ohmyfetch/pull/100
    responseType: 'stream',
    headers: {
      Range: `bytes=${chunk.start}-${chunk.end}`
    },
  })
  const receiveArr = new Array()

  let receivedLength = 0
  const reader = response.body!.getReader()
  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      const blob = new Blob(receiveArr.map(item => item.buffer), { type: contentType })
      chunk.done(blob)
      return chunk
    }

    receiveArr.push(value)
    receivedLength += value.length
    chunk.progress = (receivedLength - 1) / chunk.size
    chunk.emitter.emit('progress', chunk.progress)
  }
}
