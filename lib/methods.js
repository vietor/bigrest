var fs = require('fs');
var path = require('path');
var utils = require('./utils');

function setup(namespace, filepath) {
    var filenames = fs.readdirSync(filepath);
    filenames.forEach(function(filename) {
        var pos = filename.lastIndexOf('.');
        if(pos < 1)
            return;
        var prefix = filename.substr(0, pos);
        var stuffix = filename.substr(pos + 1);
        if(stuffix === "js")
            utils.nsBind(namespace, path.join(filepath, prefix), function(key, value) {
                var usage = false;
                switch(typeof value) {
                case "number":
                    usage = key == key.toUpperCase();
                    break;
                case "function":
                    usage = key == key.toLowerCase();
                    break;
                }
                return usage;
            });
    });
};

exports.setup = setup;
