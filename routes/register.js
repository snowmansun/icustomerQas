var express = require('express');
var router = express.Router();
var uuid = require('node-uuid');
var dbHelper = require('../db/dbHelper');
var async = require('async');  
var crypto = require('crypto');

//var accountSid = 'ACc1eb416be0d28c6d05fe30a24f0010f2';
//var authToken = '48ea1e623353b7578d074ed8cb405648';
//var client = require('twilio')(accountSid, authToken); 

//router.get('/getsmscode', function (req, res) {

//    client.messages.create({
//        to: "+8613761214333",
//        from: "+12012989467",
//        body: "This is the ship that made the Kessel Run in fourteen parsecs?",
//    }, function (err, message) {
//        var res_json = {};
//        if (err)
//        {
//            res_json = {
//                status: false
//            };
//        }
//        else {
//            res_json = {
//                status: true
//            };
//        }
//        res.json(res_json);
//    });

//});

router.post('/', function (req, res) {
    var query = 'SELECT mobilephone,accountid FROM dbo.Contact WHERE MobilePhone=\'' + req.body.mobile + '\' and AccountId IN (SELECT id FROM dbo.Account WHERE AccountNumber=\'' + req.body.accountnumber+'\' AND IsDeleted=0) AND IsDeleted=0';
    dbHelper.query(query, function (err, result) {
        if (result.length == 0) {
            res.json({ err_code: 3, err_msg: 'The mobile number is different from the account\'s mobile!' });
        }
        else {
            query = 'select usercode from AccountRegistration where usercode=\'' + req.body.username + '\'';
            dbHelper.query(query, function (err, resCheck) {
                //判断usercode是否被注册过
                if (resCheck.length > 0) {
                    res.json({ err_code: 1, err_msg: 'The user name has exist!' });
                }
                else {
                    query = 'select usercode from AccountRegistration where mobile=\'' + req.body.username + '\' and isactive = 1';
                    dbHelper.query(query, function (err, resMobile) {
                        //判断手机号手否被注册过
                        if (resMobile.length > 0) {
                            res.json({ err_code: 4, err_msg: 'The mobile number has been registered!' });
                        }
                        else {
                            var guid = uuid.v4();
                            var content = req.body.password;
                            //var md5 = crypto.createHash('md5');
                            //md5.update(content);
                            //var pwd = md5.digest('hex');
                            var pwd = content;

                            var sqlReg = 'INSERT INTO [dbo].[AccountRegistration] ' +
                                '      ( Id ' +
                                '       ,[UserCode] ' +
                                '       ,[FirstName] ' +
                                '       ,[LastName] ' +
                                '       ,[Password] ' +
                                '       ,[Email] ' +
                                '       ,[Mobile] ' +
                                '       ,[SmsCode] ' +
                                '       ,[CreateDate] ' +
                                '       ,[UpdateDate]) ' +
                                '  VALUES ' +
                                '      (\'' + guid + '\' ' +
                                '       ,\'' + req.body.username + '\' ' +
                                '       ,\'' + req.body.firstname + '\' ' +
                                '       ,\'' + req.body.lastname + '\' ' +
                                '       ,\'' + pwd + '\' ' +
                                '       ,\'' + req.body.email + '\' ' +
                                '       ,\'' + req.body.mobile + '\' ' +
                                '       ,\'' + req.body.smscode + '\' ' +
                                '       ,getdate() ' +
                                '       ,getdate())';
                            dbHelper.getTransaction(function (sql, transaction) {
                                transaction.begin(function (err) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    //定义一个变量,如果自动回滚,则监听回滚事件并修改为true,无须手动回滚  
                                    var rolledBack = false;

                                    //监听回滚事件  
                                    transaction.on('rollback', function (aborted) {
                                        console.log('监听回滚');
                                        console.log('aborted值 :', aborted);
                                        rolledBack = true;
                                    });

                                    //监听提交事件  
                                    transaction.on('commit', function () {
                                        console.log('监听提交');
                                        rolledBack = true;
                                    });

                                    var request = new sql.Request(transaction);

                                    var tasks = [];
                                    tasks[0] = function (callback) {
                                        console.log("sql[0]:" + sqlReg);
                                        request.query(sqlReg, function (err, result) {
                                            if (err) {
                                                console.log(err);
                                                callback(err, null);
                                                return;
                                            }
                                            console.log('第1条语句成功');
                                            callback(null, result)
                                        })
                                    };

                                    var sqlItem = '';
                                    var i = 1;
                                    tasks.push(function (callback) {
                                        sqlItem = 'INSERT INTO [dbo].[AccountMapping]([AccountId],[RegistrationId],[Rec_time_stamp]) ' +
                                            '  VALUES(\'' + result[0].accountid + '\' ,\'' + guid + '\',getdate())';

                                        console.log("sql[" + i + "]:" + sqlItem);
                                        request.query(sqlItem, function (err, result) {
                                            if (err) {
                                                console.log(err);
                                                callback(err, null);
                                                return;
                                            }
                                            console.log('第' + (i + 1) + '条语句成功');
                                            callback(null, result)
                                            i++;
                                        });
                                    });

                                    async.series(tasks, function (err, result) {
                                        if (err) {
                                            console.log('出现错误,执行回滚');
                                            if (!rolledBack) {
                                                //如果sql语句错误会自动回滚,如果程序错误手动执行回滚,不然事物会一致挂起.  
                                                transaction.rollback(function (err) {
                                                    if (err) {
                                                        console.log('rollback err :', err);
                                                        return;
                                                    }
                                                    console.log('回滚成功');
                                                });
                                            }
                                            res.json({ err_code: 1, err_msg: err });
                                        } else {
                                            console.log('无错误,执行提交');
                                            //执行提交  
                                            transaction.commit(function (err) {
                                                if (err) {
                                                    console.log('commit err :', err);
                                                    return;
                                                }
                                                console.log('提交成功');
                                                res.json({ err_code: 0, err_msg: 'insert success!' });
                                            });
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }       
    });
});

module.exports = router;