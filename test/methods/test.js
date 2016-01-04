'use strict';

exports.test = function(key, callback) {
    brcommons.upperKey(key, function(ukey) {
        callback(null, brcommons.PREFIX + " is: " + ukey);
    });
};
