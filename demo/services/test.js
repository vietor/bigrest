"use strict";

exports.test_interceptor = function(req, res) {
    if(req.param('false') == '1') {
        res.send('has false=1');
        return false;
    }
    if(req.param('throw') == '1') {
        return false;
    }
    return true;
};

exports.test_get = function(req, res) {
    res.send('GET, OK');
};

exports.test_post = function(req, res) {
    res.send('POST, OK');
};

exports.test_throw = function(req, res) {
    brmx.test_throw(function() {
        res.send('Throw OK');
    });
};

exports.test_throw_send = function(req, res) {
    res.end();
    brmx.test_throw(function() {
        res.send('Throw Send OK');
    });
};
