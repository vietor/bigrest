var fs = require('fs');
var path = require('path');

function bind(namespace, modulepath) {
    var container = require(modulepath);
    if(container["disable"])
        return;
    Object.keys(container).forEach(function(key) {
        var value = container[key];
        var usage = false;
        switch(typeof value) {
        case "number":
            usage = key == key.toUpperCase();
            break;
        case "function":
            usage = key == key.toLowerCase();
            break;
        }
        if(usage) {
            if(namespace[key])
                throw new Error('Duplicated key: ' + key);
            namespace[key] = value;
        }
    });
}

function setup(namespace, filepath) {
    var filenames = fs.readdirSync(filepath);
    filenames.forEach(function(filename) {
        var pos = filename.lastIndexOf('.');
        if(pos < 1)
            return;
        var prefix = filename.substr(0, pos);
        var stuffix = filename.substr(pos + 1);
        if(stuffix === "js")
            bind(namespace, path.join(filepath, prefix));
    });
};

exports.setup = setup;
