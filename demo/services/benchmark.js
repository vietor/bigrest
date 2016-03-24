'use strict';

exports.benchmark_empty = function(req, res) {
    brmx.benchmark(function() {
        res.send('OK');
    });
};

exports.benchmark_bigtext = function(req, res) {
    brmx.bigtext(function(err, text) {
        res.send(text);
    });
};
