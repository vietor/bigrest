"use strict";

var util = require('util');
var domain = require('domain');

function mkArray(obj) {
    if (typeof obj == 'undefined')
        return [];
    else if(!util.isArray(obj))
        return [obj];
    else
        return obj;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

exports.mkArray = mkArray;
exports.isArray = util.isArray;

exports.toArray = function(obj) {
    if(typeof obj == 'string')
        return obj.split(',');
    else
        return mkArray(obj);
};

exports.nsBind = function(namespace, modulepath, checker) {
    var container = require(modulepath);
    if(container.disable)
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

exports.getFakeIp = function() {
    var first = 0;
    while([0, 10, 127, 169, 198, 224].indexOf(first) >= 0) {
        first = getRandomInt(1, 254);
    }
    return [
        first,
        getRandomInt(0, 254),
        getRandomInt(0, 254),
        getRandomInt(1, 254)
    ].join('.');
};

exports.createCatcher = function(simulator) {
    if(!simulator)
        return domain.create();
    else
        return {
            add: function() {},
            on: function(){},
            run: function(callback) {
                callback();
            }
        };
};

exports.objExtend = function(obj, extend) {
    if(!obj)
        obj = {};
    if(extend)
        Object.keys(extend).forEach(function(key) {
            obj[key] = extend[key];
        });
    return obj;
};
