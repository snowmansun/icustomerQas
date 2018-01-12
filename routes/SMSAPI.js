var express = require('express');
var router = express.Router();
var uuid = require('node-uuid');
var dbHelper = require('../db/dbHelper');
var config = require('../config.json');

var accountSid = config.accountSid;
var authToken = config.authToken;
var activeTime = config.activeTime;
var client = require('twilio')(accountSid, authToken);

router.get('/getsmscode', function (req, res) {
    var mobile = '+' + req.query.mobile;

    var sql = 'Select Top 1 ID,SMSCode,ActiveTime,CreateTime From SMSVerification Where Mobile=\'' + mobile + '\' And IsActive = 1 And DATEADD(mi, ActiveTime, CreateTime) >= GETDATE()';
    dbHelper.query(sql, function (err, result) {
        if (result.length > 0) {
            client.messages.create({
                to: mobile,
                from: config.from,
                body: "Your verification code is:" + result[0].SMSCode,
            }, function (err, message) {
                if (err) {
                    var res_json = {
                        status: false
                    };
                }
                else {
                    var res_json = {
                        status: true
                    };
                }
                res.json(res_json);
            });
        }
        else {
            //生成随机数
            var smscode = "";
            for (var i = 0; i < 6; i++) {
                smscode += Math.floor(Math.random() * 10);
            }
            client.messages.create({
                to: mobile,
                from: config.from,
                body: "Your verification code is:" + smscode,
            }, function (err, message) {
                if (err) {
                    var res_json = {
                        status: false,
                        msg: err.message
                    };
                    res.json(res_json);
                }
                else {
                    var guid = uuid.v4();
                    sql = 'INSERT INTO [SMSVerification] ' +
                        ' ([ID] ' +
                        ' , [Mobile] ' +
                        ' , [SMSCode] ' +
                        ' , [IsActive] ' +
                        ' , [ActiveTime] ' +
                        ' , [CreateTime] ' +
                        ' , [CreateUser]) ' +
                        ' VALUES ' +
                        '      (\'' + guid + '\' ' +
                        '      ,\'' + mobile + '\' ' +
                        '      ,\'' + smscode + '\' ' +
                        '      ,1 ' +
                        '      ,' + activeTime + ' ' +
                        '      ,getdate() ' +
                        '      ,\'Interface\') ';
                    dbHelper.query(sql, function (err, result) {
                        var res_json = {
                            status: true
                        };
                        res.json(res_json);
                    });
                }
            });
        }
    });
});

router.get('/smscodecheck', function (req, res) {
    var mobile = '+'+req.query.mobile;
    var smscode = req.query.smscode;
    var sql = 'Select Top 1 ID,SMSCode,ActiveTime,CreateTime From SMSVerification Where Mobile=\'' + mobile + '\' And IsActive = 1 And DATEADD(mi, ActiveTime, CreateTime) >= GETDATE()';
    dbHelper.query(sql, function (err, result) {
        if (err || result.length <= 0) {
            var res_json = {
                status: true
            };
            res.json(res_json);
        }
        else {
            sql = 'Update SMSVerification Set IsActive=0 Where ID=\'' + result[0].ID + '\' And SMSCode = ' + smscode + '';
            dbHelper.query(sql, function (err, re) {
                if (!err) {
                    console.log(err);
                }
            });
            var res_json = {
                status: true
            };
            res.json(res_json);
        }
    });
});

module.exports = router;