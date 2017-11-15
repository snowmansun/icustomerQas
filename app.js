/**************************导入需要的包************************************************/
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
/**************************express配置模板视图**********************************/
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
/**************************设置跨域访问***************************/
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    next();
});
/**************************引入要使用的模块**********************************************/
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
/**************************node路由配置**********************************/
app.use('/', require('./routes/index'));
app.use('/outlet', require('./routes/outlet'));
app.use('/product', require('./routes/product'));
app.use('/auth', require('./routes/auth'));
app.use('/photo', require('./routes/photo'));
app.use('/order', require('./routes/order'));
app.use('/contact', require('./routes/contact'));
app.use('/register', require('./routes/register'));
app.use('/smsapi', require('./routes/SMSAPI'));



/**************************捕获异常***********************************/
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
