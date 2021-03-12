"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendRedisClient = void 0;
/**
 * `KEYS[1]`: leaderboard key
 * `ARGV[1]`: entry score
 * `ARGV[2]`: entry id
 *
 * Returns the final score
 */
var zbest = function (dir) { return "\n    -- retrieve current score\n    local ps = redis.call('zscore', KEYS[1], ARGV[2]);\n    -- if it doesn't exist or the new score is better\n    if not ps or tonumber(ARGV[1]) " + (dir === 'desc' ? '>' : '<') + " tonumber(ps) then\n        -- replace entry\n        redis.call('zadd', KEYS[1], ARGV[1], ARGV[2])\n        return tonumber(ARGV[1])\n    end\n    return tonumber(ps)\n"; };
/**
 * `KEYS[1]`: leaderboard key
 * `ARGV[1]`: entry id
 *
 * Returns [score, rank]
 */
var zfind = function (dir) { return "\n    return {\n        redis.call('zscore', KEYS[1], ARGV[1]),\n        redis.call('z" + (dir === 'desc' ? 'rev' : '') + "rank', KEYS[1], ARGV[1])\n    }\n"; };
/**
 * `KEYS[1]`: leaderboard key
 * `ARGV[1]`: top N
 */
var zkeeptop = function (dir) { return "\nlocal c = redis.call('zcard', KEYS[1]);\nlocal n = tonumber(ARGV[1])\nlocal dif = c - n\nif dif > 0 then\n    " + (dir === 'asc' ? "\n    -- low to high\n    redis.call('zremrangebyrank', KEYS[1], -1, - dif)\n    " : "\n    -- high to low\n    redis.call('zremrangebyrank', KEYS[1], 0, dif - 1)\n    ") + "\nend\n"; };
var aroundRange = "\nlocal function aroundRange(path, id, distance, fill_borders, sort_dir)\n    local r = redis.call((sort_dir == 'low-to-high') and 'zrank' or 'zrevrank', path, id) -- entry rank\n\n    if r == false or r == nil then\n        -- entry does not exist\n        return { -1, -1, -1, -1 }\n    end\n    \n    local c = redis.call('zcard', path) -- lb size\n    local l = math.max(0, r - distance) -- lower bound rank\n    local h = 0                         -- upper bound rank\n\n    if fill_borders == 'true' then\n        h = l + 2 * distance\n        if h >= c then \n            h = math.min(c, r + distance)\n            l = math.max(0, h - 2 * distance - 1)\n        end\n    else\n        h = math.min(c, r + distance)\n    end\n\n    -- lower bound, upper bound, lb card, query rank\n    return { l, h, c, r };\nend\n";
/**
 * `KEYS[1]`: leaderboard key
 * `ARGV[1]`: entry id
 * `ARGV[2]`: distance
 * `ARGV[3]`: fill_borders ('true' or 'false')
 * `ARGV[4]`: sort_dir ('high-to-low' or 'low-to-high')
 *
 * Returns [ lowest_rank, [[id, score], ...] ]
 */
var zaround = "\n" + aroundRange + "\n\nlocal range = aroundRange(KEYS[1], ARGV[1], ARGV[2], ARGV[3], ARGV[4]);\n-- entry not found\nif range[1] == -1 then return { 0, {} } end\nreturn {\n    range[1],\n    -- retrive final rank\n    redis.call((ARGV[4] == 'low-to-high') and 'zrange' or 'zrevrange', KEYS[1], range[1], range[2], 'WITHSCORES')\n}\n";
var retrieveEntry = "\n-- id: entry id\n-- keys: leaderboard keys\n-- sorts: sort policies for each leaderboard\nlocal function retrieveEntry(id, keys, sorts)\n    local result = {}\n\n    result[#result+1] = id\n\n    for i = 1, #keys, 1 do\n        result[#result+1] = redis.call('zscore', keys[i], id)\n        -- skip zrank if we know it is going to fail\n        if result[#result] == nil then\n            result[#result+1] = nil\n        else\n            result[#result+1] = redis.call((sorts[i] == 'low-to-high') and 'zrank' or 'zrevrank', keys[i], id)\n        end\n    end\n\n    -- [ id, score, rank, score, rank, ...]\n    return result\nend\n";
var retrieveEntries = "\n" + retrieveEntry + "\n\n-- keys: leaderboard keys\n-- sorts: sort policies for each leaderboard\n-- sort_index: index of the key to do the zrange\n-- lower: lower bound rank\n-- upper: upper bound rank\nlocal function retrieveEntries(keys, sorts, sort_index, lower, upper)\n    local ids = redis.call(\n        (sorts[sort_index] == 'low-to-high') and 'zrange' or 'zrevrange',\n        keys[sort_index],\n        lower,\n        upper\n    )\n\n    local results = {}\n\n    for i = 1, #ids, 1 do\n        results[#results+1] = retrieveEntry(ids[i], keys, sorts)\n    end\n    \n    -- [\n    --    [ id, score, rank, score, rank, ...],\n    --    ...\n    -- ]\n    return results\nend\n";
/**
 * `KEYS`: leaderboard keys
 * `ARGV[1 .. #KEYS]`: sort policies for each leaderboard
 * `ARGV[#KEYS + 2]`: id to find
 *
 * Returns an array of size 1 of entries from `retrieveEntry`
 */
