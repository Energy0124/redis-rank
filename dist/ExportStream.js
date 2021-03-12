"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
/**
 * A readable stream that iterates all entries in a leaderboard in batches
 *
 * Note that the stream guarantees to traverse all entries only if there
 * are no updates during retrival
 */
var ExportStream = /** @class */ (function (_super) {
    __extends(ExportStream, _super);
    function ExportStream(options) {
        var _this = _super.call(this, __assign(__assign({}, options), { objectMode: true })) || this;
        _this.options = options;
        _this._Index = 1;
        _this._Done = false;
        return _this;
    }
    ExportStream.prototype._read = function () {
        var _this = this;
        if (this._Done) {
            this.push(null);
            return;
        }
        this.options.leaderboard.list(this._Index, this._Index + this.options.batchSize - 1).then(function (entries) {
            if (entries.length < _this.options.batchSize) {
                // finished
                _this._Done = true;
                if (entries.length === 0) {
                    _this.push(null);
                    return;
                }
            }
            _this._Index += _this.options.batchSize;
            _this.push(entries);
        }).catch(function (err) { return _this.emit('error', err); });
    };
    ExportStream.prototype._destroy = function (_error, callback) {
        this._Done = true;
        callback();
    };
    return ExportStream;
}(stream_1.Readable));
exports.default = ExportStream;
