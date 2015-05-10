"use strict";

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

exports.nsBind = function(namespace, modulepath, checker) {
    var container = require(modulepath);
    if(container["disable"])
        return;
    Object.keys(container).forEach(function(key) {
        var usage = true;
        var value = container[key];
        if(checker)
            usage = checker(key, value);
        if(usage) {
            if(namespace[key])
                throw new Error('Duplicated key: ' + key);
            namespace[key] = value;
        }
    });
};