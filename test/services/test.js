exports.test_failure = function(req, res, name, type) {
    if(name) {
        res.send("Nout found paramator: " + name + ", type: " + type);
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
