/// <reference types="node" />
import { Readable, ReadableOptions } from 'stream';
import { Leaderboard } from './Leaderboard';
export interface IExportStreamOptions extends ReadableOptions {
    /** number of entries to retrieve per iteration */
    batchSize: number;
    /** source leaderboard */
    leaderboard: Leaderboard;
}
/**
 * A readable stream that iterates all entries in a leaderboard in batches
 *
 * Note that the stream guarantees to traverse all entries only if there
 * are no updates during retrival
 */
export default class ExportStream extends Readable {
    private options;
    private _Index;
    private _Done;
    constructor(options: IExportStreamOptions);
    _read(): void;
    _destroy(_error: Error | null, callback: (error?: Error | null) => void): void;
}
