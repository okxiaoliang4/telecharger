import { TChunk } from './chunk';
export declare function getContentLength(url: string): Promise<number>;
export declare function asyncPool<IN, OUT>(concurrency: number, iterable: ReadonlyArray<IN>, iteratorFn: (item: IN, iterable?: ReadonlyArray<IN>) => Promise<OUT>): AsyncIterableIterator<OUT>;
export declare function download(chunk: TChunk, controller: AbortController): Promise<TChunk>;
