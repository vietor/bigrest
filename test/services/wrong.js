'use strict';

exports.wrong_processor = function(req, res, name) {
    res.send(name || "OK");
};

exports.wrong_self_throw = function(req, res) {
    null.throw();
    res.send("OK");
};
