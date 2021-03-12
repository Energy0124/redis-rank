import { Redis } from 'ioredis';
import { Leaderboard, LeaderboardOptions, ID, Rank, Score, UpdatePolicy } from './Leaderboard';
import { PeriodicLeaderboard, PeriodicLeaderboardCycle, NowFunction } from './PeriodicLeaderboard';
export declare type DimensionName = string;
export declare type FeatureName = string;
export declare type DimensionDefinition = {
    name: DimensionName;
    cycle?: PeriodicLeaderboardCycle;
};
export declare type FeatureDefinition = {
    name: FeatureName;
    options: LeaderboardOptions;
};
export declare type LeaderboardMatrixOptions = {
    /** leaderboard dimensions. Provide at least one */
    dimensions: DimensionDefinition[];
    /** leaderboard features. Provide at least one */
    features: FeatureDefinition[];
    /** custom function to evaluate the current time for periodic leaderboards */
    now?: NowFunction;
};
export declare type MatrixEntry = {
    /** identifier */
    id: ID;
    /** ranks */
    ranks: {
        [dimension: string]: {
            [feature: string]: Rank;
        };
    };
    /** scores */
    scores: {
        [dimension: string]: {
            [feature: string]: Score;
        };
    };
};
export declare type MatrixShowcase = {
    dimension: DimensionName;
    feature: FeatureName;
    entries: MatrixEntry[];
};
export declare type MatrixCount = {
    [dimension: string]: {
        [feature: string]: number;
    };
};
export declare type MatrixEntryUpdateQuery = {
    id: ID;
    values: {
        [feature: string]: number | Score;
    };
};
/** filter query results */
export declare type MatrixLeaderboardQueryFilter = {
    /**
     * dimensions to include in the result. If undefined or empty,
     * all dimensions will be included
     */
    dimensions?: DimensionName[];
    /**
     * features to include in the result. If undefined or empty,
     * all features will be included
     */
    features?: FeatureName[];
};
export declare class LeaderboardMatrix {
    readonly client: Redis;
    readonly baseKey: string;
    readonly options: LeaderboardMatrixOptions;
    private readonly matrix;
    private readonly allDimensions;
    private readonly allFeatures;
    /**
     * Create a matrix of leaderboards
     *
     * @param client ioredis client
     * @param baseKey prefix for the Redis key of all leaderboards in the matrix
     * @param options leaderboard matrix options
     */
    constructor(client: Redis, baseKey: string, options: LeaderboardMatrixOptions);
    /**
     * Get the raw leaderboard object. The difference with `getLeaderboard` is
     * that you get the underlying periodic leaderboard wrapper instead of
     * a specific leaderboard of a periodic cycle.
     *
     * @param dimension dimension name
     * @param feature feature name
     */
    getRawLeaderboard(dimension: DimensionName, feature: FeatureName): Leaderboard | PeriodicLeaderboard | null;
    /**
     * Get a leaderboard in the matrix
     *
     * Note: returns null if the dimension/feature pair is invalid
     *
     * @param dimension dimension name
     * @param feature feature name
     * @param time time (for periodic leaderboards). If not provided, `now()` will be used
     */
    getLeaderboard(dimension: DimensionName, feature: FeatureName, time?: Date): Leaderboard | null;
    /**
     * Update one or more entries. If one of the entries does not exists,
     * it will be created. The update behaviour is determined by the sort and
     * update policies of each leaderboard in the matrix (or overriden
     * by `updatePolicy`)
     *
     * @param entries entry or list of entries to update
     * @param dimensions filter the update to only this dimensions. If empty or undefined, all dimensions will be updated
     * @param updatePolicy override every default update policy only for this update
     */
    update(entries: MatrixEntryUpdateQuery | MatrixEntryUpdateQuery[], dimensions?: DimensionName[], updatePolicy?: UpdatePolicy): Promise<any>;
    /**
     * Remove one or more entries from the leaderboards
     *
     * @param ids ids to remove
     * @param dimensions dimensions to remove from. If empty or undefined, entries will be removed from all dimensions
     * @param features features to remove from. If empty or undefined, entries will be removed from all features
     */
    remove(ids: ID | ID[], dimensions?: DimensionName[], features?: FeatureName[]): Promise<void>;
    /**
     * Retrieve an entry. If it doesn't exist, it returns null
     *
     * @param id entry id
     * @param filter filter to apply
     */
    find(id: ID, filter?: MatrixLeaderboardQueryFilter): Promise<MatrixEntry | null>;
    /**
     * Retrieve entries between ranks
     *
     * @param dimensionToSort dimension to perform the sorting
     * @param featureToSort feature to perform the sorting
     * @param lower lower bound to query (inclusive)
     * @param upper upper bound to query (inclusive)
     * @param filter filter to apply
     */
    list(dimensionToSort: DimensionName, featureToSort: FeatureName, lower: Rank, upper: Rank, filter?: MatrixLeaderboardQueryFilter): Promise<MatrixEntry[]>;
    /**
     * Retrieve the top entries
     *
     * @param max max number of entries to return
     */
    top(dimensionToSort: DimensionName, featureToSort: FeatureName, max?: number, filter?: MatrixLeaderboardQueryFilter): Promise<MatrixEntry[]>;
    /**
     * Retrieve the bottom entries (from worst to better)
     *
     * @param max max number of entries to return
     */
    bottom(dimensionToSort: DimensionName, featureToSort: FeatureName, max?: number, filter?: MatrixLeaderboardQueryFilter): Promise<MatrixEntry[]>;
    /**
     * Retrieve the entries around an entry
     *
     * @see Leaderboard.around for details
     * @param dimensionToSort dimension to perform the sorting
     * @param featureToSort feature to perform the sorting
     * @param id id of the entry at the center
     * @param distance number of entries at each side of the queried entry
     * @param fillBorders include entries at the other side if the entry is too close to one of the borders
     * @param filter filter to apply
     */
    around(dimensionToSort: DimensionName, featureToSort: FeatureName, id: ID, distance: number, fillBorders?: boolean, filter?: MatrixLeaderboardQueryFilter): Promise<MatrixEntry[]>;
    /**
     * Returns the top `threshold` entries from a leaderboard that has at
     * least `threshold` entries. The `dimensionOrder` defines the order
     * to check the leaderboards, and `featureToSort` the feature (which is fixed).
     * If no dimension meet the threshold, then the dimension with the highest
     * number of entries will be used to query the entries.
     * If all dimensions have 0 entries, then returns null
     *
     * Note: this function actually does two round trips to Redis!
     * (TODO: optimize, haven't done it for simplicity)
     *
     * @param dimensionOrder order to test the dimensions
     * @param featureToSort feature to perform the sorting
     * @param threshold minimum number of entries that should be present in the leaderboard
     * @param filter filter to apply
     */
    showcase(dimensionOrder: DimensionName[], featureToSort: FeatureName, threshold: number, filter?: MatrixLeaderboardQueryFilter): Promise<MatrixShowcase | null>;
    /**
     * Retrieve the number of entries in each leaderboard
     */
    count(): Promise<MatrixCount>;
    /**
     * Execute and parse the result of a matrix script that uses sorting, it
     * checks the dimension/feature pair and ensures that it is not filtered out
     *
     * @param fnName script to execute
     * @param filter filter to apply
     * @param dimensionToSort dimension to perform the sorting
     * @param featureToSort feature to perform the sorting
     * @param args extra arguments for the script
     */
    private execMatrixSort;
    /**
     * Execute and parse the result of a matrix script
     *
     * @param fnName script to execute
     * @param filter filter to apply
     * @param sortKey sorting key (if apply)
     * @param args extra arguments for the script
     */
    private execMatrix;
    /**
     * Parse the result of the function `retrieveEntry` to MatrixEntry
     *
     * @param data result of `retrieveEntry`
     * @param info query information
     */
    private parseEntry;
    /**
     * Generates an object with settings to execute matrix queries
     *
     * Note: this object cannot be cached because periodic leaderboards may
     * change the keys anytime
     *
     * @param filter filter to apply
     */
    private getQueryInfo;
}
