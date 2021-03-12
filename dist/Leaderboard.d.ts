/// <reference types="node" />
import { Readable } from 'stream';
import { Redis, KeyType, Pipeline } from 'ioredis';
/** Entry identifier */
export declare type ID = string;
/** Score value */
export declare type Score = number;
/** Position in the leaderboard, determined by the sort policy. 1-based */
export declare type Rank = number;
/**
 * Sort policy
 *
 * * `high-to-low`: sort scores in descending order
 * * `low-to-high`: sort scores in ascending order
 */
export declare type SortPolicy = 'high-to-low' | 'low-to-high';
/**
 * Update policy
 *
 * When an update occurs...
 * * `replace`: the new score will replace the previous one
 * * `aggregate`: previous and new scores will be added
 * * `best`: the best score is kept (determined by the sort policy)
 */
export declare type UpdatePolicy = 'replace' | 'aggregate' | 'best';
export declare type LeaderboardOptions = {
    /**
     * Sort policy for this leaderboard
     * @see SortPolicy
     */
    sortPolicy: SortPolicy;
    /**
     * Update policy for this leaderboard
     * @see UpdatePolicy
     */
    updatePolicy: UpdatePolicy;
    /**
     * Keep only the top N entries, determined by the sort policy.
     * This lets you limit the number of entries stored, thus saving memory
     *
     * If not specified, or the value is `0`, then there is no limit
     */
    limitTopN?: number;
};
/**
 * Entry details at the time of the query
 */
