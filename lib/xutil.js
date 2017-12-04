"use strict";

var fs = require('fs');
var util = require('util');
var lodash = require('lodash');

exports.isArray = lodash.isArray;
exports.mapArray = lodash.map;
exports.forEach = lodash.forEach;
exports.objExtend = lodash.assignIn;
exports.isNullOrUndefined = lodash.isNil;

function forceArray(obj) {
    if (lodash.isNil(obj))
        return [];
    else if (!lodash.isArray(obj))
        return [obj];
    else
        return obj;
}

exports.parseArray = function(obj) {
    if (typeof obj == 'string')
        return obj.split(',');
    else
        return forceArray(obj);
};

exports.eachBreakArray = function(objs, iteratee) {
    var breaked = false;
    for (var i = 0, length = objs.length; i < length; i++) {
        if (iteratee(objs[i], i, objs)) {
            breaked = true;
            break;
        }
    }
    return breaked;
};

exports.nsBind = function(namespace, modulepath, checker) {
    var container = require(modulepath);
    if (container.disable)
        return;
    lodash.forEach(Object.keys(container), function(key) {
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

exports.mergeArray = function() {
    var out = null;
    lodash.forEach(arguments, function(obj) {
        if (!lodash.isNil(obj)) {
            if (!out)
                out = forceArray(obj);
            else
                out = out.concat(forceArray(obj));
        }
    });
    return out ? out : [];
};

exports.optBoolean = function(value, defaultValue) {
    if (!defaultValue)
        defaultValue = false;
    return lodash.isNil(value) ? defaultValue : !!value;
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
    lodash.forEach(Object.keys(params), function(key) {
        var value = params[key];
        retval = retval.replace(new RegExp("{{" + key + "}}", "g"), value);
    });
    return retval;
};
