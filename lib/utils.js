var util = require('util');

exports.isArray = util.isArray;

exports.toArray = function(obj) {
    if (typeof obj == 'undefined')
        return [];
    else if(typeof obj == 'string')
        return obj.split(',');
    else if(!util.isArray(obj))
        return [obj];
    else
        return obj;
};
