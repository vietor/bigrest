exports.test_broken_processor = function(req, res, name) {
    if(name) {
        res.send("Nout found paramator: " + name);
    }
};

exports.test_interceptor = function(req, res) {
    return function(next) {
        next(true);
    };
};

exports.test = function(req, res) {
    brmethods.test(req.param("key"), function(err, text) {
        res.send({"result": text});
    });
};
