var express = require('express');
var request = require('request');
var router = express.Router();
var dbHelper = require('../db/dbHelper');

/* GET home page. */
router.get('/list', function (req, res) {
    if (!req.query.accountnumber) {
        res.json({ err_code: 1, err_msg: 'miss param accountnumber' });
        return;
    }
    var sql =
        ' SELECT * INTO #account_tmp FROM dbo.Account WHERE AccountNumber= \'' + req.query.accountnumber + '\' AND isDeleted= 0 ' +
        ' SELECT * INTO #pickList FROM ebMobile__PickListMaster__c  ' +
        ' WHERE(ebMobile__FieldName__c IN  (\'ebMobile__Category__c\', \'ebMobile__Brand__c\', \'ebMobile__Pack__c\')) ' +
        ' AND ebMobile__ObjectName__c = \'Product2\' ' +
        ' AND ebMobile__IsActive__c = 1 ' +
        ' AND IsDeleted = 0 ' +
        ' SELECT ROW_NUMBER() OVER(order by a.ishistorysku desc,a.ismusttohave desc,a.seq_category,a.seq_package,a.seq_brand,a.code) seq,* ' +
        ' FROM (SELECT' +
        '   productcode AS code,' +
        '   p.name AS name,' +
        '   isnull(p.ebMobile__Category__c,\'\') as category,' +
        '   ebmobile__flavor__c AS flavor,' +
        '   ebmobile__pack__c AS package,' +
        '   ebmobile__brand__c AS brand,' +
        '   category.ebMobile__Sequence__c AS seq_category,' +
        '   brand.ebMobile__Sequence__c AS seq_brand,' +
        '   package.ebMobile__Sequence__c AS seq_package,' +
        '   uom.ebmobile__denominator__c as denominator,' +
        '   am.id as pic,' +
        '   p.baseprice__c as price,' +
        '   case when mh.ebmobile__product__c is not null then 1 else 0 end as ismusttohave, ' +
        '   case when oi.ebmobile__product2__c is not null then 1 else 0 end as ishistorysku, ' +
        '   rsp.ebmobile__rsp__c revenue_ea ' +
        'FROM' +
        '   product2 p ' +
        '   inner join ebmobile__productuom__c uom on p.id = uom.ebmobile__productid__c and uom.ebmobile__isactive__c=1 and ebmobile__uomcode__c= \'EA\' ' +
        '   inner join ( ' +
        '       select distinct mh.ebmobile__product__c ' +
        '       from ebmobile__accountgroupitem__c agi ' +
        '       inner join ebmobile__accountgroup__c ag on agi.ebmobile__accountgroup__c = ag.id and ag.ebmobile__type__c = \'RED Survey\' ' +
        '       inner join ebmobile__musttohave__c mh on mh.ebmobile__accountgroup__c = ag.id and mh.ebmobile__isActive__c = 1 ' +
        '       inner join #account_tmp ac on ac.id=agi.ebmobile__account__c ' +
        '       where mh.IsDeleted=0 ' +
        '   ) mh on mh.ebmobile__Product__c = p.id  ' +
        '   left join ( ' +
        '       select distinct oi.ebmobile__product2__c ' +
        '       from orderitem oi ' +
        '       inner join ( ' +
        '           select top 5 o.ebmobile__ordernumber__c from [order] o ' +
        '           inner join #account_tmp ac on ac.id = o.accountid ' +
        '           order by o.ebmobile__orderdate__c desc ' +
        '       ) o on oi.ebmobile__ordernumber__c = o.ebmobile__ordernumber__c ' +
        '   ) oi on oi.ebmobile__product2__c=p.id ' +
        '   left join ( ' +
        '       select distinct pr.ebmobile__productid__c, pr.ebmobile__rsp__c ' +
        '       from ebmobile__accountgroupitem__c agi  ' +
        '       inner join ebmobile__accountgroup__c ag on agi.ebmobile__accountgroup__c = ag.id and ag.ebmobile__type__c = \'RSP\' ' +
        '       inner join #account_tmp ac on ac.id = agi.ebmobile__account__c ' +
        '       inner join ebmobile__productrsp__c pr on pr.ebmobile__accountgroupid__c = ag.id ' +
        '   ) rsp on rsp.ebmobile__productid__c = p.id ' +
        '   left join attachment am ON am.parentid = p.id  AND am.isDeleted=0 ' +
        '   left join #pickList category on category.ebMobile__PicklistValue__c=p.ebMobile__Category__c ' +
        '        and category.ebmobile__fieldname__c = \'ebMobile__Category__c\' ' +
        '   left join #pickList package on package.ebMobile__PicklistValue__c=p.ebmobile__pack__c ' +
        '        and package.ebmobile__fieldname__c = \'ebmobile__pack__c\' ' +
        '   left join #pickList brand on brand.ebMobile__PicklistValue__c=p.ebmobile__brand__c ' +
        '        and brand.ebmobile__fieldname__c = \'ebmobile__brand__c\' ' +
        ' Where p.isactive = 1) a ' +
        ' order by a.ishistorysku desc,a.ismusttohave desc,a.seq_category,a.seq_brand,a.seq_package,a.code '+
        ' DROP TABLE #account_tmp,#pickList';

    dbHelper.query(sql, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }

        getBasePrice(req.query.accountnumber, function (error, basePrice) {
            if (error) {
                var msg = 'call PE error: ' + error;
                console.error(msg);
                res.json({ err_code: 1, err_msg: msg });
                return;
            }

            result.forEach(function (item) {
                basePrice.forEach(function (itemPrice) {
                    if (item.code == itemPrice.productref) {
                        item.price = itemPrice.Value;
                    }
                });
            });

            res.json(result);
        });
        //res.json(result);
    });
});

