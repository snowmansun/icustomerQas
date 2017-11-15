var config = require("config");
var pg = require("pg");
var Q = require("q");

function db() {
    //构造函数
}

db.connect = function (callback) {
    var defer = Q.defer();
    var connectStr = config.conString;
    pg.defaults.ssl = true;
    pg.connect(connectStr, function (err, client, done) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve({ client: client, done: done });
        }
    });
    return defer.promise.nodeify(callback);
};

db.query = function (sql, params, callback) {
    if (typeof params == 'function') {
        callback = params;
        params = [];
    }
    if (!params) {
        params = [];
    }
    if (!sql) {
        var err = new Error("sql is empty!");
        var defer3 = Q.defer();
        return defer3.reject(err).nodeify(callback);
    }

    //是否打印SQL语句
    if (config.debug) {
        console.log('[SQL:]', sql, '[:SQL]');
        console.log('[PARAMS:]', params, '[:PARAMS]');
    }
    return this.connect()
        .then(function (result) {
            var client = result.client;
            var done = result.done;
            var defer = Q.defer();
            client.query(sql, params, function (err, result) {
                done();
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve(result);
                }
            })
            return defer.promise;
        })
        .nodeify(callback);
};

module.exports = db;