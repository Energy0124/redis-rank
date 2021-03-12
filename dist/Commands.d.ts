import { Redis } from 'ioredis';
/**
 * Defines multiple commands useful to manage leaderboards:
 * * `zbest` & `zrevbest`: replace the score of the specified member if it
 * doesn't exist or the provided score is (**lower** / **higher**) than the old one. Returns the updated score
 * * `zfind` & `zrevfind`: find the score and rank of a given member
 * * `zkeeptop` & `zrevkeeptop`: removes all members that are not in the top N
 * * `zaround`: return the entries around an entry in a defined distance with
 * a fill border policy
 * * `zmatrixfind`, `zmatrixrange` and `zmatrixaround`: equivalent to their
 * non-matrix versions but using a matrix of leaderboards
 *
 * @see https://github.com/luin/ioredis#lua-scripting
 * @param client the client to define the commands
 */
export declare function extendRedisClient(client: Redis): void;
