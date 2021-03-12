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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardMatrix = void 0;
var Leaderboard_1 = require("./Leaderboard");
var PeriodicLeaderboard_1 = require("./PeriodicLeaderboard");
var LeaderboardMatrix = /** @class */ (function () {
    /**
     * Create a matrix of leaderboards
     *
     * @param client ioredis client
     * @param baseKey prefix for the Redis key of all leaderboards in the matrix
     * @param options leaderboard matrix options
     */
    function LeaderboardMatrix(client, baseKey, options) {
        this.client = client;
        this.baseKey = baseKey;
        this.options = options;
        this.matrix = {};
        for (var _i = 0, _a = options.dimensions; _i < _a.length; _i++) {
            var dim = _a[_i];
            for (var _b = 0, _c = options.features; _b < _c.length; _b++) {
                var feat = _c[_b];
                var key = dim.name + ":" + feat.name;
                var redisKey = baseKey + ":" + key;
                this.matrix[key] =
                    // if a cycle is defined, use a periodic leaderboard
                    // otherwise use a regular leaderboard
                    dim.cycle ?
                        new PeriodicLeaderboard_1.PeriodicLeaderboard(client, redisKey, {
                            leaderboardOptions: feat.options,
                            now: options.now,
                            cycle: dim.cycle,
                        }) :
                        new Leaderboard_1.Leaderboard(client, redisKey, feat.options);
            }
        }
        this.allDimensions = this.options.dimensions.map(function (d) { return d.name; });
        this.allFeatures = this.options.features.map(function (d) { return d.name; });
    }
    /**
     * Get the raw leaderboard object. The difference with `getLeaderboard` is
     * that you get the underlying periodic leaderboard wrapper instead of
     * a specific leaderboard of a periodic cycle.
     *
     * @param dimension dimension name
     * @param feature feature name
     */
    LeaderboardMatrix.prototype.getRawLeaderboard = function (dimension, feature) {
        var key = dimension + ":" + feature;
        var lb = this.matrix[key];
        return lb ? lb : null;
    };
    /**
     * Get a leaderboard in the matrix
     *
     * Note: returns null if the dimension/feature pair is invalid
     *
     * @param dimension dimension name
     * @param feature feature name
     * @param time time (for periodic leaderboards). If not provided, `now()` will be used
     */
    LeaderboardMatrix.prototype.getLeaderboard = function (dimension, feature, time) {
        var lb = this.getRawLeaderboard(dimension, feature);
        if (!lb) // invalid leaderboard
            return null;
        if (lb instanceof PeriodicLeaderboard_1.PeriodicLeaderboard)
            lb = lb.getLeaderboardAt(time);
        return lb;
    };
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
    LeaderboardMatrix.prototype.update = function (entries, dimensions, updatePolicy) {
        if (!Array.isArray(entries))
            entries = [entries];
        if (!dimensions || dimensions.length === 0)
            dimensions = this.options.dimensions.map(function (x) { return x.name; });
        var pipeline = this.client.pipeline();
        for (var _i = 0, dimensions_1 = dimensions; _i < dimensions_1.length; _i++) {
            var dim = dimensions_1[_i];
            var _loop_1 = function (feat) {
                var updates = entries
                    .map(function (e) { return ({ id: e.id, value: e.values[feat.name] }); })
                    .filter(function (e) { return e.value !== undefined; });
                if (updates.length) {
                    var lb = this_1.getLeaderboard(dim, feat.name);
                    if (lb) {
                        lb.updatePipe(updates, pipeline, updatePolicy);
                        lb.limitPipe(pipeline);
                    }
                }
            };
            var this_1 = this;
            for (var _a = 0, _b = this.options.features; _a < _b.length; _a++) {
                var feat = _b[_a];
                _loop_1(feat);
            }
        }
        return Leaderboard_1.Leaderboard.execPipeline(pipeline);
    };
    /**
     * Remove one or more entries from the leaderboards
     *
     * @param ids ids to remove
     * @param dimensions dimensions to remove from. If empty or undefined, entries will be removed from all dimensions
     * @param features features to remove from. If empty or undefined, entries will be removed from all features
     */
    LeaderboardMatrix.prototype.remove = function (ids, dimensions, features) {
        return __awaiter(this, void 0, void 0, function () {
            var pipeline, _i, dimensions_2, dim, _a, features_1, feat, lb;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dimensions = !dimensions || dimensions.length === 0 ? this.allDimensions : dimensions;
                        features = !features || features.length === 0 ? this.allFeatures : features;
                        pipeline = this.client.pipeline();
                        for (_i = 0, dimensions_2 = dimensions; _i < dimensions_2.length; _i++) {
                            dim = dimensions_2[_i];
                            for (_a = 0, features_1 = features; _a < features_1.length; _a++) {
                                feat = features_1[_a];
                                lb = this.getLeaderboard(dim, feat);
                                if (lb)
                                    pipeline.zrem(lb.redisKey, ids);
                            }
                        }
                        return [4 /*yield*/, pipeline.exec()];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieve an entry. If it doesn't exist, it returns null
     *
     * @param id entry id
     * @param filter filter to apply
     */
    LeaderboardMatrix.prototype.find = function (id, filter) {
        if (filter === void 0) { filter = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.execMatrix('zmatrixfind', filter, null, id)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length ? result[0] : null];
                }
            });
        });
    };
    /**
     * Retrieve entries between ranks
     *
     * @param dimensionToSort dimension to perform the sorting
     * @param featureToSort feature to perform the sorting
     * @param lower lower bound to query (inclusive)
     * @param upper upper bound to query (inclusive)
     * @param filter filter to apply
     */
    LeaderboardMatrix.prototype.list = function (dimensionToSort, featureToSort, lower, upper, filter) {
        if (filter === void 0) { filter = {}; }
        return this.execMatrixSort('zmatrixrange', filter, dimensionToSort, featureToSort, Math.max(1, lower) - 1, Math.max(1, upper) - 1);
    };
    /**
     * Retrieve the top entries
     *
     * @param max max number of entries to return
     */
    LeaderboardMatrix.prototype.top = function (dimensionToSort, featureToSort, max, filter) {
        if (max === void 0) { max = 10; }
        if (filter === void 0) { filter = {}; }
        return this.list(dimensionToSort, featureToSort, 1, max, filter);
    };
    /**
     * Retrieve the bottom entries (from worst to better)
     *
     * @param max max number of entries to return
     */
    LeaderboardMatrix.prototype.bottom = function (dimensionToSort, featureToSort, max, filter) {
        if (max === void 0) { max = 10; }
        if (filter === void 0) { filter = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.execMatrixSort('zmatrixrange', filter, dimensionToSort, featureToSort, -Math.max(1, max), -1)];
                    case 1: return [2 /*return*/, (_a.sent()).reverse()];
                }
            });
        });
    };
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
    LeaderboardMatrix.prototype.around = function (dimensionToSort, featureToSort, id, distance, fillBorders, filter) {
        if (fillBorders === void 0) { fillBorders = false; }
        if (filter === void 0) { filter = {}; }
        return this.execMatrixSort('zmatrixaround', filter, dimensionToSort, featureToSort, id, Math.max(distance, 0), (fillBorders === true).toString());
    };
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
    LeaderboardMatrix.prototype.showcase = function (dimensionOrder, featureToSort, threshold, filter) {
        if (filter === void 0) { filter = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var counts, highest, highestDim, _i, dimensionOrder_1, dim, count;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (dimensionOrder.length === 0 || threshold < 0)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, this.count()];
                    case 1:
                        counts = _c.sent();
                        highest = 0;
                        highestDim = null;
                        _i = 0, dimensionOrder_1 = dimensionOrder;
                        _c.label = 2;
                    case 2:
                        if (!(_i < dimensionOrder_1.length)) return [3 /*break*/, 6];
                        dim = dimensionOrder_1[_i];
                        count = counts[dim] ? (counts[dim][featureToSort] || 0) : 0;
                        if (!(count >= threshold)) return [3 /*break*/, 4];
                        _a = {
                            dimension: dim,
                            feature: featureToSort
                        };
                        return [4 /*yield*/, this.top(dim, featureToSort, threshold, filter)];
                    case 3: return [2 /*return*/, (_a.entries = _c.sent(),
                            _a)];
                    case 4:
                        if (count > highest) {
                            highest = count;
                            highestDim = dim;
                        }
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6:
                        if (highestDim === null)
                            return [2 /*return*/, null];
                        _b = {
                            dimension: highestDim,
                            feature: featureToSort
                        };
                        return [4 /*yield*/, this.top(highestDim, featureToSort, threshold, filter)];
                    case 7: return [2 /*return*/, (_b.entries = _c.sent(),
                            _b)];
                }
            });
        });
    };
    /**
     * Retrieve the number of entries in each leaderboard
     */
    LeaderboardMatrix.prototype.count = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pipeline, _i, _a, dim, _b, _c, feat, lb, result, counts, i, _d, _e, dim, dimCounts, _f, _g, feat;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        pipeline = this.client.pipeline();
                        for (_i = 0, _a = this.options.dimensions; _i < _a.length; _i++) {
                            dim = _a[_i];
                            for (_b = 0, _c = this.options.features; _b < _c.length; _b++) {
                                feat = _c[_b];
                                lb = this.getLeaderboard(dim.name, feat.name);
                                pipeline.zcard(lb.redisKey);
                            }
                        }
                        result = {};
                        return [4 /*yield*/, Leaderboard_1.Leaderboard.execPipeline(pipeline)];
                    case 1:
                        counts = _h.sent();
                        i = 0;
                        for (_d = 0, _e = this.options.dimensions; _d < _e.length; _d++) {
                            dim = _e[_d];
                            dimCounts = {};
                            for (_f = 0, _g = this.options.features; _f < _g.length; _f++) {
                                feat = _g[_f];
                                dimCounts[feat.name] = counts[i++];
                            }
                            result[dim.name] = dimCounts;
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
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
    LeaderboardMatrix.prototype.execMatrixSort = function (fnName, filter, dimensionToSort, featureToSort) {
        var _a, _b;
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        var sortLb = this.getLeaderboard(dimensionToSort, featureToSort);
        if (!sortLb)
            return Promise.resolve([]);
        // Check: the sort leaderboard must be in the filter list
        if (((_a = filter.dimensions) === null || _a === void 0 ? void 0 : _a.length) && !filter.dimensions.includes(dimensionToSort))
            filter.dimensions.push(dimensionToSort);
        if (((_b = filter.features) === null || _b === void 0 ? void 0 : _b.length) && !filter.features.includes(featureToSort))
            filter.features.push(featureToSort);
        return this.execMatrix.apply(this, __spreadArray([fnName, filter, sortLb.redisKey], args));
    };
    /**
     * Execute and parse the result of a matrix script
     *
     * @param fnName script to execute
     * @param filter filter to apply
     * @param sortKey sorting key (if apply)
     * @param args extra arguments for the script
     */
    LeaderboardMatrix.prototype.execMatrix = function (fnName, filter, sortKey) {
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var queryInfo, result, entries, _a, result_1, r, e;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        queryInfo = this.getQueryInfo(filter);
                        if (!queryInfo)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, (_b = this.client)[fnName].apply(_b, __spreadArray([queryInfo.keys.length,
                                queryInfo.keys,
                                queryInfo.sortPolicies,
                                sortKey ? queryInfo.keys.indexOf(sortKey) + 1 : -1], args))];
                    case 1:
                        result = _c.sent();
                        entries = [];
                        for (_a = 0, result_1 = result; _a < result_1.length; _a++) {
                            r = result_1[_a];
                            e = this.parseEntry(r, queryInfo);
                            if (e)
                                entries.push(e);
                        }
                        return [2 /*return*/, entries];
                }
            });
        });
    };
    /**
     * Parse the result of the function `retrieveEntry` to MatrixEntry
     *
     * @param data result of `retrieveEntry`
     * @param info query information
     */
    LeaderboardMatrix.prototype.parseEntry = function (data, info) {
        //if(data.length < 1 + 2 * info.dimensions.length * info.features.length)
        //    return null;
        var i = 0;
        var valid = false;
        var result = {
            id: data[i++],
            ranks: {},
            scores: {}
        };
        for (var _i = 0, _a = info.dimensions; _i < _a.length; _i++) {
            var dim = _a[_i];
            var empty = true;
            var scores = {};
            var ranks = {};
            for (var _b = 0, _c = info.features; _b < _c.length; _b++) {
                var feat = _c[_b];
                var score = parseFloat(data[i++]);
                if (!isNaN(score)) {
                    scores[feat] = score;
                    ranks[feat] = parseInt(data[i++]) + 1;
                    valid = true;
                    empty = false;
                }
                else
                    i++; // skip null score
            }
            if (!empty) {
                result.scores[dim] = scores;
                result.ranks[dim] = ranks;
            }
        }
        return valid ? result : null;
    };
    /**
     * Generates an object with settings to execute matrix queries
     *
     * Note: this object cannot be cached because periodic leaderboards may
     * change the keys anytime
     *
     * @param filter filter to apply
     */
    LeaderboardMatrix.prototype.getQueryInfo = function (filter) {
        var _a;
        var result = {
            features: [],
            dimensions: [],
            keys: [],
            sortPolicies: []
        };
        // only filtered or all
        result.dimensions = filter.dimensions || this.allDimensions;
        result.features = filter.features || this.allFeatures;
        for (var _i = 0, _b = result.dimensions; _i < _b.length; _i++) {
            var dim = _b[_i];
            for (var _c = 0, _d = this.options.features; _c < _d.length; _c++) {
                var feat = _d[_c];
                if (((_a = filter.features) === null || _a === void 0 ? void 0 : _a.length) && !filter.features.includes(feat.name))
                    continue; // filtered
                var lb = this.getLeaderboard(dim, feat.name);
                // Note: we throw in this assertion instead of continue
                // to ensure featureKeys match the order of this.options.features
                /* istanbul ignore next */
                if (!lb)
                    throw new Error("Assertion: Leaderboard should exist");
                result.keys.push(lb.redisKey);
                result.sortPolicies.push(feat.options.sortPolicy);
            }
        }
        if (result.keys.length === 0)
            return null;
        return result;
    };
    return LeaderboardMatrix;
}());
exports.LeaderboardMatrix = LeaderboardMatrix;