var zmatrixfind = "\n" + retrieveEntry + "\nreturn { retrieveEntry(ARGV[#KEYS + 2], KEYS, ARGV) }\n";
/**
 * `KEYS`: leaderboard keys
 * `ARGV[1 .. #KEYS]`: sort policies for each leaderboard
 * `ARGV[#KEYS + 1]`: index of the leaderboard used to sort
 * `ARGV[#KEYS + 2]`: lower rank
 * `ARGV[#KEYS + 3]`: upper rank
 *
 * Returns an array of entries from `retrieveEntry`
 */
var zmatrixrange = "\n" + retrieveEntries + "\nreturn retrieveEntries(\n    KEYS,\n    ARGV,\n    tonumber(ARGV[#KEYS + 1]),\n    ARGV[#KEYS + 2],\n    ARGV[#KEYS + 3]\n)\n";
/**
 * `KEYS`: leaderboard keys
 * `ARGV[1 .. #KEYS]`: sort policies for each leaderboard
 * `ARGV[#KEYS + 1]`: index of the leaderboard used to sort
 * `ARGV[#KEYS + 2]`: entry id
 * `ARGV[#KEYS + 3]`: distance
 * `ARGV[#KEYS + 4]`: fill_borders ('true' or 'false')
 *
 * Returns an array of entries from `retrieveEntry`
 */
var zmatrixaround = "\n" + aroundRange + "\n" + retrieveEntries + "\n\nlocal sortIndex = tonumber(ARGV[#KEYS + 1])\n\nlocal range = aroundRange(\n    KEYS[sortIndex],\n    ARGV[#KEYS + 2],\n    ARGV[#KEYS + 3],\n    ARGV[#KEYS + 4],\n    ARGV[sortIndex]\n)\n\nif range[1] == -1 then return { } end\nreturn retrieveEntries(\n    KEYS,\n    ARGV,\n    sortIndex,\n    range[1],\n    range[2]\n)\n";
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
function extendRedisClient(client) {
    // avoid defining the commands over and over again
    if (client.redisRankExtended)
        return;
    client.defineCommand("zbest", { numberOfKeys: 1, lua: zbest('asc') });
    client.defineCommand("zrevbest", { numberOfKeys: 1, lua: zbest('desc') });
    client.defineCommand("zfind", { numberOfKeys: 1, lua: zfind('asc') });
    client.defineCommand("zrevfind", { numberOfKeys: 1, lua: zfind('desc') });
    client.defineCommand("zkeeptop", { numberOfKeys: 1, lua: zkeeptop('asc') });
    client.defineCommand("zrevkeeptop", { numberOfKeys: 1, lua: zkeeptop('desc') });
    client.defineCommand("zaround", { numberOfKeys: 1, lua: zaround });
    client.defineCommand("zmatrixfind", { lua: zmatrixfind });
    client.defineCommand("zmatrixrange", { lua: zmatrixrange });
    client.defineCommand("zmatrixaround", { lua: zmatrixaround });
    client.redisRankExtended = true;
}
exports.extendRedisClient = extendRedisClient;
