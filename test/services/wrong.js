'use strict';

exports.wrong_processor = function(req, res, name) {
    res.send(name || "OK");
};
