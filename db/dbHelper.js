var mssql = require('mssql');
var config = require("config");
var dbHelper = {};

var conString = 'Server=tcp:ga98eyp2ih.database.chinacloudapi.cn,1433;Database=eBestStaging;User ID=ebestmobile;Password=Sharepoint@admin;Trusted_Connection=False;Encrypt=True;Connection Timeout=30000;';
//执行sql,返回数据.  
dbHelper.query = function (sql, callBack) {
    console.log('[SQL:]', sql, '[:SQL]');
    var connection = new mssql.Connection(conString, function (err) {
        if (err) {
            console.log(err);
            return;


        }
        var ps = new mssql.PreparedStatement(connection);
        ps.prepare(sql, function (err) {
            if (err) {
                console.log(err);
                return;
            }
            ps.execute('', function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }

                ps.unprepare(function (err) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                        return;
                    }
                    callBack(err, result);
                });
            });
        });
    });
};

dbHelper.getTransaction = function (callback) {
    var connection = new mssql.Connection(conString, function (err) {
        var transaction = new mssql.Transaction(connection);
        callback(mssql, transaction);
    })
};


module.exports = dbHelper;   