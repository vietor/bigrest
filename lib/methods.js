"use strict";

var fs = require('fs');
var path = require('path');
var xutil = require('./xutil');

function filter(key, value) {
    var usage = false;
    switch (typeof value) {
        case "number":
        case "string":
            usage = key == key.toUpperCase();
            break;
        case "function":
            usage = key == key.toLowerCase();
            break;
    }
    return usage;
}

function setup(namespace, filepath) {
    if (fs.existsSync(path.join(filepath, "index.js")))
        xutil.nsBind(namespace, path.join(filepath, "index"), filter);
    xutil.forEach(fs.readdirSync(filepath), function(filename) {
        var pos = filename.lastIndexOf('.');
        if (pos < 1)
            return;
        var prefix = filename.substr(0, pos);
        var stuffix = filename.substr(pos + 1);
        if (stuffix != "js")
            return;
        if (prefix == 'index')
            return;
        xutil.nsBind(namespace, path.join(filepath, prefix), filter);
    });
}

exports.setup = setup;
