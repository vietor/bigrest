'use strict';

exports.test_failure = function(req, res, name, type) {
    res.status(400).send(type);
};

exports.test_interceptor = function(req, res) {
    return function(next) {
        next(true);
    };
};

exports.test_parameter = function(req, res) {
    brmethods.test(req.param("key"), function(err, text) {
        res.send({
            result: text
        });
    });
};
