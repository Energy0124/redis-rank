import { Redis } from 'ioredis';
import { Leaderboard, LeaderboardOptions } from './Leaderboard';
/** uniquely identifies a cycle */
export declare type CycleKey = string;
export declare type DefaultCycles = 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export declare type NowFunction = () => Date;
export declare type CycleFunction = (time: Date) => CycleKey;
/**
 * The cycle of a periodic leaderboard.
 * You can use one of the predefined cycles:
 * `minute`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `all-time`
 *
 * Or you can specify a custom function, taking a Date object and returning the
 * corresponding CycleKey for the provided time (internally this is the
 * suffix for the Redis key)
 */
export declare type PeriodicLeaderboardCycle = CycleFunction | DefaultCycles;
export declare type PeriodicLeaderboardOptions = {
    /** underlying leaderboard options  */
    leaderboardOptions: LeaderboardOptions;
    /** cycle */
    cycle: PeriodicLeaderboardCycle;
    /** function to evaluate the current time */
    now?: NowFunction;
};
export declare class PeriodicLeaderboard {
    readonly client: Redis;
    readonly baseKey: string;
    readonly options: PeriodicLeaderboardOptions;
    private readonly leaderboards;
    /**
     * Create a new periodic leaderboard
     *
     * Use `getCurrentLeaderboard` to get the leaderboard of the current cycle
     *
     * @param client ioredis client
     * @param baseKey prefix for all the leaderboards
     * @param options periodic leaderboard options
     */
    constructor(client: Redis, baseKey: string, options: PeriodicLeaderboardOptions);
    /**
     * Get the cycle key at a specified date and time
     *
     * @param time the time
     */
    getKey(time: Date): CycleKey;
    /**
     * Get the leaderboard for the provided cycle key
     *
     * @param key cycle key
     */
    getLeaderboard(key: CycleKey): Leaderboard;
    /**
     * Get the leaderboard at the specified date and time. If `time` is not
     * provided, it will use the time returned by `now()`.
     *
     * @param time the time
     */
    getLeaderboardAt(time?: Date): Leaderboard;
    /**
     * Get the cycle key that should be used based on the time returned
     * by `now()`
     */
    getKeyNow(): CycleKey;
    /**
     * Get the current leaderboard based on the time returned by `now()`
     */
    getLeaderboardNow(): Leaderboard;
    /**
     * Find all the active cycle keys in the database.
     * Use this function sparsely, it uses `SCAN` over the whole database to
     * find matches.
     *
     * Complexity: `O(N)` where N is the number of keys in the Redis database
     */
    getExistingKeys(): Promise<CycleKey[]>;
}
