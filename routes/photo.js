var express = require('express');
var router = express.Router();
//var db = require('../db/db');
var dbHelper = require('../db/dbHelper');

router.get('/', function (req, res) {
    if (!req.query.pic) {
        res.json({ err_code: 1, err_msg: 'miss param pic' });
        return;
    }

    var sql = 'select name,contenttype,bodylength,body from attachment where id=\'' + req.query.pic + '\'';

    dbHelper.query(sql, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        var res_json = {};
        if (result.length > 0) {
            var row = result[0];
            var body = row.body;
            var file_name = row.name;
            var length = row.bodylength;
            var content_type = row.contenttype;

            //返回json对象
            res_json = {
                content_type: content_type,
                body: body.toString()//.toString('base64')
            };

            //直接输出图片
            //res.writeHead(200, { 'Content-Type': content_type});
            //res.end(new Buffer(body.toString(),'base64'), 'binary');

            //返回html标签
            //res.writeHead(200, { 'Content-Type': 'text/html' });
            //res.end('<img src=\'data:' + content_type + ';base64,' + body.toString() + '\' />');
        }
        res.json(res_json);
    });
});
router.get('/list', function (req, res) {
    if (!req.query.pics) {
        res.json({ err_code: 2, err_msg: 'miss param pics' });
        return;
    }

    var picArr = req.query.pics.split(',');
    var picWhere = '';
    for (var i = 0; i < picArr.length; i++) {
        if (picWhere != '')
            picWhere = picWhere + ',';
        picWhere = picWhere + '\'' + picArr[i].toString() + '\'';
    }
    var sql = 'select id pic,contenttype content_type,body from attachment where id in (' + picWhere + ')';

    dbHelper.query(sql, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        var res_jsons = [];
        var items = result;
        items.forEach(function (item) {
            var obj = {};
            obj.pic = item.pic;
            obj.content_type = item.content_type;
            obj.body = item.body.toString();
            res_jsons.push(obj);
        });
        res.json(res_jsons);
    });
});

module.exports = router;