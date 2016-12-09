exports.test_interceptor = function(req, res) {
    console.log("test_interceptor");
    brcx.throwError();
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
