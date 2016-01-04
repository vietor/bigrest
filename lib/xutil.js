"use strict";

var util = require('util');
var domain = require('domain');

function mkArray(obj) {
    if (typeof obj == 'undefined' || obj === null)
        return [];
    else if (!util.isArray(obj))
        return [obj];
    else
        return obj;
}

function toArray(obj) {
    if (typeof obj == 'string')
        return obj.split(',');
    else
        return mkArray(obj);
}

function eachArray(items, processor) {
    mkArray(items).forEach(processor);
}

exports.toArray = toArray;
exports.mkArray = mkArray;
exports.isArray = util.isArray;
exports.eachArray = eachArray;

exports.nsBind = function(namespace, modulepath, checker) {
    var container = require(modulepath);
    if (container.disable)
        return;
    Object.keys(container).forEach(function(key) {
        var usage = true;
        var value = container[key];
        if (checker)
            usage = checker(key, value);
        if (usage) {
            if (namespace[key])
                throw new Error('Duplicated key: ' + key);
            namespace[key] = value;
        }
    });
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

exports.getFakeIp = function() {
    var first = 0;
    while ([0, 10, 127, 169, 198, 224].indexOf(first) >= 0) {
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
    if (!simulator)
        return domain.create();
    else
        return {
            add: function() {},
            on: function() {},
            run: function(callback) {
                callback();
            }
        };
};


function extendObject(obj, extend) {
    Object.keys(extend).forEach(function(key) {
        obj[key] = extend[key];
    });
}

exports.objExtend = function() {
    var out = {};
    for (var i = 0; i < arguments.length; ++i) {
        var item = arguments[i];
        if (item)
            extendObject(out, item);
    }
    return out;
};

exports.mergeArray = function() {
    var out = null;
    for (var i = 0; i < arguments.length; ++i) {
        var item = arguments[i];
        if (item) {
            if (!out)
                out = mkArray(item);
            else
                out = out.concat(mkArray(item));
        }
    }
    return out ? out : [];
};

function defaultArrayEqTest(a, b) {
    return a == b;
}

exports.unionArray = function(items, eqTest) {
    if (!eqTest)
        eqTest = defaultArrayEqTest;
    var i, j, v, eq, out = [];
    for (i = 0; i < items.length; ++i) {
        eq = false;
        v = items[i];
        if (out.length < 1)
            eq = true;
        else {
            for (j = 0; j < out.length; ++j) {
                if (eqTest(v, out[j])) {
                    eq = true;
                    break;
                }
            }
        }
        if (eq)
            out.push(v);
    }
    return out;
};
