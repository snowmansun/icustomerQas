var express = require('express');
var router = express.Router();
var dbHelper = require('../db/dbHelper');

/* GET home page. */
router.post('/login', function (req, res) {
    //var model = {
    //    login: {
    //        required: true,
    //        isnull: false
    //    },
    //    pwd: {
    //        required: true,
    //        isnull: false
    //    }
    //};

    //for (var item in model) {

    //}

    //var query = 'select a.accountnumber customercode,c.name customername,c.accountid,u.Name salesrepname ' +
    //    '     , c.firstname,c.lastname, c.email, c.mobilephone ,u.Username salesrep,u.MobilePhone salesrepphone' +
    //    ' from contact  c ' +
    //    ' inner join account a on c.accountid = a.id ' +
    //    ' inner join [user] u on u.ebMobile__usercode__c = a.ebmobile__salesroute__c ' +
    //    ' where ebmobile__primary__c= 1 and a.accountnumber = \'503566289\'';

    if (!req.body.username || !req.body.password) {
        res.json({ err_code: 1, err_msg: 'miss param username or password' });
        return;
    }

    //var md5 = crypto.createHash('md5');
    //md5.update(req.body.password);
    //var pwd = md5.digest('hex');
    var pwd = req.body.password;
    var username = req.body.username;

    var query = 'select a.accountnumber customercode,a.name customername,a.id accountid,u.Name salesrepname,ar.Id uId ' +
        '     , ar.firstname, ar.lastname, ar.email, ar.mobile mobilephone, u.Username salesrep, u.MobilePhone salesrepphone ' +
        ' from account a ' +
        ' inner join [user] u on u.ebMobile__usercode__c = a.ebmobile__salesroute__c ' +
        ' INNER JOIN dbo.AccountMapping am ON am.AccountId = a.Id ' +
        ' INNER JOIN dbo.AccountRegistration ar ON am.RegistrationId = ar.Id ' +
        ' where a.isdeleted=0 AND (ar.UserCode = \'' + username + '\' OR ar.Mobile = \'' + username + '\') AND ar.Password = \'' + pwd + '\'';


    dbHelper.query(query, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        if (result.length > 0) {
            var res_json = {
                token: "9508f2cfb4e24fd98405e46e847166c1",
                expires_in: "7200",
                outlets: [result[0].customercode],
                user_info: {
                    uid: result[0].uId,//'00128000009h94AAAQ',
                    accountid: result[0].accountid,
                    firstname: result[0].firstname,
                    lastname: result[0].lastname,
                    customername: result[0].customername,
                    mobile: result[0].mobilephone,
                    tel: result[0].phone,
                    address: result[0].ebmobile__address__c,
                    email: result[0].email,
                    salesrep: result[0].salesrep,
                    salesrepname: result[0].salesrepname,
                    salesrepphone: result[0].salesrepphone,
                    head_pic: 'http://i.niupic.com/images/2017/01/11/fggYoq.jpg'
                },
                order_view: 'grid'
            };
            res.json(res_json);
        }
        else {
            res.json({ errocode: "1001", erromsg: "Invalid username or password." });
        }
    });
});

router.post('/changepwd', function (req, res) {
    if (!req.body.userid || !req.body.newpassword) {
        res.json({ err_code: 1, err_msg: 'miss param userid or newpassword' });
        return;
    }
    var uid = req.body.userid;
    var password = req.body.newpassword;
    var sql = 'UPDATE dbo.AccountRegistration SET Password=\'' + password + '\',UpdateDate=getdate() WHERE id=\'' + uid + '\'';
    dbHelper.query(sql, function (err, result) {
        if (err) {
            res.json({ err_code: 2, err_msg: 'change password failed!' });
            return;
        }
        else {
            res.json({ err_code: 0, err_msg: '' });
        }
    });
});

router.post('/changepwdbymobile', function (req, res) {
    if (!req.body.mobile || !req.body.password) {
        res.json({ err_code: 1, err_msg: 'miss param mobile or password' });
        return;
    }
    var mobile = req.body.mobile;
    var password = req.body.password;
    var sql = 'UPDATE dbo.AccountRegistration SET Password=\'' + password + '\',UpdateDate=getdate() WHERE Mobile=\'' + mobile + '\' And IsActive=1 ';
    dbHelper.query(sql, function (err, result) {
        if (err) {
            res.json({ err_code: 2, err_msg: 'change password failed!' });
            return;
        }
        else {
            res.json({ err_code: 0, err_msg: '' });
        }
    });
});

router.get('/logout', function (req, res) {
    var res_json = {
        err_code: "0",
        err_msg: "ok"
    }

    res.json(res_json);
});

module.exports = router;