var express = require('express');
var router = express.Router();
//var db = require('../db/db');
var dbHelper = require('../db/dbHelper');

/* GET users listing. */
router.get('/info', function (req, res) {
    if (!req.query.accountnumber) {
        res.json({ err_code: 1, err_msg: 'miss param accountnumber' });
        return;
    }
    var query =
        'select ' +
        '    at.id as outlet_id, ' +
        '    at.accountnumber as code, ' +
        '    at.name as name, ' +
        '    ct.mobilephone as mobile, ' +
        '    ct.phone as tel, ' +
        '    at.ebmobile__address__c as address, ' +
        '    at.ebmobile__deliverydays__c as delivery_day, ' +
        '    \'CS\' as order_unit ' +
        'from account at ' +
        'inner join contact ct on at.id = ct.accountid and ct.ebmobile__primary__c = 1 ' +
        'where at.isdeleted=0 and ct.isdeleted=0 and at.accountnumber=\'' + req.query.accountnumber + '\'';
    dbHelper.query(query, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        if (result.length > 0) {
            query = 'select am.id as pic' +
                ' from ebmobile__accountgroupitem__c agi' +
                ' inner join ebmobile__accountgroup__c ag on agi.ebmobile__accountgroup__c = ag.id and ag.ebmobile__type__c = \'AD\'' +
                ' inner join attachment am on ag.id = am.parentid and am.name like \'AD_%\'' +
                ' where agi.ebmobile__account__c = \'' + result[0].outlet_id + '\'';
            dbHelper.query(query, function (err, resPic) {
                if (err) {
                    console.error(err);
                    return;
                }
                var res_json = {
                    outlet_id: result[0].outlet_id,
                    code: result[0].code,
                    name: result[0].name,
                    mobile: result[0].mobile,
                    tel: result[0].tel,
                    address: result[0].address,
                    delivery_day: result[0].delivery_day,
                    order_unit: result[0].order_unit,
                    banner_pic: resPic,
                    currency: {
                        symbol: '$',
                        thousand: ',',
                        decimal: '2',
                        position: 'before'
                    }
                };
                res.json(res_json);
            });
        }
        else {
            res.json({});
        }
    });
});

module.exports = router;