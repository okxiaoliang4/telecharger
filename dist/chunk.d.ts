import type { Emitter } from 'mitt';
export declare type TChunkEvents = {
    progress: number;
    done: TChunk;
};
export interface TChunkParameters {
    url: string;
    index: number;
    start: number;
    end: number;
}
export declare class TChunk implements TChunkParameters {
    readonly url: string;
    readonly index: number;
    readonly start: number;
    readonly end: number;
    buffer: Uint8Array;
    head: number;
    blob: Blob | null;
    emitter: Emitter<TChunkEvents>;
    constructor(options: TChunkParameters);
    get progress(): number;
    get size(): number;
    append(value: Uint8Array): void;
    done(blob: Blob): void;
}
