"use strict";

var fs = require('fs');
var util = require('util');
var domain = require('domain');

function isNullOrUndefined(obj) {
    if (util.isNullOrUndefined)
        return util.isNullOrUndefined(obj);
    else
        return (typeof obj == 'undefined' || obj === null);
}


function mkArray(obj) {
    if (isNullOrUndefined(obj))
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

function eachArrayLike(objs, iteratee) {
    for (var i = 0, length = objs.length; i < length; i++) {
        iteratee(objs[i], i, objs);
    }
}

function eachArray(obj, iteratee) {
    eachArrayLike(mkArray(obj), iteratee);
}

function eachObjectProperty(obj, iteratee) {
    eachArray(Object.keys(obj), function(key) {
        iteratee(key, obj[key]);
    });
}

exports.toArray = toArray;
exports.mkArray = mkArray;
exports.isArray = util.isArray;
exports.eachArray = eachArray;
exports.eachArrayLike = eachArrayLike;
exports.isNullOrUndefined = isNullOrUndefined;
exports.eachObjectProperty = eachObjectProperty;

exports.nsBind = function(namespace, modulepath, checker) {
    var container = require(modulepath);
    if (container.disable)
        return;
    eachArray(Object.keys(container), function(key) {
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
    eachArray(Object.keys(extend), function(key) {
        obj[key] = extend[key];
    });
}

exports.objExtend = function() {
    var out = {};
    eachArrayLike(arguments, function(obj) {
        if (obj)
            extendObject(out, obj);
    });
    return out;
};

exports.mergeArray = function() {
    var out = null;
    eachArrayLike(arguments, function(obj) {
        if (obj) {
            if (!out)
                out = mkArray(obj);
            else
                out = out.concat(mkArray(obj));
        }
    });
    return out ? out : [];
};

exports.optBoolean = function(value, defaultValue) {
    if (!defaultValue)
        defaultValue = false;
    if (isNullOrUndefined(value))
        return defaultValue;
    else
        return !!value;
};

function defaultArrayEqTest(a, b) {
    return a == b;
}

exports.unionArray = function(objs, eqTest) {
    if (!eqTest)
        eqTest = defaultArrayEqTest;
    var i, il, j, jl, v, eq, out = [];
    for (i = 0, il = objs.length; i < il; ++i) {
        eq = false;
        v = objs[i];
        for (j = 0, jl = out.length; j < jl; ++j) {
            if (eqTest(v, out[j])) {
                eq = true;
                break;
            }
        }
        if (!eq)
            out.push(v);
    }
    return out;
};

exports.readFileText = function(file) {
    return fs.readFileSync(__dirname + '/files/' + file, 'utf8');
};

exports.renderTemplateText = function(text, params) {
    var retval = text;
    eachArray(Object.keys(params), function(key) {
        var value = params[key];
        retval = retval.replace(new RegExp("{{" + key + "}}", "g"), value);
    });
    return retval;
};