export declare type Entry = {
    id: ID;
    score: Score;
    rank: Rank;
};
export declare type IDScorePair = {
    id: ID;
    score: Score;
};
export declare type EntryUpdateQuery = {
    id: ID;
    value: number | Score;
};
export declare class Leaderboard {
    private readonly client;
    private readonly key;
    private readonly options;
    /**
     * Create a new leaderboard
     *
     * Note: the Redis key will not be created until an entry is inserted
     * (aka lazy)
     *
     * @param client ioredis client
     * @param key Redis key for the sorted set. You can use any sorted set, not only the ones created by redis-rank
     * @param options leaderboard options
     */
    constructor(client: Redis, key: KeyType, options: LeaderboardOptions);
    /**
     * Retrieve the score of an entry. If it doesn't exist, it returns null
     *
     * Complexity: `O(1)`
     *
     * @param id entry id
     */
    score(id: ID): Promise<Score | null>;
    /**
     * Retrieve the rank of an entry. If it doesn't exist, it returns null
     *
     * Complexity: `O(log(N))` where N is the number of entries in the
     * leaderboard
     *
     * @param id entry id
     */
    rank(id: ID): Promise<Rank | null>;
    /**
     * Retrieve an entry. If it doesn't exist, it returns null
     *
     * Complexity: `O(log(N))` where N is the number of entries in the
     * leaderboard
     *
     * @param id entry id
     */
    find(id: ID): Promise<Entry | null>;
    /**
     * Retrieve an entry at a specific rank. If the rank is out of bounds,
     * it returns null
     *
     * Complexity: `O(log(N))` where N is the number of entries in the
     * leaderboard
     *
     * Note: This function is an alias for list(rank, rank)[0]
     *
     * @param rank rank to query
     */
    at(rank: Rank): Promise<Entry | null>;
    /**
     * Update one entry. If the entry does not exists, it will be created.
     * The update behaviour is determined by the sort and update policies.
     *
     * Complexity: `O(log(N))` where N is the number of entries in the
     * leaderboard
     *
     * @param id entry id
     * @param value amount or score
     * @param updatePolicy override the default update policy only for this update
     * @returns if the update policy is `aggregate` or `best` then the final
     * score otherwise void
     */
    updateOne(id: ID, value: Score | number, updatePolicy?: UpdatePolicy): Promise<Score | void>;
    /**
     * Update one or more entries. If one of the entries does not exists,
     * it will be created. The update behaviour is determined by the sort and
     * update policies.
     *
     * Complexity: `O(log(N))` for each entry updated, where N is the number of
     * entries in the leaderboard
     *
     * @param entries entry or list of entries to update
     * @param updatePolicy override the default update policy only for this update
     * @returns if the update policy is `aggregate` or `best` then the final
     * score for each entry otherwise void
     */
    update(entries: EntryUpdateQuery | EntryUpdateQuery[], updatePolicy?: UpdatePolicy): Promise<Score[] | void[]>;
    /**
     * Applies the limit top N restriction (if enabled)
     *
     * @param pipeline ioredis pipeline
     * @returns if the leaderboard has `limitTopN` enabled
     */
    limitPipe(pipeline: Pipeline): boolean;
    /**
     * Uses IORedis.Pipeline to batch multiple Redis commands
     *
     * Note: this method alone will not honor `limitTopN` (use `limitPipe`)
     *
     * @see update
     * @param entries list of entries to update
     * @param pipeline ioredis pipeline
     * @param updatePolicy override the default update policy only for this update
     */
    updatePipe(entries: EntryUpdateQuery[], pipeline: Pipeline, updatePolicy?: UpdatePolicy): void;
    /**
     * Remove one or more entries from the leaderboard
     *
     * Complexity: `O(M*log(N))` where N is the number of entries in the
     * leaderboard and M the number of entries to be removed
     */
    remove(ids: ID | ID[]): Promise<void>;
    /**
     * Remove all the entries from the leaderboard
     *
     * Note: it will delete the underlying Redis key
     *
     * Complexity: `O(N)` where N is the number of entries in the leaderboard
     */
    clear(): Promise<void>;
    /**
     * Retrieve entries between ranks
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M the number of entries returned
     *
     * @param lower lower bound to query (inclusive)
     * @param upper upper bound to query (inclusive)
     */
    list(lower: Rank, upper: Rank): Promise<Entry[]>;
    /**
     * Retrieve entries between scores
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M the number of entries returned
     *
     * @param lower lower bound to query (inclusive)
     * @param upper upper bound to query (inclusive)
     */
    listByScore(lower: Score, upper: Score): Promise<IDScorePair[]>;
    /**
     * Retrieve the top entries
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M is `max`
     *
     * Note: This function is an alias for list(1, max)
     *
     * @param max number of entries to return
     */
    top(max?: number): Promise<Entry[]>;
    /**
     * Retrieve the bottom entries (from worst to better)
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M is `max`
     *
     * @param max number of entries to return
     */
    bottom(max?: number): Promise<Entry[]>;
    /**
     * Retrieve the entries around an entry
     *
     * Example with distance = 4:
     * ```
     * +-----+-----+-----+-----+-----+-----+-----+-----+-----+------+
     * | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th |
     * +-----+-----+-----+-----+-----+-----+-----+-----+-----+------+
     *               ↑
     *         queried entry
     *
     * Without fillBorders: [ 1st, 2nd, 3rd, 4th, 5th, 6th, 7th ] // 2 + 1 + 4 = 7 elements
     * With fillBorders:    [ 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th ] // 2 + 1 + 6 = 9 elements
     * ```
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M is 2*`distance`+1
     *
     * @param id id of the entry at the center
     * @param distance number of entries at each side of the queried entry
     * @param fillBorders whether to include entries at the other side if the
     * entry is too close to one of the borders. In other words, it always
     * makes sure to return at least 2*`distance`+1 entries (if there are enough
     * in the leaderboard)
     */
    around(id: ID, distance: number, fillBorders?: boolean): Promise<Entry[]>;
    /**
     * Create a readable stream to iterate all the entries in the leaderboard.
     * Note that the stream guarantees to traverse all entries only if there
     * are no updates during retrival.
     *
     * Complexity: `O(log(N)+M)` each iteration, where N is the number of
     * entries in the leaderboard and M the batch size
     *
     * @param batchSize number of entries to retrieve per iteration
     * @returns a stream to iterate every entry in the leaderboard (in batches)
     */
    exportStream(batchSize: number): Readable;
    /**
     * Retrieve the number of entries in the leaderboard
     *
     * Complexity: `O(1)`
     */
    count(): Promise<number>;
    get redisClient(): Redis;
    get redisKey(): KeyType;
    get sortPolicy(): SortPolicy;
    get updatePolicy(): UpdatePolicy;
    /**
     * Executes a IORedis.Pipeline, throws if any command resulted in error.
     *
     * @param pipeline ioredis pipeline
     * @returns array of each command result
     */
    static execPipeline(pipeline: Pipeline): Promise<any[]>;
}
