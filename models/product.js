var _Base = require('../db/_Base');
var util = require('util');

function Product(obj) {
    this.params = obj;
}

util.inherits(Product, _Base);