/* GET home page. */
router.get('/attr', function (req, res) {
    var sql_brand =
        'SELECT ebMobile__PicklistValue__c "name", pm.ebMobile__Sequence__c seq, am.id pic ' +
        'FROM ebMobile__PickListMaster__c pm ' +
        'left join attachment  am on am.parentid = pm.id ' +
        'where pm.ebmobile__fieldname__c = \'ebMobile__Brand__c\' and pm.ebmobile__objectname__c = \'Product2\'' +
        '   and pm.IsDeleted=0 and pm.ebMobile__Sequence__c is not null ' +
        'order by pm.ebMobile__Sequence__c';
    var sql_flavor =
        'SELECT ebMobile__PicklistValue__c "name", pm.ebMobile__Sequence__c seq, am.id pic ' +
        'FROM ebMobile__PickListMaster__c pm ' +
        'left join attachment  am on am.parentid = pm.id ' +
        'where pm.ebmobile__fieldname__c = \'ebMobile__Flavor__c\' and pm.ebmobile__objectname__c = \'Product2\'' +
        '   and pm.IsDeleted = 0 and pm.ebMobile__Sequence__c is not null ' +
        'order by pm.ebMobile__Sequence__c';
    var sql_pack =
        'SELECT ebMobile__PicklistValue__c "name", pm.ebMobile__Sequence__c seq, am.id pic ' +
        'FROM ebMobile__PickListMaster__c pm ' +
        'left join attachment  am on am.parentid = pm.id ' +
        'where pm.ebmobile__fieldname__c = \'ebMobile__Pack__c\' and pm.ebmobile__objectname__c = \'Product2\'' +
        '   and pm.IsDeleted = 0 and pm.ebMobile__Sequence__c is not null ' +
        'order by pm.ebMobile__Sequence__c';

    var res_json = {
        brand: '',
        flavor: '',
        pack: ''
    }

    dbHelper.query(sql_brand, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        res_json.brand = result;
        dbHelper.query(sql_flavor, function (err, result) {
            if (err) {
                console.error(err);
                return;
            }
            res_json.flavor = result;
            dbHelper.query(sql_pack, function (err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                res_json.pack = result;
                res.json(res_json);
            });
        });
    });
});

/* call PE get base price */
var getBasePrice = function (cust_code, callback) {
    var post_options = {
        url: 'http://pricingcalcserviceqas.chinacloudsites.cn/pricingCalc.svc/GetBasePriceInfoByCusProd',
        method: 'POST',
        json: true,
        body: { "customerCode": cust_code, "products": [] }
    };

    request(post_options, function (error, res, body) {
        if (error || res.statusCode != 200) {
            callback(error + " StatusCode " + res.statusCode);
            return;
        }

        callback(error, eval(body));
    });
}

module.exports = router;