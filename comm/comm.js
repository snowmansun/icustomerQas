var dbHelper = require('../db/dbHelper');
var comm = {};

comm.utcTime = function (time, timezone) {
    var localTime = time.getTime();
    var offset = 3600000 * timezone;
    var utc = localTime - offset;

    return new Date(utc);
}