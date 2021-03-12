"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodicLeaderboard = void 0;
var Leaderboard_1 = require("./Leaderboard");
/**
 * Used by `getWeekNumber`. Needed because Date.getTime returns the time in UTC
 * and we use local time.
 */
var msTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
/**
 * Get the week number since January 1st, 1970
 *
 * 345600000 = 4 days in milliseconds
 * 604800000 = 1 week in milliseconds
 *
 * Note: we add 4 days because January 1st, 1970 was thursday (and weeks start
 * on sunday). I think it should be 3 days and not 4, but 3 result in
 * incorrect values. ¯\_(ツ)_/¯
 */
var getWeekNumber = function (time) { return Math.floor((time.getTime() + 345600000 - msTimezoneOffset) / 604800000); };
/**
 * Pad a number with leading zeroes
 *
 * @param input the number
 * @param digits number of digits
 */
var padNumber = function (input, digits) {
    if (digits === void 0) { digits = 2; }
    return (input + '').padStart(digits, '0');
};
/**
 * Note: default functions use local time to determine keys.
 * Tip: You can specify the `now()` function in the periodic leaderboard options
 * to offset the time however you like.
 *
 * Examples:
 * * `yearly`: `y2020`
 * * `weekly`: `w2650` (week number since epoch)
 * * `monthly`: `y2020-m05`
 * * `daily`: `y2020-m05-d15`
 * * `hourly`: `y2020-m05-d15-h22`
 * * `minute`: `y2020-m05-d15-h22-m53`
 */
var CYCLE_FUNCTIONS = {
    'yearly': function (time) { return "y" + time.getFullYear(); },
    'weekly': function (time) { return "w" + padNumber(getWeekNumber(time), 4); },
    'monthly': function (time) { return CYCLE_FUNCTIONS['yearly'](time) + "-m" + padNumber(time.getMonth()); },
    'daily': function (time) { return CYCLE_FUNCTIONS['monthly'](time) + "-d" + padNumber(time.getDate()); },
    'hourly': function (time) { return CYCLE_FUNCTIONS['daily'](time) + "-h" + padNumber(time.getHours()); },
    'minute': function (time) { return CYCLE_FUNCTIONS['hourly'](time) + "-m" + padNumber(time.getMinutes()); }
};
var PeriodicLeaderboard = /** @class */ (function () {
    /**
     * Create a new periodic leaderboard
     *
     * Use `getCurrentLeaderboard` to get the leaderboard of the current cycle
     *
     * @param client ioredis client
     * @param baseKey prefix for all the leaderboards
     * @param options periodic leaderboard options
     */
    function PeriodicLeaderboard(client, baseKey, options) {
        this.client = client;
        this.baseKey = baseKey;
        this.options = options;
        this.leaderboards = new Map();
    }
    /**
     * Get the cycle key at a specified date and time
     *
     * @param time the time
     */
    PeriodicLeaderboard.prototype.getKey = function (time) {
        return (CYCLE_FUNCTIONS[this.options.cycle] || this.options.cycle)(time);
    };
    /**
     * Get the leaderboard for the provided cycle key
     *
     * @param key cycle key
     */
    PeriodicLeaderboard.prototype.getLeaderboard = function (key) {
        var finalKey = this.baseKey + ":" + key;
        var lb = this.leaderboards.get(finalKey);
        if (lb)
            return lb; // hit cache
        // Note: avoid leaking leaderboards
        if (this.leaderboards.size > 100)
            this.leaderboards.clear();
        lb = new Leaderboard_1.Leaderboard(this.client, finalKey, this.options.leaderboardOptions);
        this.leaderboards.set(finalKey, lb);
        return lb;
    };
    /**
     * Get the leaderboard at the specified date and time. If `time` is not
     * provided, it will use the time returned by `now()`.
     *
     * @param time the time
     */
    PeriodicLeaderboard.prototype.getLeaderboardAt = function (time) {
        return this.getLeaderboard(time ? this.getKey(time) : this.getKeyNow());
    };
    /**
     * Get the cycle key that should be used based on the time returned
     * by `now()`
     */
    PeriodicLeaderboard.prototype.getKeyNow = function () {
        return this.getKey(this.options.now ? this.options.now() : new Date());
    };
    /**
     * Get the current leaderboard based on the time returned by `now()`
     */
    PeriodicLeaderboard.prototype.getLeaderboardNow = function () {
        return this.getLeaderboard(this.getKeyNow());
    };
    /**
     * Find all the active cycle keys in the database.
     * Use this function sparsely, it uses `SCAN` over the whole database to
     * find matches.
     *
     * Complexity: `O(N)` where N is the number of keys in the Redis database
     */
    PeriodicLeaderboard.prototype.getExistingKeys = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var stream = _this.client.scanStream({
                match: _this.baseKey + ":*",
                count: 100
            });
            var keys = new Set();
            var addKey = keys.add.bind(keys);
            stream.on('data', function (batch) { return batch.map(addKey); });
            stream.on('error', reject);
            stream.on('end', function () { return resolve(Array.from(keys).map(function (key) { return key.slice(_this.baseKey.length + 1); })); });
        });
    };
    return PeriodicLeaderboard;
}());
exports.PeriodicLeaderboard = PeriodicLeaderboard;
