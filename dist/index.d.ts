import { TChunk } from './chunk';
export declare type TelechargerEvent = {
    progress: number;
    done: Blob;
    error: Error;
};
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
export declare class UnsupportedRangeError extends Error {
    constructor(message: string);
}
export declare function telecharger(url: string, options?: TelechargerOptions): Promise<{
    chunks: TChunk[];
    emitter: import("mitt").Emitter<TelechargerEvent>;
    start: () => Promise<void>;
    pause: () => void;
    resume: () => void;
}>;
