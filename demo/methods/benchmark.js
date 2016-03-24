'use strict';

var crypto = require('crypto');

exports.benchmark = function(callback) {
    callback(null);
};

exports.bigtext = function(callback) {
    callback(null, crypto.randomBytes(16384).toString('hex'));
};
