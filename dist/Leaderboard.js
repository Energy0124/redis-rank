"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Leaderboard = void 0;
var Commands_1 = require("./Commands");
var ExportStream_1 = __importDefault(require("./ExportStream"));
var Leaderboard = /** @class */ (function () {
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
    function Leaderboard(client, key, options) {
        this.client = client;
        this.key = key;
        this.options = options;
        Commands_1.extendRedisClient(this.client);
    }
    /**
     * Retrieve the score of an entry. If it doesn't exist, it returns null
     *
     * Complexity: `O(1)`
     *
     * @param id entry id
     */
    Leaderboard.prototype.score = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var score;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.zscore(this.key, id)];
                    case 1:
                        score = _a.sent();
                        return [2 /*return*/, score === null ? null : parseFloat(score)];
                }
            });
        });
    };
    /**
     * Retrieve the rank of an entry. If it doesn't exist, it returns null
     *
     * Complexity: `O(log(N))` where N is the number of entries in the
     * leaderboard
     *
     * @param id entry id
     */
    Leaderboard.prototype.rank = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rank;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (this.options.sortPolicy === 'high-to-low' ?
                            this.client.zrevrank(this.key, id) :
                            this.client.zrank(this.key, id))];
                    case 1:
                        rank = _a.sent();
                        return [2 /*return*/, rank === null ? null : (rank + 1)];
                }
            });
        });
    };
    /**
     * Retrieve an entry. If it doesn't exist, it returns null
     *
     * Complexity: `O(log(N))` where N is the number of entries in the
     * leaderboard
     *
     * @param id entry id
     */
    Leaderboard.prototype.find = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (this.options.sortPolicy === 'high-to-low' ?
                            // @ts-ignore
                            this.client.zrevfind(this.key, id) :
                            // @ts-ignore
                            this.client.zfind(this.key, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, (result[0] === false || result[1] === false || result[0] === null || result[1] === null) ? null : {
                                id: id,
                                score: parseFloat(result[0]),
                                rank: result[1] + 1
                            }];
                }
            });
        });
    };
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
    Leaderboard.prototype.at = function (rank) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (rank <= 0)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, this.list(rank, rank)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length == 0 ? null : result[0]];
                }
            });
        });
    };
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
    Leaderboard.prototype.updateOne = function (id, value, updatePolicy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.update([{ id: id, value: value }], updatePolicy)];
                    case 1: return [2 /*return*/, (_a.sent())[0]];
                }
            });
        });
    };
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
    Leaderboard.prototype.update = function (entries, updatePolicy) {
        return __awaiter(this, void 0, void 0, function () {
            var pipeline, limited, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(entries))
                            entries = [entries];
                        pipeline = this.client.pipeline();
                        this.updatePipe(entries, pipeline, updatePolicy);
                        limited = this.limitPipe(pipeline);
                        return [4 /*yield*/, Leaderboard.execPipeline(pipeline)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, (limited ? result.slice(0, -1) : result).map(parseFloat)];
                }
            });
        });
    };
    /**
     * Applies the limit top N restriction (if enabled)
     *
     * @param pipeline ioredis pipeline
     * @returns if the leaderboard has `limitTopN` enabled
     */
    Leaderboard.prototype.limitPipe = function (pipeline) {
        var limited = (this.options.limitTopN && this.options.limitTopN > 0);
        if (limited) {
            if (this.options.sortPolicy === 'high-to-low')
                // @ts-ignore
                pipeline.zrevkeeptop(this.key, this.options.limitTopN);
            else
                // @ts-ignore
                pipeline.zkeeptop(this.key, this.options.limitTopN);
        }
        return limited;
    };
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
    Leaderboard.prototype.updatePipe = function (entries, pipeline, updatePolicy) {
        var fn = null;
        switch (updatePolicy || this.options.updatePolicy) {
            case 'replace':
                fn = pipeline.zadd.bind(pipeline);
                break;
            case 'aggregate':
                fn = pipeline.zincrby.bind(pipeline);
                break;
            case 'best':
                fn = this.options.sortPolicy === 'high-to-low' ?
                    // @ts-ignore
                    pipeline.zrevbest.bind(pipeline) :
                    // @ts-ignore
                    pipeline.zbest.bind(pipeline);
                break;
        }
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            fn(this.key, entry.value, entry.id);
        }
    };
    /**
     * Remove one or more entries from the leaderboard
     *
     * Complexity: `O(M*log(N))` where N is the number of entries in the
     * leaderboard and M the number of entries to be removed
     */
    Leaderboard.prototype.remove = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.zrem(this.key, ids)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove all the entries from the leaderboard
     *
     * Note: it will delete the underlying Redis key
     *
     * Complexity: `O(N)` where N is the number of entries in the leaderboard
     */
    Leaderboard.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.del(this.key)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieve entries between ranks
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M the number of entries returned
     *
     * @param lower lower bound to query (inclusive)
     * @param upper upper bound to query (inclusive)
     */
    Leaderboard.prototype.list = function (lower, upper) {
        return __awaiter(this, void 0, void 0, function () {
            var result, entries, rank, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lower = Math.max(lower, 1);
                        upper = Math.max(upper, 1);
                        return [4 /*yield*/, this.client[this.options.sortPolicy === 'low-to-high' ? 'zrange' : 'zrevrange'](this.key, lower - 1, upper - 1, 'WITHSCORES')];
                    case 1:
                        result = _a.sent();
                        entries = [];
                        rank = lower;
                        for (i = 0; i < result.length; i += 2) {
                            entries.push({
                                id: result[i],
                                score: parseFloat(result[i + 1]),
                                rank: rank++
                            });
                        }
                        return [2 /*return*/, entries];
                }
            });
        });
    };
    /**
     * Retrieve entries between scores
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M the number of entries returned
     *
     * @param lower lower bound to query (inclusive)
     * @param upper upper bound to query (inclusive)
     */
    Leaderboard.prototype.listByScore = function (lower, upper) {
        return __awaiter(this, void 0, void 0, function () {
            var result, entries, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client[this.options.sortPolicy === 'low-to-high' ? 'zrangebyscore' : 'zrevrangebyscore'](this.key, this.options.sortPolicy === 'low-to-high' ? lower : upper, this.options.sortPolicy === 'low-to-high' ? upper : lower, 'WITHSCORES')];
                    case 1:
                        result = _a.sent();
                        entries = [];
                        for (i = 0; i < result.length; i += 2) {
                            entries.push({
                                id: result[i],
                                score: parseFloat(result[i + 1])
                            });
                        }
                        return [2 /*return*/, entries];
                }
            });
        });
    };
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
    Leaderboard.prototype.top = function (max) {
        if (max === void 0) { max = 10; }
        return this.list(1, max);
    };
    /**
     * Retrieve the bottom entries (from worst to better)
     *
     * Complexity: `O(log(N)+M)` where N is the number of entries in the
     * leaderboard and M is `max`
     *
     * @param max number of entries to return
     */
    Leaderboard.prototype.bottom = function (max) {
        if (max === void 0) { max = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var pipeline, results, entries, list, rank, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = this.client.pipeline();
                        pipeline.zcard(this.key);
                        pipeline[this.options.sortPolicy === 'low-to-high' ? 'zrange' : 'zrevrange'](this.key, -Math.max(1, max), -1, 'WITHSCORES');
                        return [4 /*yield*/, Leaderboard.execPipeline(pipeline)];
                    case 1:
                        results = _a.sent();
                        entries = [];
                        list = results[1];
                        rank = results[0] - list.length + 1;
                        for (i = 0; i < list.length; i += 2) {
                            entries.push({
                                id: list[i],
                                score: parseFloat(list[i + 1]),
                                rank: rank++,
                            });
                        }
                        return [2 /*return*/, entries.reverse()];
                }
            });
        });
    };
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
    Leaderboard.prototype.around = function (id, distance, fillBorders) {
        if (fillBorders === void 0) { fillBorders = false; }
        return __awaiter(this, void 0, void 0, function () {
            var result, entries, rank, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.zaround(this.key, id, Math.max(distance, 0), (fillBorders === true).toString(), this.options.sortPolicy)];
                    case 1:
                        result = _a.sent();
                        entries = [];
                        rank = 0;
                        for (i = 0; i < result[1].length; i += 2) {
                            entries.push({
                                id: result[1][i],
                                score: parseFloat(result[1][i + 1]),
                                rank: 1 + result[0] + rank++
                            });
                        }
                        return [2 /*return*/, entries];
                }
            });
        });
    };
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
    Leaderboard.prototype.exportStream = function (batchSize) {
        return new ExportStream_1.default({
            batchSize: batchSize,
            leaderboard: this
        });
    };
    /**
     * Retrieve the number of entries in the leaderboard
     *
     * Complexity: `O(1)`
     */
    Leaderboard.prototype.count = function () {
        return this.client.zcard(this.key);
    };
    Object.defineProperty(Leaderboard.prototype, "redisClient", {
        get: function () {
            return this.client;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Leaderboard.prototype, "redisKey", {
        get: function () {
            return this.key;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Leaderboard.prototype, "sortPolicy", {
        get: function () {
            return this.options.sortPolicy;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Leaderboard.prototype, "updatePolicy", {
        get: function () {
            return this.options.updatePolicy;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Executes a IORedis.Pipeline, throws if any command resulted in error.
     *
     * @param pipeline ioredis pipeline
     * @returns array of each command result
     */
    Leaderboard.execPipeline = function (pipeline) {
        return __awaiter(this, void 0, void 0, function () {
            var outputs, results, _i, outputs_1, _a, err, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, pipeline.exec()];
                    case 1:
                        outputs = _b.sent();
                        results = [];
                        for (_i = 0, outputs_1 = outputs; _i < outputs_1.length; _i++) {
                            _a = outputs_1[_i], err = _a[0], result = _a[1];
                            /* istanbul ignore next */
                            if (err)
                                throw err;
                            results.push(result);
                        }
                        return [2 /*return*/, results];
                }
            });
        });
    };
    return Leaderboard;
}());
exports.Leaderboard = Leaderboard;
